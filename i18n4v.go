package i18n4v

import (
	"encoding/json"
	"fmt"
	"github.com/pkg/errors"
	"golang.org/x/text/language"
	"io"
	"math"
	"strconv"
	"strings"
	"sync"
)

// Replace type is used for passing replacement parameters when translating.
type Replace map[string]interface{}

// Context type is used for passing context parameters when translating.
type Context map[string]string

// TranslatorFunction is a type of translation function
type TranslatorFunction func(text string, args ...interface{}) string

type pluralisationEntry struct {
	min         int64
	max         int64
	translation string
}

type translation struct {
	translation    string
	pluralisations []*pluralisationEntry
}

type contextEntry struct {
	matches Context
	values  map[string]*translation
}

/*
Translator type keeps translation dictionary and provides translation feature.

This instance is created via Create() functions. Or you can use default instance.
*/
type Translator struct {
	values        map[string]*translation
	globalContext Context
	contexts      []*contextEntry
}

var defaultFormatMap = Replace{}
var translators = make(map[language.Tag]*Translator)
var languages = []language.Tag{}
var matcher language.Matcher
var lock sync.Mutex

/*
Translate method returns translated text.

You can pass parameters like default text(string), count for pluralisation(int),
replacement parameters(i18n4v.Replace), context parameters(i18n4v.Context).
You can omit any parameters, but you should keep the order of them.
*/
func (t *Translator) Translate(text string, args ...interface{}) string {
	var context = t.globalContext
	var formatting = defaultFormatMap
	var number int64
	var hasNumber bool
	var hasDefaultText bool
	var defaultText string

	if len(args) == 4 {
		context = args[3].(Context)
	}

	if len(args) > 0 {
		switch t := args[0].(type) {
		case Replace:
			formatting = t
			if len(args) > 1 {
				if obj2, ok := args[1].(Context); ok {
					context = obj2
				}
			}
		case int:
			number = int64(t)
			hasNumber = true
			if len(args) > 1 {
				if obj, ok := args[1].(Replace); ok {
					formatting = obj
				}
			}
			if len(args) > 2 {
				if obj, ok := args[2].(Context); ok {
					context = obj
				}
			}
		case string:
			defaultText = t
			hasDefaultText = true
			offset := 1
			if len(args) > 1 {
				if n, ok := args[1].(int); ok {
					number = int64(n)
					hasNumber = true
					offset++
				}
			}
			if len(args) > offset {
				if obj, ok := args[offset].(Replace); ok {
					formatting = obj
				}
			}
			if !hasNumber && len(args) > 2 {
				if obj, ok := args[2].(Context); ok {
					context = obj
				}
			}
		default:
			panic("2nd argument of Translate() should be int or string or formatting params.")
		}
	}
	return t.translateText(text, number, hasNumber, formatting, context, defaultText, hasDefaultText)
}

func (t *Translator) translateText(text string, number int64, hasNumber bool, formatting Replace, context Context, defaultText string, hasDefaultText bool) string {
	foundContext, ok := t.getContextData(context)
	if ok {
		result, ok := t.findTranslation(text, number, hasNumber, formatting, foundContext.values)
		if ok {
			return result
		}
	}
	result, ok := t.findTranslation(text, number, hasNumber, formatting, t.values)
	if ok {
		return result
	}
	if hasDefaultText {
		return t.useOriginalText(defaultText, number, hasNumber, formatting)
	}
	return t.useOriginalText(text, number, hasNumber, formatting)
}

func (t *Translator) getContextData(context Context) (*contextEntry, bool) {
	for _, definedContext := range t.contexts {
		equal := true
		for key, value := range definedContext.matches {
			if value != context[key] {
				equal = false
				break
			}
		}
		if equal {
			return definedContext, true
		}
	}
	return nil, false
}

func (t *Translator) findTranslation(text string, number int64, hasNumber bool, formatting Replace, values map[string]*translation) (string, bool) {
	value := values[text]
	if value == nil {
		return "", false
	}
	if !hasNumber && len(value.pluralisations) == 0 {
		return applyFormatting(value.translation, formatting), true
	} else if hasNumber && len(value.pluralisations) != 0 {
		for _, pluralisation := range value.pluralisations {
			if pluralisation.min <= number && number <= pluralisation.max {
				return applyFormattingWithNumber(pluralisation.translation, number, formatting), true
			}
		}
	}
	return "", false
}

func (t *Translator) useOriginalText(text string, number int64, hasNumber bool, formatting Replace) string {
	if hasNumber {
		return applyFormattingWithNumber(text, number, formatting)
	}
	return applyFormatting(text, formatting)
}

func applyFormattingWithNumber(text string, num int64, format Replace) string {
	replaceMap := make([]string, len(format)*2+4)
	replaceMap[0] = "%n"
	replaceMap[1] = strconv.FormatInt(num, 10)
	replaceMap[2] = "-%n"
	replaceMap[3] = strconv.FormatInt(-num, 10)
	i := 2
	for key, value := range format {
		replaceMap[i*2] = "%{" + key + "}"
		replaceMap[i*2+1] = fmt.Sprintf("%v", value)
		i++
	}
	replacer := strings.NewReplacer(replaceMap...)
	return replacer.Replace(text)
}

func applyFormatting(text string, format Replace) string {
	replaceMap := make([]string, len(format)*2)
	i := 0
	for key, value := range format {
		replaceMap[i*2] = "%{" + key + "}"
		replaceMap[i*2+1] = fmt.Sprintf("%v", value)
		i++
	}
	replacer := strings.NewReplacer(replaceMap...)
	return replacer.Replace(text)
}

func convertNumber(value interface{}, defaultValue int64) (int64, bool) {
	tempValue, ok := value.(float64)
	if !ok {
		if value == nil {
			return defaultValue, true
		}
		return 0, false
	}
	return int64(tempValue), true
}

type tmpContext struct {
	Matches map[string]string      `json:"matches"`
	Values  map[string]interface{} `json:"values"`
}

type tmpLoader struct {
	Values   map[string]interface{} `json:"values"`
	Contexts []tmpContext           `json:"contexts"`
}

func parseValue(context string, values map[string]*translation, key string, value interface{}) error {
	switch v := value.(type) {
	case string:
		values[key] = &translation{translation: v}
	case []interface{}:
		entry := &translation{}
		values[key] = entry
		for _, pluralisation := range v {
			pluralisationSpec, ok := pluralisation.([]interface{})
			if ok && len(pluralisationSpec) == 3 {
				min, ok := convertNumber(pluralisationSpec[0], math.MinInt64)
				if !ok {
					return errors.Errorf("First value of key '%s' at %s should be int, but '%v'", key, context, pluralisationSpec[0])
				}
				max, ok := convertNumber(pluralisationSpec[1], math.MaxInt64)
				if !ok {
					return errors.Errorf("Second value of key '%s' at %s should be int, but '%v'", key, context, pluralisationSpec[1])
				}
				translationWord, ok := pluralisationSpec[2].(string)
				if !ok {
					return errors.Errorf("Third value of key '%s' at %s should be string, but '%v'", key, context, pluralisationSpec[2])
				}
				entry.pluralisations = append(entry.pluralisations, &pluralisationEntry{
					min:         min,
					max:         max,
					translation: translationWord,
				})
			}
		}
	default:
		return errors.Errorf("value of key '%s' at %s should be string or pluralisation array, but '%v'", key, context, value)
	}
	return nil
}

func (t *Translator) add(reader io.Reader) error {
	loader := &tmpLoader{
		Values: make(map[string]interface{}),
	}
	dec := json.NewDecoder(reader)
	err := dec.Decode(loader)
	if err != nil {
		return errors.Wrap(err, "json parse error")
	}
	for key, value := range loader.Values {
		err = parseValue("root values", t.values, key, value)
		if err != nil {
			return err
		}
	}
	for i, contextSrc := range loader.Contexts {
		context := &contextEntry{
			matches: make(Context, len(contextSrc.Matches)),
			values:  make(map[string]*translation, len(contextSrc.Values)),
		}
		for key, value := range contextSrc.Matches {
			context.matches[key] = value
		}
		for key, value := range contextSrc.Values {
			err = parseValue(fmt.Sprintf("context[%d]", i), context.values, key, value)
			if err != nil {
				return err
			}
		}
		t.contexts = append(t.contexts, context)
	}

	return nil
}

func (t *Translator) AddWord(key, value string) {
	parseValue("root values", t.values, key, value)
}

/*
Create returns new Translator instance.

If JSON format is invalid, it returns error.
*/
func Create(reader io.Reader) (*Translator, error) {
	result := &Translator{
		values:        make(map[string]*translation),
		globalContext: make(Context),
	}
	err := result.add(reader)
	if err != nil {
		return nil, err
	}
	return result, err
}

/*
MustCreate returns new Translator instance.

If JSON format is invalid, it makes application panic.
It is good for static initialization.
*/
func MustCreate(reader io.Reader) *Translator {
	t, err := Create(reader)
	if err != nil {
		panic(err)
	}
	return t
}

/*
CreateFromString returns new Translator instance.
It is similar to Create, but it accepts string instead of []byte.

If JSON format is invalid, it returns error.
*/
func CreateFromString(json string) (*Translator, error) {
	return Create(strings.NewReader(json))
}

/*
MustCreateFromString returns new Translator instance.
It is similar to MustCreate, but it accepts string instead of []byte.

If JSON format is invalid, it makes application panic.
It is good for static initialization.
*/
func MustCreateFromString(json string) *Translator {
	t, err := Create(strings.NewReader(json))
	if err != nil {
		panic(err)
	}
	return t
}

var defaultTranslator = &Translator{
	values:        make(map[string]*translation),
	globalContext: make(Context),
}

/*
Translate function returns translated text.

It uses default Translator instance.
*/
func Translate(key string, args ...interface{}) string {
	return defaultTranslator.Translate(key, args...)
}

/*
Add registers dictionary to default Translator instance.

If JSON format is invalid, it returns error.

If tag is specified as 2nd parameter, it registers dictionary to specified language translator.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions
*/
func Add(reader io.Reader, tag ...language.Tag) error {
	lock.Lock()
	defer lock.Unlock()

	switch len(tag) {
	case 0:
		return defaultTranslator.add(reader)
	case 1:
		translator, ok := translators[tag[0]]
		if !ok {
			translator, err := Create(reader)
			if err != nil {
				return err
			}
			translators[tag[0]] = translator
			languages = append(languages, tag[0])
			matcher = nil
			return nil
		}
		return translator.add(reader)
	default:
		return errors.New("Only one tag is acceptable")
	}
}

/*
MustAdd registers dictionary to default Translator instance.

If JSON format is invalid, it makes application panic.
It is good for static initialization.

If tag is specified as 2nd parameter, it registers dictionary to specified language translator.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions
*/
func MustAdd(reader io.Reader, tag ...language.Tag) {
	err := Add(reader, tag...)
	if err != nil {
		panic(err)
	}
}

/*
AddFromString registers dictionary to default Translator instance.
It is similar to Add, but it accepts string instead of []byte.

If JSON format is invalid, it returns error.

If tag is specified as 2nd parameter, it registers dictionary to specified language translator.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions
*/
func AddFromString(json string, tag ...language.Tag) error {
	lock.Lock()
	defer lock.Unlock()

	return Add(strings.NewReader(json), tag...)
}

/*
MustAddFromString registers dictionary to default Translator instance.
It is similar to MustAdd, but it accepts string instead of []byte.

If JSON format is invalid, it makes application panic.
It is good for static initialization.

If tag is specified as 2nd parameter, it registers dictionary to specified language translator.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions
*/
func MustAddFromString(json string, tag ...language.Tag) {
	MustAdd(strings.NewReader(json), tag...)
}

/*
AddWord adds key and value pair to existing dictionary.
It is good for adding long text like email/html templates.
*/
func AddWord(key, value string, tag ...language.Tag) error {
	switch len(tag) {
	case 0:
		defaultTranslator.AddWord(key, value)
	case 1:
		translator, ok := translators[tag[0]]
		if !ok {
			return errors.New("Specified tag is not registered")
		}
		translator.AddWord(key, value)
	default:
		return errors.New("Only one tag is acceptable")
	}
	return nil
}

/*
Reset clears default Translator instance.
*/
func Reset() {
	defaultTranslator.values = make(map[string]*translation)
	defaultTranslator.globalContext = make(Context)
	translators = make(map[language.Tag]*Translator)
	languages = []language.Tag{}
	matcher = nil
}

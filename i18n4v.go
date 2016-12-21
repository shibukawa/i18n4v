/*
Package i18n4v provides i18n feature including pluralisation support, replacing kes, contextual translation
to Golang. It is a member of https://i18n4v.js.org family. JavaScript runtime and this packages uses
same translation format (JSON).

It supports translation via default translator instance or independent translator instances.

Default translator is good for command line tools.
To use default translator, you can initialize via Add() function (and AddFromString(), MustAdd(),
MustAddFromString()), and translate via global Translate() function.

Independent translator is good for web services, each client have their own preferred languages
(in Accept-Language header).
To use independent translator, you can create via Craete() function (and CreateFromString(), MustCreate(),
MustCreateFromStrgin()), and translate via Translate() method of the instance.

The simplest translation is selecting words from language JSON:

    i18n4v.MustAddFromString(`{
        "values": {
            "Cancel": "Cancelar"
        }
    }`)

    _ := i18n4v.Translate

    _("Cancel")  // -> Cancelar

The following JSON provides pluralisation support.
Each array contains matching pattern(minimum value and maximum value) and translation.
null means math.MinInt64 or math.MaxInt64. %n and -%n are replaced with the number in parameter:

    i18n4v.MustAddFromString(`{
        "values": {
            "%n comments": [
                [0, 0, "%n comments"],
                [1, 1, "%n comment"],
                [2, null, "%n comments"]
            ]
        }
    }`)

    _ := i18n4v.Translate

    _("%n comments", 1)  // -> 1 comment

%{key} is replaced via replacement parameters. Parameter should be passed via Replace container
(this is an alias of map[string]string):

    _ := i18n4v.Translate

    _("Welcome %{name}", i18n4v.Replace{"name":"John"})  // -> Welcome John

If translation is missing, it passes through translation keys as a translations.
You can pass text for fall back:

    _ := i18n4v.Translate

    _("_short_key", "This is a long piece of text")  // -> This is a long piece of text

Context feature supports selecting translations from context (like gender).
Of cource, you can use all features together that are described before:

    MustAddFromString(`{
        "contexts": [
            {
                "matches": {"gender": "male"},
                "values": {
                    "%{name} uploaded %n photos to their %{album} album": [
                          [0, 0, "%{name} uploaded %n photos to his %{album} album"],
                          [1, 1, "%{name} uploaded %n photo to his %{album} album"],
                          [2, null, "%{name} uploaded %n photos to his %{album} album"]
                    ]
                }
            },
            {
                "matches": {"gender":"female"},
                "values": {
                    "%{name} uploaded %n photos to their %{album} album": [
                          [0, 0, "%{name} uploaded %n photos to her %{album} album"],
                          [1, 1, "%{name} uploaded %n photo to her %{album} album"],
                          [2, null, "%{name} uploaded %n photos to her %{album} album"]
                    ]
                }
            }
        ]
    }`)

    _ := i18n4v.Translate

    _("%{name} uploaded %n photos to their %{album} album", 4,
        Replace{"name": "Jane", "album": "Hen's Night" },
        Context{"gender": "female" })
    // -> Jane uploaded 4 photos to her Hen's Night album

This package is released under MIT license.
*/
package i18n4v

import (
    "github.com/pkg/errors"
    "encoding/json"
    "strings"
    "strconv"
    "math"
    "fmt"
)

/*
Replace type is used for passing replacement parameters when translating.
*/
type Replace map[string]string

/*
Context type is used for passing context parameters when translating.
*/
type Context map[string]string

type pluralisationEntry struct {
    min int64
    max int64
    translation string
}

type translation struct {
    translation string
    pluralisations []*pluralisationEntry
}

type contextEntry struct {
    matches Context
    values map[string]*translation
}

/*
Translator type keeps translation dictionary and provides translation feature.

This instance is created via Create() functions. Or you can use default instance.
*/
type Translator struct {
    values map[string]*translation
    globalContext Context
    contexts []*contextEntry
}

var defaultFormatMap = Replace{}

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
    replaceMap := make([]string, len(format) * 2 + 4)
    replaceMap[0] = "%n"
    replaceMap[1] = strconv.FormatInt(num, 10)
    replaceMap[2] = "-%n"
    replaceMap[3] = strconv.FormatInt(-num, 10)
    i := 2
    for key, value := range format {
        replaceMap[i * 2] = "%{" + key + "}"
        replaceMap[i * 2 + 1] = value
        i++
    }
    replacer := strings.NewReplacer(replaceMap...)
    return replacer.Replace(text)
}

func applyFormatting(text string, format Replace) string {
    replaceMap := make([]string, len(format) * 2)
    i := 0
    for key, value := range format {
        replaceMap[i * 2] = "%{" + key + "}"
        replaceMap[i * 2 + 1] = value
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
    Matches map[string]string `json:"matches"`
    Values  map[string]interface{} `json:"values"`
}

type tmpLoader struct {
    Values  map[string]interface{} `json:"values"`
    Contexts []tmpContext `json:"contexts"`
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
                    min: min,
                    max: max,
                    translation: translationWord,
                })
            }
        }
    default:
        return errors.Errorf("value of key '%s' at %s should be string or pluralisation array, but '%v'", key, context, value)
    }
    return nil
}

func (t *Translator) add(jsonBytes []byte) error {
    loader := &tmpLoader{
        Values:  make(map[string]interface{}),
    }
    err := json.Unmarshal(jsonBytes, loader)
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
            values: make(map[string]*translation, len(contextSrc.Values)),
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

/*
Create returns new Translator instance.

If JSON format is invalid, it returns error.
*/
func Create(jsonBytes []byte) (*Translator, error) {
    result := &Translator{
        values: make(map[string]*translation),
        globalContext: make(Context),
    }
    err := result.add(jsonBytes)
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
func MustCreate(jsonBytes []byte) *Translator {
    t, err := Create(jsonBytes)
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
    return Create([]byte(json))
}

/*
MustCreateFromString returns new Translator instance.
It is similar to MustCreate, but it accepts string instead of []byte.

If JSON format is invalid, it makes application panic.
It is good for static initialization.
*/
func MustCreateFromString(json string) *Translator {
    t, err := Create([]byte(json))
    if err != nil {
        panic(err)
    }
    return t
}

var defaultTranslator = &Translator{
    values: make(map[string]*translation),
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
*/
func Add(jsonBytes []byte) error {
    return defaultTranslator.add(jsonBytes)
}

/*
MustAdd registers dictionary to default Translator instance.

If JSON format is invalid, it makes application panic.
It is good for static initialization.
*/
func MustAdd(jsonBytes []byte) {
    err := defaultTranslator.add(jsonBytes)
    if err != nil {
        panic(err)
    }
}

/*
AddFromString registers dictionary to default Translator instance.
It is similar to Add, but it accepts string instead of []byte.

If JSON format is invalid, it returns error.
*/
func AddFromString(json string) error {
    return Add([]byte(json))
}

/*
MustAddFromString registers dictionary to default Translator instance.
It is similar to MustAdd, but it accepts string instead of []byte.

If JSON format is invalid, it makes application panic.
It is good for static initialization.
*/
func MustAddFromString(json string) {
    MustAdd([]byte(json))
}

/*
Reset clears default Translator instance.
*/
func Reset() {
    defaultTranslator.values = make(map[string]*translation)
    defaultTranslator.globalContext = make(Context)
}

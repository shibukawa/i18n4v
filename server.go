package i18n4v

import (
	"golang.org/x/text/language"
	"net/http"
	"sync"
)

var translators = make(map[language.Tag]*Translator)
var languages = []language.Tag{}
var matcher language.Matcher
var lock sync.Mutex

type TranslatorFunction func(text string, args ...interface{}) string

/*
AddWithTag registers dictionary to translator lists.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions

If JSON format is invalid, it returns error.
*/
func AddWithTag(tag language.Tag, jsonBytes []byte) error {
	lock.Lock()
	defer lock.Unlock()
	translator, err := Create(jsonBytes)
	if err != nil {
		return err
	}
	translators[tag] = translator
	languages = append(languages, tag)
	matcher = nil
	return nil
}

/*
MustAddWithTag registers dictionary to translator lists.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions

If JSON format is invalid, it makes application panic.
It is good for static initialization.
*/
func MustAddWithTag(tag language.Tag, jsonBytes []byte) {
	lock.Lock()
	defer lock.Unlock()
	translators[tag] = MustCreate(jsonBytes)
	languages = append(languages, tag)
	matcher = nil
}

/*
AddFromStringWithTag registers dictionary to translator lists.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions
It is similar to AddWithTag, but it accepts string instead of []byte.

If JSON format is invalid, it returns error.
*/
func AddFromStringWithTag(tag language.Tag, json string) error {
	lock.Lock()
	defer lock.Unlock()
	translator, err := CreateFromString(json)
	if err != nil {
		return err
	}
	translators[tag] = translator
	languages = append(languages, tag)
	matcher = nil
	return nil
}

/*
MustAddFromStringWithTag registers dictionary to translator lists.
You can access the registered translator with Select, SelectTranslator
SelectTranslatorWithRequest, SelectWithRequest functions
It is similar to MustAddWithTag, but it accepts string instead of []byte.

If JSON format is invalid, it makes application panic.
It is good for static initialization.
*/
func MustAddFromStringWithTag(tag language.Tag, json string) {
	lock.Lock()
	defer lock.Unlock()
	translators[tag] = MustCreateFromString(json)
	languages = append(languages, tag)
	matcher = nil
}

/*
SelectTranslator returns Translator instance from registered ones.
*/
func SelectTranslator(lang string) *Translator {
	{
		lock.Lock()
		defer lock.Unlock()
		if matcher == nil {
			matcher = language.NewMatcher(languages)
		}
	}
	tag, _ := language.MatchStrings(matcher, lang)
	return translators[tag]
}

func SelectTranslatorWithRequest(r *http.Request) *Translator {
	return SelectTranslator(r.Header.Get("Accept-Language"))
}

func Select(lang string) TranslatorFunction {
	{
		lock.Lock()
		defer lock.Unlock()
		if matcher == nil {
			matcher = language.NewMatcher(languages)
		}
	}
	tag, _ := language.MatchStrings(matcher, lang)
	translator := translators[tag]
	return func(text string, args ...interface{}) string {
		return translator.Translate(text, args...)
	}
}

func SelectWithRequest(r *http.Request) TranslatorFunction {
	return Select(r.Header.Get("Accept-Language"))
}
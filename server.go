package i18n4v

import (
	"golang.org/x/text/language"
	"net/http"
)

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

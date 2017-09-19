package i18n4v

import (
	"golang.org/x/text/language"
	"testing"
)

func TestSelectLanguageCode(t *testing.T) {
	MustAddFromString("{}", language.English)
	MustAddFromString(`{
        "values": {
            "Cancel": "キャンセル"
        }
    }`, language.Japanese)

	// "en"
	__ := Select("en")
	if __("Cancel") != "Cancel" {
		t.Errorf("Translation error: %s", __("Cancel"))
	}

	// "ja"
	__ = Select("ja,en-us;q=0.7,en;q=0.3")
	if __("Cancel") != "キャンセル" {
		t.Errorf("Translation error: %s", __("Cancel"))
	}

	// "fallback: en"
	__ = Select("de,fr;q=0.7,pt;q=0.3")
	if __("Cancel") != "Cancel" {
		t.Errorf("Translation error: %s", __("Cancel"))
	}
}

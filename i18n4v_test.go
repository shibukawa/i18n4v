package i18n4v

import (
	"testing"
)

func TestCreate(t *testing.T) {
	ja := MustCreateFromString(`{
        "values": {
            "Cancel": "キャンセル"
        }
    }`)
	en := MustCreateFromString(`{
        "values": {
            "Cancel": "Cancel"
        }
    }`)
	pt := MustCreateFromString(`{
        "values": {
            "Cancel": "Cancelar"
        }
    }`)
	if ja.Translate("Cancel") != "キャンセル" {
		t.Errorf("Cancel should be translated into 'キャンセル' in Japanese, but %s", ja.Translate("Cancel"))
	}
	if en.Translate("Cancel") != "Cancel" {
		t.Errorf("Cancel should be translated into 'Cancel' in English, but %s", en.Translate("Cancel"))
	}
	if pt.Translate("Cancel") != "Cancelar" {
		t.Errorf("Cancel should be translated into 'Cancelar' in Portguese, but %s", pt.Translate("Cancel"))
	}
	if Translate("Hello") != "Hello" {
		t.Errorf("It should return key as is if the key is not registered, but %s", Translate("Hello"))
	}
	if Translate("Cancel") != "Cancel" {
		t.Errorf("It should return key as is if the key is not registered, but %s", Translate("Cancel"))
	}
}

func TestPluralisation1(t *testing.T) {
	en := MustCreateFromString(`{
        "values": {
            "%n comments": [
                [0, 0, "%n comments"],
                [1, 1, "%n comment"],
                [2, null, "%n comments"]
            ]
        }
    }`)
	if en.Translate("%n comments", 0) != "0 comments" {
		t.Errorf("It should select proper translated word from number and return '0 comments', but %s",
			en.Translate("%n comments", 0))
	}
	if en.Translate("%n comments", 1) != "1 comment" {
		t.Errorf("It should select proper translated word from number and return '1 comment', but %s",
			en.Translate("%n comments", 1))
	}
	if en.Translate("%n comments", 2) != "2 comments" {
		t.Errorf("It should select proper translated word from number and return '2 comments', but %s",
			en.Translate("%n comments", 2))
	}
}

func TestPluralisation2(t *testing.T) {
	en := MustCreateFromString(`{
        "values": {
            "Due in %n days": [
                  [null, -2, "Due -%n days ago"],
                  [-1, -1, "Due Yesterday"],
                  [0, 0, "Due Today"],
                  [1, 1, "Due Tomorrow"],
                  [2, null, "Due in %n days"]
            ]
        }
    }`)
	if en.Translate("Due in %n days", -2) != "Due 2 days ago" {
		t.Errorf("It should select proper translated word from number and return 'Due 2 days ago', but %s",
			en.Translate("Due in %n days", -2))
	}
	if en.Translate("Due in %n days", -1) != "Due Yesterday" {
		t.Errorf("It should select proper translated word from number and return 'Due Yesterday', but %s",
			en.Translate("Due in %n days", -1))
	}
	if en.Translate("Due in %n days", 0) != "Due Today" {
		t.Errorf("It should select proper translated word from number and return 'Due Today', but %s",
			en.Translate("Due in %n days", 0))
	}
	if en.Translate("Due in %n days", 1) != "Due Tomorrow" {
		t.Errorf("It should select proper translated word from number and return 'Due Tomorrow', but %s",
			en.Translate("Due in %n days", 1))
	}
	if en.Translate("Due in %n days", 2) != "Due in 2 days" {
		t.Errorf("It should select proper translated word from number and return 'Due in 2 days', but %s",
			en.Translate("Due in %n days", 2))
	}
}

func TestReplace(t *testing.T) {
	en := MustCreateFromString(`{}`)
	if en.Translate("Welcome %{name}", Replace{"name": "John"}) != "Welcome John" {
		t.Errorf("It should replace placeholder with passed values and be 'Welcome John', but %s",
			en.Translate("Welcome %{name}", Replace{"name": "John"}))
	}
	r := en.Translate("Your charge is %{charge} dollars", Replace{"charge": 100})
	if r != "Your charge is 100 dollars" {
		t.Errorf("It should replace placeholder with passed values and be 'Your charge is 100 dollars', but %s", r)
	}
}

func TestDefaultText(t *testing.T) {
	en := MustCreateFromString(`{}`)
	if en.Translate("_short_key", "This is a long piece of text") != "This is a long piece of text" {
		t.Errorf("It should treat fall back into default text if the key is missing: %s != %s",
			en.Translate("_short_key", "This is a long piece of text"), "This is a long piece of text")
	}
}

func TestContext(t *testing.T) {
	en := MustCreateFromString(`{
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
	translate1 := en.Translate("%{name} uploaded %n photos to their %{album} album", 1,
		Replace{"name": "John", "album": "Buck's Night"},
		Context{"gender": "male"})
	if translate1 != "John uploaded 1 photo to his Buck's Night album" {
		t.Errorf("translated word should be 'John uploaded 1 photo to his Buck's Night album', but %s", translate1)
	}
	translate2 := en.Translate("%{name} uploaded %n photos to their %{album} album", 4,
		Replace{"name": "Jane", "album": "Hen's Night"},
		Context{"gender": "female"})
	if translate2 != "Jane uploaded 4 photos to her Hen's Night album" {
		t.Errorf("translated word should be 'John uploaded 4 photos to her Buck's Night album', but %s", translate2)
	}
}

func TestDefaultTranslator(t *testing.T) {
	MustAddFromString(`{
        "values": {
            "Hello": "こんにちは",
            "Yes": "はい",
            "No": "いいえ",
            "Ok": "Ok",
            "Cancel": "キャンセル",
            "%n comments": [
                [0, null, "%n コメント"]
            ],
            "_monkeys": "猿も木から落ちる"
        } 
    }`)
	defer Reset()
	if Translate("Hello") != "こんにちは" {
		t.Errorf("It should translate, but: %s != %s", Translate("Hello"), "こんにちは")
	}
	if Translate("%n comments", 0) != "0 コメント" {
		t.Errorf("It should translatee, but: %s != %s", Translate("%n comments", 0), "0 コメント")
	}
	if Translate("%n comments", 1) != "1 コメント" {
		t.Errorf("It should translatee, but: %s != %s", Translate("%n comments", 1), "1 コメント")
	}
	if Translate("%n comments", 2) != "2 コメント" {
		t.Errorf("It should translatee, but: %s != %s", Translate("%n comments", 2), "2 コメント")
	}
	if Translate("_short_key", "This is a long piece of text") != "This is a long piece of text" {
		t.Errorf("It should translatee, but: %s != %s", Translate("_short_key", "This is a long piece of text"), "This is a long piece of text")
	}
	if Translate("_monkeys") != "猿も木から落ちる" {
		t.Errorf("It should translatee, but: %s != %s", Translate("_monkeys"), "猿も木から落ちる")
	}
}

func TestDefaultTranslatorWithFullSpec(t *testing.T) {
	MustAddFromString(`{
        "contexts": [
            {
                "matches": {"gender": "male"},
                "values": {
                    "%{name} uploaded %n photos to their %{album} album": [
                        [0, null, "%{name}は彼の%{album}アルバムに写真%n枚をアップロードしました"]
                    ]
                }
            },
            {
                "matches": {"gender": "female"},
                "values": {
                    "%{name} uploaded %n photos to their %{album} album": [
                        [0, null, "%{name}は彼女の%{album}アルバムに写真%n枚をアップロードしました"]
                    ]
                }
            }
        ]
    }`)
	defer Reset()
	translate1 := Translate("%{name} uploaded %n photos to their %{album} album", 1,
		Replace{"name": "John", "album": "Buck's Night"},
		Context{"gender": "male"})
	if translate1 != "Johnは彼のBuck's Nightアルバムに写真1枚をアップロードしました" {
		t.Errorf("translated word should be 'Johnは彼のBuck's Nightアルバムに写真1枚をアップロードしました', but %s", translate1)
	}
	translate2 := Translate("%{name} uploaded %n photos to their %{album} album", 4,
		Replace{"name": "Jane", "album": "Hen's Night"},
		Context{"gender": "female"})
	if translate2 != "Janeは彼女のHen's Nightアルバムに写真4枚をアップロードしました" {
		t.Errorf("translated word should be 'Janeは彼女のHen's Nightアルバムに写真4枚をアップロードしました', but %s", translate2)
	}
}
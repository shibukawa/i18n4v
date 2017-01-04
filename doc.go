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

/* eslint-env node, mocha, es6 */

var i18n = require('../index');
var assert = require('power-assert');


describe('i18n with translator instances', function () {
    // Create a Japanese specific instance
    var ja = i18n.create({
        values: {
            "Cancel": "キャンセル"
        }
    });

    // Create an English specific instance
    var en = i18n.create({
        values: {
            "Cancel": "Cancel"
        }
    });

    // Create a Portguese specific instance
    var pt = i18n.create({
        values: {
            "Cancel": "Cancelar"
        }
    });

    it("can translate registered word", function () {
        assert(en("Cancel") === "Cancel");
        assert(ja("Cancel") === "キャンセル");
        assert(pt("Cancel") === "Cancelar");
    });

    it("can not translate unregistered word", function () {
        assert(i18n("Hello") === "Hello");
        assert(i18n("Cancel") === "Cancel");
    });
});

describe('en translator with full feature', function () {
    // Create an English specific instance
    var en = i18n.create({
        values: {
            "Cancel": "Cancel",
            "%n comments": [
                [0, 0, "%n comments"],
                [1, 1, "%n comment"],
                [2, null, "%n comments"]
            ],
            "Due in %n days": [
                  [null, -2, "Due -%n days ago"],
                  [-1, -1, "Due Yesterday"],
                  [0, 0, "Due Today"],
                  [1, 1, "Due Tomorrow"],
                  [2, null, "Due in %n days"],
            ]
        },
        contexts: [
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
    });

    it('can translate simple pluralisation', function () {
        assert(en("%n comments", 0) === "0 comments");
        assert(en("%n comments", 1) === "1 comment");
        assert(en("%n comments", 2) === "2 comments");
    });

    it('can translate complex pluralisation', function () {
        assert(en("Due in %n days", -2) === "Due 2 days ago");
        assert(en("Due in %n days", -1) === "Due Yesterday");
        assert(en("Due in %n days", 0) === "Due Today");
        assert(en("Due in %n days", 1) === "Due Tomorrow");
        assert(en("Due in %n days", 2) === "Due in 2 days");
    });

    it('can replace placeholder', function () {
        assert(en("Welcome %{name}", { name:"John" }) === "Welcome John");
    });

    it('can replacements, pluralisations and contexts', function () {
        assert(
            en("%{name} uploaded %n photos to their %{album} album", 1,
                { name:"John", album:"Buck's Night" },
                { gender:"male" }) === "John uploaded 1 photo to his Buck's Night album");

        assert(
            en("%{name} uploaded %n photos to their %{album} album", 4,
                { name:"Jane", album:"Hen's Night" },
                { gender:"female" }) === "Jane uploaded 4 photos to her Hen's Night album");
    });
});

describe('default i18n', function () {
    before(function () {
        i18n.translator.add({
            values: {
                "Hello": "こんにちは",
                "Yes": "はい",
                "No": "いいえ",
                "Ok": "Ok",
                "Cancel": "キャンセル",
                "%n comments": [
                    [0, null, "%n コメント"]
                ],
                "_monkeys": "猿も木から落ちる"
            },
            contexts: [
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
        });
    });

    it('can translate simple word', function () {
        assert(i18n("Hello") === "こんにちは");
    });

    it('can translate the Japanese pluralisation', function () {
        assert(i18n("%n comments", 0) === "0 コメント");
        assert(i18n("%n comments", 1) === "1 コメント");
        assert(i18n("%n comments", 2) === "2 コメント");
    });

    it('can translate with short keys with that reverts to default value', function () {
        assert(i18n("_short_key", "This is a long piece of text") === "This is a long piece of text");
        assert(i18n("_monkeys") === "猿も木から落ちる");
    });

    it('can replace placeholder', function () {
        assert(i18n("Welcome %{name}", { name:"John" }) === "Welcome John");
    });

    it('cat replace pluralisations and contexts -> Japanese', function () {
        assert(
            i18n("%{name} uploaded %n photos to their %{album} album", 1,
            { name:"John", album:"Buck's Night" },
            { gender:"male" }) === "Johnは彼のBuck's Nightアルバムに写真1枚をアップロードしました");

        assert(
            i18n("%{name} uploaded %n photos to their %{album} album", 4,
            { name:"Jane", album:"Hen's Night" },
            { gender:"female" }) === "Janeは彼女のHen's Nightアルバムに写真4枚をアップロードしました");
    });

    after(function () {
        i18n.translator.reset();
    });
});

describe('browser support', function () {
    var doc;
    before(function () {
        if (typeof document === 'undefined') {
            var jsdom = module.require("jsdom").jsdom;
            doc = jsdom([
                "<HTML><head></head><body>",
                "<span id=\"id1\" data-i18n>hello world</span>",
                "<span id=\"id2\" data-i18n=\"replace by key\">hello world</span>",
                "<span id=\"id3\" data-i18n=\"replace with tag\">hello world</span>",
                "<span id=\"id4\" data-i18n=\"replace with tag\" data-i18n-safe>hello world</span>",
                "<span id=\"id5\" data-i18n><b>hello world</b></span>",
                "<span id=\"id6\" data-i18n=\"replace by key\"><b>hello world</b></span>",
                "<span id=\"id7\" data-i18n data-i18n-safe><b>hello world</b></span>",
                "</body></HTML>"
            ].join(""));
        } else {
            doc = document;
        }
        i18n.translator.add({
            values: {
                "hello world":        "こんにちわ",
                "replace by key":     "こんにちわ",
                "replace with tag":   "<b>こんにちわ</b>",
                "<b>hello world</b>": "こんにちわ",
            }
        });

        // this method call changes DOM
        i18n.translator.applyToHTML(doc);
    });

    it('can replace static HTML content', function() {
        assert(doc.getElementById('id1').innerHTML === 'こんにちわ');
    });

    it('add translation key after replacing', function() {
        assert(doc.getElementById('id1').getAttribute('data-i18n') === 'hello world');
    });

    it('can replace static HTML content with key', function() {
        assert(doc.getElementById('id2').innerHTML === 'こんにちわ');
    });

    it('escapes translation content by default', function() {
        assert(doc.getElementById('id3').innerHTML === '&lt;b&gt;こんにちわ&lt;/b&gt;');
    });

    it('can pass tag if there is data-i18n-safe data attribute', function() {
        assert(doc.getElementById('id4').innerHTML === '<b>こんにちわ</b>');
    });

    it('does not replace by default if there are any tags as children ', function() {
        assert(doc.getElementById('id5').innerHTML === '<b>hello world</b>');
    });

    it('replaces by key even if there are any tags as children ', function() {
        assert(doc.getElementById('id6').innerHTML === 'こんにちわ');
    });

    it('replaces by key with safe attribute even if there are any tags as children ', function() {
        assert(doc.getElementById('id7').innerHTML === 'こんにちわ');
    });

    after(function () {
        i18n.translator.reset();
    });
});

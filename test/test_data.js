/* eslint-env node, mocha, es6 */

'use strict';

const resolve = require('path').resolve;
const data = require('../src/data');
const assert = require('power-assert');

describe('parse/save JSON', () => {
    const simpleJSON = `{
        "values": {
            "Yes": "はい",
            "No": "いいえ",
            "Ok": "Ok",
            "Cancel": "キャンセル"
        }
    }`;

    const pluralisationJSON = `{
        "values": {
            "%n comments": [
                [0, 0, "%n comments"],
                [1, 1, "%n comment"],
                [2, null, "%n comments"]
            ]
        }
    }`;

    it('can parse simple setting from JSON string', () => {
        const words = data.loadJSON(simpleJSON);
        assert(words.valueKeys().length === 4);
        assert(words.contextKeys().length === 0);
    });

    it('can parse pluration setting from JSON string', () => {
        const words = data.loadJSON(pluralisationJSON);
        assert(words.valueKeys().length === 1);
        assert(words.contextKeys().length === 0);
        assert(words.values()[0].hasPluralisation());
        assert(words.values()[0].pluralisations.length === 3);
    });

    it('can read from local file', () => {
        return data.loadJSONFile(resolve(__dirname, 'sample.json')).then(words => {
            assert(words.valueKeys().length === 2);
            assert(words.contextKeys().length === 2);
            assert(words.contexts()[0].valueKeys().length === 1);
        });
    });

    it('can save to string', () => {
        return data.loadJSONFile(resolve(__dirname, 'sample.json')).then(words => {
            const jsonString = words.toJSON();
            const loadedWords = data.loadJSON(jsonString);
            assert(words.valueKeys().length === loadedWords.valueKeys().length);
            assert(words.contextKeys().length === loadedWords.contextKeys().length);
            assert(words.contexts()[0].valueKeys().length === loadedWords.contexts()[0].valueKeys().length);
        });
    });
});

describe('append value to data', () => {
    const sourceJSON = `
    {
        "values": {
            "Yes": "はい",
            "No": "いいえ"
        },
        "contexts": []
    }`;

    it('can addIfNotExists simple values', () => {
        const words = data.loadJSON(sourceJSON);
        assert(words.valueKeys().length === 2);
        words.addIfNotExists("Ok", "Ok");
        words.addIfNotExists("Ok", "Ok");
        words.addIfNotExists("Ok", "Ok");
        words.addIfNotExists("Ok", "Ok");
        words.addIfNotExists("Cancel", "キャンセル");
        words.addIfNotExists("Cancel", "キャンセル");
        words.addIfNotExists("Cancel", "キャンセル");
        words.addIfNotExists("Cancel", "キャンセル");
        assert(words.valueKeys().length === 4);
    });

    it('can addIfNotExists pluralisation values', () => {
        const words = data.loadJSON(sourceJSON);
        assert(words.valueKeys().length === 2);
        words.addIfNotExists("%n comments", [
            [0, 0, "%n comments"],
            [1, 1, "%n comment"],
            [2, null, "%n comments"]
        ]);
        assert(words.valueKeys().length === 3);
        assert(words.value("%n comments").hasPluralisation());
    });

    it('can addIfNotExists contexts', () => {
        const words = data.loadJSON(sourceJSON);
        const context = words.context({"gender": "male"});
        assert(context.valueKeys().length === 0);
        context.addIfNotExists("%{name} uploaded %n photos to their %{album} album", [
            [0, 0, "%{name}は彼の%{album}アルバムに写真%n枚をアップロードしました"]
        ]);
        assert(context.valueKeys().length === 1);
    });
});


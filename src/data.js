/* eslint-env node, es6 */

'use strict';

const fs = require('fs');


class Words {
    constructor() {
        this._values = {};
        this._contexts = {};
        this.warnings = [];
    }

    valueKeys() {
        return Object.keys(this._values);
    }

    values() {
        return this.valueKeys().map(key => {
            return this._values[key];
        });
    }

    value(key) {
        return this._values[key];
    }

    addIfNotExists(key, translation) {
        if (!this._values[key]) {
            this._values[key] = new Word(key, translation);
        } 
    }

    contextKeys() {
        return Object.keys(this._contexts);
    }

    contexts() {
        return this.contextKeys().map(key => {
            return this._contexts[key];
        });
    }

    context(json) {
        if (typeof(json) !== 'string') {
            json = JSON.stringify(json);
        }
        if (this._contexts[json]) {
            return this._contexts[json];
        }
        const context = new Words();
        this._contexts[json] = context;
        return context;
    }

    toJSON(converter, indent) {
        return JSON.stringify(this.toRawJSON(), converter, indent);
    }

    toRawJSON() {
        var hasValues = false;
        var hasContexts = false;
        const json = {
            values: {},
            contexts: this.contextKeys().map(key => {
                hasContexts = true;
                const result = this._contexts[key].toRawJSON();
                result.matches = JSON.parse(key);
                delete result.contexts;
                return result;
            })
        };
        this.valueKeys().forEach(key => {
            hasValues = true;
            json.values[key] = this._values[key].toJSON();
        });
        if (!hasValues) {
            delete json.values;
        }
        if (!hasContexts) {
            delete json.contexts;
        }
        return json;
    }
}


class Word {
    constructor(word, translation) {
        this._word = word;
        this.pluralisations = [];
        if (typeof(translation) === 'string') {
            this.pluralisations.push({min: null, max: null, word: translation});
        } else if (Array.isArray(translation)) {
            translation.forEach(pluralisation => {
                this.pluralisations.push({
                    min: pluralisation[0],
                    max: pluralisation[1],
                    word: pluralisation[2]
                });
            });
        }
    }

    hasPluralisation() {
        return this.pluralisations.length > 1;
    }

    word() {
        return this._word;
    }

    translation(index) {
        if (this.hasPluralisation()) {
            return this.pluralisations[index].word;
        }
        return this.pluralisations[0].word;
    }

    toJSON() {
        if (this.pluralisations.length === 0) {
            return undefined;
        } else if (this.pluralisations.length === 1) {
            return this.pluralisations[0].word;
        }
        this.pluralisations.map(pluralisation => {
            return [pluralisation.min, pluralisation.max, pluralisation.word];
        });
    }
}

function loadJSON(content) {
    const result = new Words();
    const json = JSON.parse(content);
    if (json.values) {
        Object.keys(json.values).forEach(key => {
            result._values[key] = new Word(key, json.values[key]);
        });
    }
    if (json.contexts) {
        json.contexts.forEach(context => {
            const contextValues = new Words();
            Object.keys(context.values).forEach(key => {
                contextValues._values[key] = new Word(key, context.values[key]);
            });
            result._contexts[JSON.stringify(context.matches)] = contextValues;
        });
    }
    return result;
}

function loadJSONFile(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(loadJSON(data));
        });
    });
}

module.exports = {
    Words: Words,
    Word: Word,
    loadJSON: loadJSON,
    loadJSONFile: loadJSONFile
};

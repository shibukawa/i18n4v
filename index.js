/* eslint-env node, amd */
(function (name, context, definition) {
      if (typeof module !== 'undefined' && module.exports)
            module.exports = definition();
      else if (typeof define === 'function' && define.amd)
            define(name, definition);
      else
            context[name] = definition();
})('i18n', this, function () {

'use strict';

var beforeIE8  = (function() {
    if (typeof navigator === 'undefined') {
        return false;
    }
    var nav = navigator.userAgent.toLowerCase();
    return (nav.indexOf('msie') !== -1) ? parseInt(nav.split('msie')[1]) < 9 : false;
})();

function Translator() {
    this.data = {
        values: {},
        contexts: []
    };
    this.globalContext = {};
    this.updateCallbacks = {};
}

Translator.prototype.translate = function (text, defaultNumOrFormatting, numOrFormattingOrContext, formattingOrContext, context) {
    var defaultText, formatting, num;

    if (context == null) {
        context = this.globalContext;
    }
    var isObject = function (obj) {
        var type = typeof obj;
        return type === "function" || type === "object" && !!obj;
    };
    if (isObject(defaultNumOrFormatting)) {
        defaultText = null;
        num = null;
        formatting = defaultNumOrFormatting;
        context = numOrFormattingOrContext || this.globalContext;
    } else {
        if (typeof defaultNumOrFormatting === "number") {
            defaultText = null;
            num = defaultNumOrFormatting;
            formatting = numOrFormattingOrContext;
            context = formattingOrContext || this.globalContext;
        } else {
            defaultText = defaultNumOrFormatting;
            if (typeof numOrFormattingOrContext === "number") {
                num = numOrFormattingOrContext;
                formatting = formattingOrContext;
            } else {
                num = null;
                formatting = numOrFormattingOrContext;
                context = formattingOrContext || this.globalContext;
            }
        }
    }
    if (isObject(text)) {
        if (isObject(text['i18n'])) {
            text = text['i18n'];
        }
        return this.translateHash(text, context);
    } else {
        return this.translateText(text, num, formatting, context, defaultText);
    }
};

Translator.prototype.addCallback = function (callback) {
    var epoch = Date.now();
    while (this.updateCallbacks[epoch]) {
        epoch++;
    }
    this.updateCallbacks[epoch] = callback;
    return epoch;
};

Translator.prototype.removeCallback = function (key) {
    delete this.updateCallbacks[key];
};

Translator.prototype.add = function (d, lang) {
    var results;
    if (d.values != null) {
        var ref = d.values;
        for (var k in ref) {
            this.data.values[k] = ref[k];
        }
    }
    if (d.contexts != null) {
        var ref1 = d.contexts;
        results = [];
        for (var i = 0, len = ref1.length; i < len; i++) {
            results.push(this.data.contexts.push(ref1[i]));
        }
    }
    for (var callbackKey in this.updateCallbacks) {
        if (this.updateCallbacks.hasOwnProperty(callbackKey)) {
            this.updateCallbacks[callbackKey](lang);
        }
    }
    return results;
};

Translator.prototype.setContext = function (key, value) {
    return this.globalContext[key] = value;
};

Translator.prototype.clearContext = function (key) {
    return this.globalContext[key] = null;
};

Translator.prototype.reset = function () {
    this.resetData();
    return this.resetContext();
};

Translator.prototype.resetData = function () {
    return this.data = {
        values: {},
        contexts: []
    };
};

Translator.prototype.resetContext = function () {
    return this.globalContext = {};
};

Translator.prototype.translateHash = function (hash, context) {
    for (var k in hash) {
        var v = hash[k];
        if (typeof v === "string") {
            hash[k] = this.translateText(v, null, null, context);
        }
    }
    return hash;
};

Translator.prototype.translateText = function (text, num, formatting, context, defaultText) {
    var result;
    if (context == null) {
        context = this.globalContext;
    }
    if (this.data == null) {
        return this.useOriginalText(defaultText || text, num, formatting);
    }
    var contextData = this.getContextData(this.data, context);
    if (contextData != null) {
        result = this.findTranslation(text, num, formatting, contextData.values, defaultText);
    }
    if (result == null) {
        result = this.findTranslation(text, num, formatting, this.data.values, defaultText);
    }
    if (result == null) {
        return this.useOriginalText(defaultText || text, num, formatting);
    }
    return result;
};

Translator.prototype.findTranslation = function (text, num, formatting, data) {
    var value = data[text];
    if (value == null) {
        return null;
    }
    if (num == null) {
        if (typeof value === "string") {
          return this.applyFormatting(value, num, formatting);
        }
    } else {
        if (value instanceof Array || value.length) {
            for (var i = 0, len = value.length; i < len; i++) {
                var triple = value[i];
                if ((num >= triple[0] || triple[0] === null) && (num <= triple[1] || triple[1] === null)) {
                    var result = this.applyFormatting(triple[2].replace("-%n", String(-num)), num, formatting);
                    return this.applyFormatting(result.replace("%n", String(num)), num, formatting);
                }
            }
        }
    }
    return null;
};

Translator.prototype.getContextData = function (data, context) {
    if (data.contexts == null) {
        return null;
    }
    var ref = data.contexts;
    for (var i = 0, len = ref.length; i < len; i++) {
        var c = ref[i];
        var equal = true;
        var ref1 = c.matches;
        for (var key in ref1) {
            equal = equal && ref1[key] === context[key];
        }
        if (equal) {
            return c;
        }
    }
    return null;
};

Translator.prototype.useOriginalText = function (text, num, formatting) {
    if (num == null) {
        return this.applyFormatting(text, num, formatting);
    }
    return this.applyFormatting(text.replace("%n", String(num)), num, formatting);
};

Translator.prototype.applyFormatting = function (text, num, formatting) {
    var ind, regex;

    for (ind in formatting) {
        regex = new RegExp("%{" + ind + "}", "g");
        text = text.replace(regex, formatting[ind]);
    }
    return text;
};

Translator.prototype.applyToHTML = function (doc) {
    doc = (typeof doc === 'undefined') ? document : doc;
    var elems = doc.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        var key = elem.getAttribute('data-i18n');
        var hasSafe = elem.hasAttribute('data-i18n-safe');
        if (!key) {
            if (elem.childNodes.length !== 1) {
                elem.removeAttribute('data-i18n');
                continue;
            }
            var child = elem.childNodes[0];
            if (child.nodeType !== 3) {
                if (hasSafe) {
                    key = elem.innerHTML;
                } else {
                    elem.removeAttribute('data-i18n');
                    continue;
                }
            } else {
                key = elem.childNodes[0].nodeValue;
                elem.setAttribute('data-i18n', key);
            }
        }
        if (hasSafe) {
            elem.innerHTML = this.translate(key);                
        } else if (beforeIE8) {
            elem.innerHTML = this.translate(key).replace(/[&'`"<>]/g, function (match) {
                return {
                  '&': '&amp;',
                  "'": '&#x27;',
                  '`': '&#x60;',
                  '"': '&quot;',
                  '<': '&lt;',
                  '>': '&gt;',
                }[match];
            });
        } else {
            elem.textContent = this.translate(key);
        }
    } 
};

Translator.prototype.setLanguage = function (language, storage) {
    if (!storage && typeof(localStorage) !== 'undefined') {
        storage = localStorage;
    }
    if (storage) {
        storage.setItem('i18n4v.language', language);
    } else {
        throw new Error('localStorage is needed to store language');
    }
};

Translator.prototype.selectLanguage = function (languages, callback, storage) {
    var self = this;
    if (callback) {
        this._selectLanguage(languages, callback, storage);
        return;
    }
    if (typeof(Promise) === 'undefined') {
        throw new Error('selectLanguage needs callback function or Promise should be supported');
    } 
    return new Promise(function (resolve, reject) {
        self._selectLanguage(languages, function (err, lang) {
            if (!err) {
                reject(err);
            } else {
                resolve(lang);
            }
        }, storage);
    });
};

Translator.prototype._selectLanguage = function (languages, callback, storage) {
    var preferredLanguages = [];
    function select() {
        for (var i = 0; i < preferredLanguages.length; i++) {
            var lang = preferredLanguages[0];
            if (languages.indexOf(lang) !== -1) {
                return callback(null, lang);
            }
        }
        callback(new Error('preferred Language is not found'), null);
    }
    if (!storage && typeof(localStorage) !== 'undefined') {
        storage = localStorage;
    }
    if (storage) {
        var lang = storage.getItem('i18n4v.language');
        if (languages.indexOf(lang) !== -1) {
            return callback(null, lang);
        }
    }
    if (typeof module !== 'undefined' && module.require) {
        module.require('os-locale')(function (err, lang) {
            preferredLanguages.push(lang, lang.split('_')[0]);
            select();
        });
    } else {
        preferredLanguages.push(navigator.language);
        var i;
        for (i = 0; i < navigator.languages.length; i++) {
            preferredLanguages.push(navigator.languages[i]);
        }
        for (i = 0; i < navigator.languages.length; i++) {
            preferredLanguages.push(navigator.languages[i].split('_')[0]);
        }
        select();
    }
};

var translator = new Translator();

var i18n = function () {
    return translator.translate.apply(translator, arguments);
}; 

i18n.translator = translator;

i18n.create = function (data) {
    var trans = new Translator();
    if (data != null) {
        trans.add(data);
    }
    trans.translate.create = i18n.create;
    return function () {
        return trans.translate.apply(trans, arguments);
    }; 
};

return i18n;
});

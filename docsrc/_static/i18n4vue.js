/* eslint-env node, amd */
/* global i18n */
(function (name, context, definition) {
    if (typeof module !== 'undefined' && module.exports && require) {
        var i18n4v = require('i18n4v'); 
        module.exports = definition(i18n4v);
    } else if (typeof define === 'function' && define.amd) {
        define(name, ['i18n'], definition);
    } else {
        context[name] = definition(context.i18n);
    }
})('i18n4vue', this, function (i18n4v) {

function apply(elem, i18n, key, hasSafe) {
    if (hasSafe) {
        elem.innerHTML = i18n(key);                
    } else {
        elem.textContent = i18n(key);
    }
}

var i18n4vue = {}; 
i18n4vue.config = {};
i18n4vue.install = function (Vue, options) {
    var _i18n; 
    if (options) {
        if (options.i18n) {
            _i18n = options.i18n;
        } else if (options.translator) {
            _i18n = options;
        }
    } else if (typeof i18n !== 'undefined') {
        _i18n = i18n;
    } else {
        _i18n = i18n4v;
    }
    Vue.directive('i18n', {
        bind: function (el, bindings) {
            var key = el.getAttribute('data-i18n');
            if (!key) {
                var child = el.childNodes[0];
                if (child.nodeType === 3) {
                    key = el.childNodes[0].nodeValue ;
                    el.setAttribute('data-i18n', key);
                }
            }
            apply(el, _i18n, key, bindings.modifiers.safe);
        },
        update: function (el, bindings) {
            var key = el.getAttribute('data-i18n');
            apply(el, _i18n, key, bindings.modifiers.safe);
        }
    });

    Vue.mixin({
        data: function () {
            return {
                _i18n4vCallbackKey: null
            };
        },
        mounted: function () {
            var self = this;
            this._i18n4vCallbackKey = _i18n.translator.addCallback(function () {
                self.$forceUpdate();
            });
        },
        beforeDestroy: function () {
            if (this._i18n4vCallbackKey) {
                _i18n.translator.removeCallback(this._i18n4vCallbackKey);
            }
        },
        methods: {
            i18n: function () {
                return _i18n.apply(null, arguments);
            }
        }
    });
};

return i18n4vue;
});

/* eslint-env node, mocha, es6 */

'use strict';

const resolve = require('path').resolve;
const cli = require('../src/cli');
const assert = require('power-assert');
const Words = require('../src/data').Words;
const fs = require('fs');


describe('findFiles()', () => {
    const testDir = resolve(__dirname, '../_test');
    const defaultPattern = {
        jsInclude: /((\.js)|(\.ts)|(.jsx)|(.mjs))$/,
        htmlInclude: /((\.html)|(\.xhtml))$/
    };
    const excludePattern = {
        jsInclude: /((\.js)|(\.ts)|(.jsx)|(.mjs))$/,
        jsExclude: /((_exclude\.js)|(_exclude\.ts))$/,
        htmlInclude: /((\.html)|(\.xhtml))$/,
        htmlExclude: /((_exclude\.html)|(_exclude\.xhtml))$/
    };

    describe('Input is a file', () => {
        it('can find a single js file', () => {
            return cli.findFiles(resolve(testDir, 'sample.js'), defaultPattern)
            .then(files => {
                assert(files.js.length === 1);
                assert(files.html.length === 0);
            });
        });

        it('can reject a single js file that does not match pattern ', () => {
            return cli.findFiles(resolve(testDir, 'sample.coffee'), defaultPattern)
            .then(files => {
                assert(files.js.length === 0);
                assert(files.html.length === 0);
            });
        });

        it('can reject an excluded single js file', () => {
            return cli.findFiles(resolve(testDir, 'sample_exclude.js'), excludePattern)
            .then(files => {
                assert(files.js.length === 0);
                assert(files.html.length === 0);
            });
        });

        it('can find a single html file', () => {
            return cli.findFiles(resolve(testDir, 'sample.html'), defaultPattern)
            .then(files => {
                assert(files.js.length === 0);
                assert(files.html.length === 1);
            });
        });

        it('can reject a single html file that does not match pattern ', () => {
            return cli.findFiles(resolve(testDir, 'sample.coffee'), defaultPattern)
            .then(files => {
                assert(files.js.length === 0);
                assert(files.html.length === 0);
            });
        });

        it('can reject an excluded single html file', () => {
            return cli.findFiles(resolve(testDir, 'sample_exclude.html'), excludePattern)
            .then(files => {
                assert(files.js.length === 0);
                assert(files.html.length === 0);
            });
        });
    });

    describe('Input is a directory', () => {
        it('can find files in folder', () => {
            return cli.findFiles(resolve(testDir, 'child'), defaultPattern)
            .then(files => {
                assert(files.js.length === 4);
                assert(files.html.length === 2);
            });
        });

        it('can reject excluded files in folder', () => {
            return cli.findFiles(resolve(testDir, 'child'), excludePattern)
            .then(files => {
                assert(files.js.length === 2);
                assert(files.html.length === 1);
            });
        });

        it('can check folders recursively', () => {
            return cli.findFiles(testDir, excludePattern)
            .then(files => {
                assert(files.js.length === 3);
                assert(files.html.length === 2);
            });
        });
    });
});

describe('parseHTML()', () => {
    describe('simple tag with data-i18n data attribute', () => {
        const htmlSource = `
            <HTML><head></head><body>
            <span data-i18n>hello world</span>
            </body></HTML>
        `;

        it('can find elements', () => {
            const words = new Words();
            cli.parseHTML(words, htmlSource, 'dummy.html');
            assert(words.valueKeys().length === 1);
            assert(words.valueKeys()[0] === 'hello world');
            assert(words.warnings.length === 0);
        });
    });

    describe('simple tag with data-i18n data attribute', () => {
        const htmlSource = `
            <HTML><head></head><body>
            <span data-i18n="key1">hello world</span>
            </body></HTML>
        `;

        it('can find elements', () => {
            const words = new Words();
            cli.parseHTML(words, htmlSource, 'dummy.html');
            assert(words.valueKeys().length === 1);
            assert(words.valueKeys()[0] === 'key1');
            assert(words.warnings.length === 0);
        });
    });

    describe('simple tag with data-i18n data attribute', () => {
        const htmlSource = `
            <HTML><head></head><body>
            <span data-i18n="key2" data-i18n-safe><b>hello world</b></span>
            </body></HTML>
        `;

        it('can find elements', () => {
            const words = new Words();
            cli.parseHTML(words, htmlSource, 'dummy.html');
            assert(words.valueKeys().length === 1);
            assert(words.valueKeys()[0] === 'key2');
            assert(words.warnings.length === 0);
        });
    });

    describe('data-i18n does not have key and not text element', () => {
        const htmlSource = `
            <HTML><head></head><body>
            <span data-i18n><b>hello world</b></span>
            </body></HTML>
        `;

        it('can find elements', () => {
            const words = new Words();
            cli.parseHTML(words, htmlSource, 'dummy.html');
            assert(words.valueKeys().length === 0);
            assert(words.warnings.length === 1);
        });
    });

    describe('data-i18n does not have key and not text element but have data-i18n-safe', () => {
        const htmlSource = `
            <HTML><head></head><body>
            <span data-i18n data-i18n-safe><b>hello world</b></span>
            </body></HTML>
        `;

        it('can find elements', () => {
            const words = new Words();
            cli.parseHTML(words, htmlSource, 'dummy.html');
            assert(words.valueKeys().length === 1);
            assert(words.valueKeys()[0] === '<b>hello world</b>');
            assert(words.warnings.length === 0);
        });
    });
});

describe('parseJavaScript()', () => {
    describe('common.js direct assign', () => {
        const jsSource = `
            const i18n = require('i18n4v');
            const _ = require('i18n4v');

            i18n('hello world in string');
            _('hello world in string 2');
        `;

        it('can find string', () => {
            const words = new Words();
            cli.parseJavaScript(words, jsSource, 'dummy.js');
            assert(words.valueKeys().length === 2);
            assert(words.values()[0].word() === 'hello world in string');
            assert(!words.values()[0].hasPluralisation());
            assert(words.values()[1].word() === 'hello world in string 2');
            assert(!words.values()[1].hasPluralisation());
            assert(words.warnings.length === 0);
        });
    });

    describe('pluralisation support', () => {
        const jsSource = `
        (() => {
            const i18n = require('i18n4v');
            const _ = require('i18n4v');

            function main() {
                i18n('hello world in string', 2);
                _('hello world in string 2', 3);
            }
        })();

        i18n('this is out of scope');
        `;

        it('can find pluralisation string', () => {
            const words = new Words();
            cli.parseJavaScript(words, jsSource, 'dummy.js');
            assert(words.valueKeys().length === 2);
            assert(words.values()[0].word() === 'hello world in string');
            assert(words.values()[0].hasPluralisation());
            assert(words.values()[1].word() === 'hello world in string 2');
            assert(words.values()[1].hasPluralisation());
            assert(words.warnings.length === 0);
        });
    });
    
    describe('formatting support', () => {
        const jsSource = `
        (() => {
            const i18n = require('i18n4v');
            const _ = require('i18n4v');

            function main() {
                i18n('hello world in string %{name}', {name: 'argument'});
                _('hello world in string 2 %{name}', {name: 'arugument'});
            }
        })();

        i18n('this is out of scope');
        `;

        it('can find pluralisation string', () => {
            const words = new Words();
            cli.parseJavaScript(words, jsSource, 'dummy.js');
            assert(words.valueKeys().length === 2);
            assert(words.values()[0].word() === 'hello world in string %{name}');
            assert(words.values()[1].word() === 'hello world in string 2 %{name}');
            assert(words.warnings.length === 0);
        });
    });

    describe('context support', () => {
        const jsSource = `
        (() => {
            const i18n = require('i18n4v');
            const _ = require('i18n4v');

            function main() {
                console.log('test');
                i18n('hello world in string %{name}',
                    {name: 'argument'},
                    {gender: 'male'});
                _('hello world in string 2 %{name}',
                    {name: 'arugument'},
                    {'gender': 'female'});
            }
        })();

        i18n('this is out of scope');
        `;

        it('can find pluralisation string', () => {
            const words = new Words();
            cli.parseJavaScript(words, jsSource, 'dummy.js');
            assert(words.valueKeys().length === 0);
            assert(words.contextKeys().length === 2);
            assert(!words.context({gender: 'male'}).values()[0].hasPluralisation());
            assert(words.warnings.length === 0);
        });
    });

    describe('context and pluralisation support', () => {
        const jsSource = `
        (() => {
            'use strict';
            const i18n = require('i18n4v');
            const _ = require('i18n4v');

            function main() {
                'use strict';

                i18n('hello world in string %{name}', 4,
                    {name: 'argument'},
                    {gender: 'male'});
                _('hello world in string 2 %{name}', 5,
                    {name: 'arugument'},
                    {'gender': 'female'});
            }
        })();

        i18n('this is out of scope');
        `;

        it('can find pluralisation string', () => {
            const words = new Words();
            cli.parseJavaScript(words, jsSource, 'dummy.js');
            assert(words.valueKeys().length === 0);
            assert(words.contextKeys().length === 2);
            assert(words.context({'gender': 'male'}).values()[0].hasPluralisation());
            assert(words.warnings.length === 0);
        });
    });

    describe('test by actual file from local', () => {
        it('can process actual file', () => {
            return new Promise((finished, reject) => {
                const path = resolve(__dirname, '../_test/sample.js');
                fs.readFile(path, 'utf8', (err, source) => {
                    if (err) return reject(err);
                    const words = new Words();
                    cli.parseJavaScript(words, source, path, false, '../index');
                    assert(words.valueKeys().length !== 0);
                    finished();
                });
            });
        });
    });
});

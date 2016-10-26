/* eslint-env node, es6 */

'use strict';

const i18n = require('../index');
const path = require('path');
const fs = require('fs');
const jsdom = require('jsdom').jsdom;
const StatementPattern = require('es-pattern-match').StatementPattern;
const patternMatch = require('es-pattern-match').patternMatch;
const showSyntaxErrorDetail = require('./acorn-syntax-error');
const data = require('./data');


// default for unit testing
var matchImport = new StatementPattern({
    require: `__decl__ __anyname__ = require('i18n4v');`
});


function main(commander) {
    const patterns = {
        jsInclude: commander.jsInclude,
        jsExclude: commander.jsExclude,
        htmlInclude: commander.htmlInclude,
        htmlExclude: commander.htmlExclude
    };

    matchImport = new StatementPattern({
        require: `__decl__ __anyname__ = require('${commander.i18n}');`
    });

    var words;
    const loadedFiles = [];

    data.loadJSONFile(commander.output)
    .then((loadedWords) => {
        console.info(i18n('existing file was read: %{file}', {file: commander.output}));
        words = loadedWords; 
    },
    () => {
        console.info(i18n('create new file: %{file}', {file: commander.output}));
        words = new data.Words();
    })
    .then(() => {
        console.info(i18n('searching files...'));
        return Promise.all(
            commander.args.map(input => {
                return findFiles(input, patterns);
            })
        );
    })
    .then(allInputFiles => {
        console.info(i18n('start reading...'));
        const tasks = [];
        allInputFiles.forEach(inputFiles => {
            inputFiles.js.forEach(jsFile => {
                if (loadedFiles.indexOf(jsFile) === -1) {
                    loadedFiles.push(jsFile);
                    tasks.push(new Promise((resolve, reject) => {
                        console.info(i18n('  reading %{file}', {file: jsFile}));
                        fs.readFile(jsFile, 'utf8', (err, data) => {
                            if (err) {
                                return reject(err);
                            }
                            console.info(i18n('  processing %{file}', {file: jsFile}));
                            parseJavaScript(words, data, jsFile, commander.fillCopy);
                            resolve();
                        });
                    }));
                }
            });
            inputFiles.html.forEach(htmlFile => {
                if (loadedFiles.indexOf(htmlFile) === -1) {
                    loadedFiles.push(htmlFile);
                    tasks.push(new Promise((resolve, reject) => {
                        console.info(i18n('  reading %{file}', {file: htmlFile}));
                        fs.readFile(htmlFile, 'utf8', (err, data) => {
                            if (err) {
                                return reject(err);
                            }
                            console.info(i18n('  processing %{file}', {file: htmlFile}));
                            parseHTML(words, data, htmlFile, commander.fillCopy);
                            resolve();
                        });
                    }));
                }
            });
        });
        return Promise.all(tasks);
    }).then(() => {
        words.warnings.forEach(warning => {
            console.warn(warning);
        });
        return new Promise((resolve, reject) => {
            console.info(i18n('converting to JSON'));
            const json = words.toJSON(null, 4);
            console.info(i18n('writing to %{file}', {file: commander.output}));
            fs.writeFile(commander.output, json, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }).then(() => {
        console.info(i18n('finished'));
    }).catch((err) => {
        console.error(err);
    }); 
}


function findFiles(input, patterns) {
    return new Promise((resolve, reject) => {
        fs.stat(input, (err, stat) => {
            if (err) { return reject(err); }

            const jsFiles = [];
            const htmlFiles = [];
            if (stat.isFile()) {
                if (patterns.jsInclude && patterns.jsInclude.test(input)) {
                    if (!patterns.jsExclude || !patterns.jsExclude.test(input)) {
                        jsFiles.push(input);
                    }
                } else if (patterns.htmlInclude && patterns.htmlInclude.test(input)) {
                    if (!patterns.htmlExclude || !patterns.htmlExclude.test(input)) {
                        htmlFiles.push(input);
                    }
                }
                resolve({js: jsFiles, html: htmlFiles});
            } else {
                fs.readdir(input, (err, files) => {
                    const promises = [];
                    files.forEach(file => {
                        promises.push(findFiles(path.resolve(input, file), patterns));
                    });
                    Promise.all(promises).then(results => {
                        results.forEach(result => {
                            result.js.forEach(path => {
                                if (jsFiles.indexOf(path) === -1) {
                                    jsFiles.push(path);
                                }
                            });
                            result.html.forEach(path => {
                                if (htmlFiles.indexOf(path) === -1) {
                                    htmlFiles.push(path);
                                }
                            });
                        });
                        resolve({js: jsFiles, html: htmlFiles});
                    });
                });
            }
        });
    });
}

function parseHTML(words, source, filename, fillCopy=false) {
    const document = jsdom(source);
    const elems = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        var key = elem.getAttribute('data-i18n');
        var value = elem.innerHTML;
        if (!key) {
            const isText = (elem.childNodes.length === 1 && elem.childNodes[0].nodeType === 3);
            if (isText) {
                key = elem.childNodes[0].nodeValue;
                value = key;
            } else if (elem.hasAttribute('data-i18n-safe')) {
                key = elem.innerHTML;
                value = key;
            } else {
                var html = elem.outerHTML;
                if (key === null) {
                    html = html.replace('data-i18n=""', 'data-i18n');
                }
                words.warnings.push(`HTML tag '${html}' does not have single text as a child. Add key as a data-i18n attribute or add data-i18n-safe attribute in ${filename}`);
                continue;
            }
        }
        words.addIfNotExists(key, fillCopy ? value : '');
    }
}


function parseJavaScript(words, source, filename, fillCopy=false, targetFile=null) {
    var matchImport2 = matchImport;
    if (targetFile) {
        matchImport2 = new StatementPattern({
            require: `__decl__ __anyname__ = require('${targetFile}');`
        });
    }

    var match;
    try {
        match = matchImport2.match(source);
    } catch (e) {
        if (e instanceof SyntaxError) {
            showSyntaxErrorDetail(source, e, filename);
        }
        throw e;
    }
    match.forEach(result => {
        const name = result.node.declarations[0].id.name;
        const pattern = {
            simple: name + '(__string__)',
            pluralisation: name + '(__string__, __number__)',
            formatting: name + '(__string__, __object__)',
            context: name + '(__string__, __object__, __object__)',
            contextWithPluralisation: name + '(__string__, __number__, __object__, __object__)',
        };
        patternMatch(result.stack.slice(-1), pattern).forEach(call => {
            const value = call.node.arguments[0].value;
            switch (call.name) {
            case 'simple':
            case 'formatting':
                words.addIfNotExists(value, fillCopy ? value : '');
                break;
            case 'pluralisation':
                words.addIfNotExists(value, [
                    [1, 1, fillCopy ? value : ''],
                    [2, null, fillCopy ? value : ''],
                ]);
                break;
            case 'context':
            case 'contextWithPluralisation': {
                var keys = {};
                var hasContext = false;

                var word = fillCopy ? value : '';
                var contextIndex = 2;
                if (call.name === 'contextWithPluralisation') {
                    word = [
                        [1, 1, fillCopy ? value : ''],
                        [2, null, fillCopy ? value : ''],
                    ];
                    contextIndex = 3;
                }

                call.node.arguments[contextIndex].properties.forEach(property => {
                    var categoryKey, categoryValue;
                    if (property.key.type === 'Literal') {
                        categoryKey = property.key.value;
                    } else if (property.key.type === 'Identifier') {
                        categoryKey = property.key.name;
                    }
                    if (property.value.type === 'Literal') {
                        categoryValue = property.value.value;
                    } else if (property.value.type === 'Identifier') {
                        categoryValue = property.value.name;
                    }
                    if (categoryKey && categoryValue) {
                        keys[categoryKey] = categoryValue;
                        hasContext = true;
                    }
                });

                if (hasContext) {
                    const category = words.context(keys);
                    category.addIfNotExists(value, word);
                } else {
                    words.addIfNotExists(value, word);
                }

                }
                break;
            }
        });
    });
}

module.exports = {
    findFiles: findFiles,
    parseHTML: parseHTML,
    parseJavaScript: parseJavaScript,
    main: main
};

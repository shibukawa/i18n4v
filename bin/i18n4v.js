/* eslint-env node, es6 */


'use strict';

const fs = require('fs');
const path = require('path');
const commander = require('commander');
const i18n = require('../index');
const cli = require('../src/cli');

const version = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'UTF-8')).version;

console.log(i18n("i18n for virtual DOM (i18n4v)\n"));

commander
    .version(version)
    .usage('-o output.json [other options] <source files/dirs...>')
    .option('-o, --output [path]', i18n('Output file path. You can add extension .js/.json.'))
    .option('-i, --js-include [pattern]', i18n('Input JavaScript file pattern. Default is "((\\.js)|(\\.ts)|(.jsx))$"'), '((\\.js)|(\\.ts)|(.jsx)|(.mjs))$')
    .option('-e, --js-exclude [pattern]', i18n('Input JavaScript file filtering pattern.'))
    .option('-h, --html-include [pattern]', i18n('Input HTML file pattern. Default is /((\\.html)|(\\.xhtml))$'), "((\\.html)|(\\.xhtml))$")
    .option('-x, --html-exclude [pattern]', i18n('Input HTML file filtering pattern.'))
    .option('-f, --fill-copy', i18n('Fill key as default translation text'), false)
    .option('--i18n [name]', i18n('Specify i18n library file name'), 'i18n4v')
    .parse(process.argv);

// check error
const errors = [];
if (!commander.args.length) {
    errors.push("    " + i18n("Input files/dirs are required."));
}
if (!commander.output) {
    errors.push("    " + i18n("Output file path is required."));
}

[
    { name: "jsInclude",   opt: "--js-include" },
    { name: "jsExclude",   opt: "--js-exclude" },
    { name: "htmlInclude", opt: "--html-include" },
    { name: "htmlExclude", opt: "--html-exclude" }
].forEach((regexp) => {
    if (commander[regexp.name]) {
        try {
            commander[regexp.name] = new RegExp(commander[regexp.name]);
        } catch (e) {
            errors.push("    " + i18n("Parse error at %{opt}: ", {opt: regexp.opt}) + e.message);
        }
    }
});

if (errors.length) {
    errors.forEach(err => {
        console.log(err);
    });
    commander.help();
} else {
    cli.main(commander);
}

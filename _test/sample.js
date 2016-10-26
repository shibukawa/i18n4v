/* eslint-env node, es6 */

'use strict';

const i18n = require('../index');
const path = require('path');
const fs = require('fs');
const jsdom = require('jsdom').jsdom;
const StatementPattern = require('es-pattern-match').StatementPattern;
const patternMatch = require('es-pattern-match').patternMatch;

i18n('test');
i18n('test1');
i18n('test2');
i18n('test3');
i18n('test');

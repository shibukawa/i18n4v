'use strict';

function syntaxErrorLine(lineNumber, maxLineNumberLength, line) {
    var content = ['    '];
    var lineNumberString = String(lineNumber);
    for (var i = lineNumberString.length; i < maxLineNumberLength; i++) {
        content.push(' ');
    }
    content.push(lineNumberString, ': ', line);
    return content.join('');
}

function showSyntaxErrorDetail(code, error, filepath) {
    var i;
    var begin = code.lastIndexOf('\n', error.pos);
    var end = code.indexOf('\n', error.pos);
    if (end === -1) {
        end = undefined;
    }
    var line = code.slice(begin + 1, end);
    var beforeLines = [];
    for (i = 0; i < 5; i++) {
        if (begin === -1) {
            break;
        }
        var lastBegin = begin;
        begin = code.lastIndexOf('\n', begin - 1);
        beforeLines.unshift(code.slice(begin + 1, lastBegin));
        if (begin === 0) {
            break;
        }
    }
    var afterLines = [];
    for (i = 0; i < 5; i++) {
        if (end === undefined) {
            break;
        }
        var lastEnd = end;
        end = code.indexOf('\n', end + 1);
        if (end === -1) {
            end = undefined;
        }
        afterLines.push(code.slice(lastEnd + 1, end));
    }

    var lines = [''];
    var numberLength = String(error.loc.line + afterLines.length).length;
    for (i = 0; i < beforeLines.length; i++) {
        lines.push(
            syntaxErrorLine(error.loc.line - beforeLines.length + i, numberLength, beforeLines[i])
        );
    }
    lines.push(syntaxErrorLine(error.loc.line, numberLength, line));
    var lineContent = [];
    for (i = 0; i < 6 + numberLength + error.loc.column - 1; i++) {
       lineContent.push(' ');
    }
    lineContent.push('^');
    lines.push(lineContent.join(''));
    for (i = 0; i < afterLines.length; i++) {
        lines.push(
            syntaxErrorLine(error.loc.line + i + 1, numberLength, afterLines[i])
        );
    }
    lines.push('', 'SyntaxError: ' + error.message + (filepath ? ' in ' + filepath : ''), '');
    var detail = lines.join('\n');
    var err = new SyntaxError(detail);
    err.loc = error.loc;
    err.pos = error.pos;
    err.raisedAt = error.pos;
    throw err;
}

module.exports = showSyntaxErrorDetail;

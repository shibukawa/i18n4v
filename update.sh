#!/bin/sh

node bin/i18n4v.js -o languges/en.json -f --i18n "../index" bin src
node bin/i18n4v.js -o languges/ja.json --i18n "../index" bin src

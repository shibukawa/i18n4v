# i18n for Virtual DOM (``i18n4v``)

[![Build Status](https://secure.travis-ci.org/shibukawa/i18n4v.png?branch=master)](http://travis-ci.org/shibukawa/i18n4v)

```sh
$ npm install i18n4v --save
```

``i18n4v`` is an internationalization helper library for browsers and node.js.

It has the following features:

* It supports standard internatinalization features:
  * Replacing words by key (original words can be used as keys too)
  * Pluralisation
  * Formatting
  * Selecting translations from context (like gender)
* Small runtime:
  * Runtime is written in ES3 and just 1.8kb (minified and gzipped)
  * Runtime library doesn't have any dependencies.
  * It is compatible with common.js and AMD and global reading with ``<script>`` tag.
* It can run on browser:
  * With virtual DOM (in JavaScript)
  * With static HTML text
* It can run on node.js:
  * To make off-line unittesting easy
  * To support server side rendering and CLI tools
* It provides CLI tool to maintain translations

Core part of i18n is derived from [roddeh-i18n](http://i18njs.com/). Thank you roddeh.

Do you want to use Golang on your server? Yes! You can use [Golang edition](https://godoc.org/github.com/shibukawa/i18n4v) of this library.
You can share same translation fileas between JavaScript and Golang.

## Document

https://i18n4v.js.org/

## Example

Use with JavaScript:

```js
// This sample uses with Mithril.
// You can use any virtual DOM framework.
const m = require('mithril');
const i18n = require('i18n4v');

var mithrilComponent = {
    view(ctrl) {
        return m("div", i18n("hello world"));
    }
};

i18n.translator.add({
    values: {
        "hello world": "こんにちわ世界"
    }
});
```

Use with static HTML:

```html
<article>
   <h1 data-i18n>Monty Python</h1>
</artice>
    
<script>
i18n.translator.add({
    values: {
        "Monty Python": "モンティ・パイソン"
    }
});
i18n.translator.applyToHTML();
</script>
```

## License

[MIT](https://shibu.mit-license.org/)

## Repository

https://github.com/shibukawa/i18n4v

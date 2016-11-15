# i18n for vue.js (``i18n4vue``)

[![Build Status](https://secure.travis-ci.org/shibukawa/i18n4v.png?branch=master)](http://travis-ci.org/shibukawa/i18n4v)

```sh
$ npm install i18n4vue --save
```

``i18n4vue`` is an internationalization helper library for vue.js. It is a vue.js plugin of [i18n4v](https://i18n4v.js.org/).

``i18n4v`` has the following features:

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

```i18n4vue``` provides the following feature to your Vue.js environment:

* ```v-i18n``` directive
* ```i18n``` method

Core part of i18n is derived from [roddeh-i18n](http://i18njs.com/). Thank you roddeh.

## Document

https://i18n4v.js.org/

## Example

### Initialize

```js
Vue.use(require('i18n4vue'));
```

### Use directive

```html
<h3 v-i18n>Language Select</h3>
```

If translation contains HTML tag, use ```.safe``` modifier:

```html
<h3 v-i18n.safe>Language Select</h3>
```

### Use method

```html
<th v-for="label in dayOfWeekLabels">{{ i18n(label) }}</th>
```

This form can use whole feature of [i18n4v](https://i18n4v.js.org/), including pluralisation feature:

```html
<div>{{ i18n('They have {{num}} records', 10) }}</div>
```

If you want to translate static HTML (outside of Virtual DOM), see [i18n4v's document](https://i18n4v.js.org/tutorial.html#translate-static-html).

## License

[MIT](https://shibu.mit-license.org/)

## Repository

https://github.com/shibukawa/i18n4v

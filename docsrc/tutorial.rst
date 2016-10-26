Tutorial
========

.. note::

   Translation API is 100% compatible with `i18njs <http://i18njs.com/>`_. You can see it to learn how to use it.

Install to your Application
----------------------------

``i18n4v`` provides two items:

* Runtime library: ``index.js``. It is written in ES3 and compatible with common.js and AMD.
* CLI tool: ``i18n4v``. It is for node.js. It maintains translation files.

.. code:: console

   $ npm install i18n4v --save

It is an npm package. You can use it from node.js application like this:

.. code:: js

   const i18n = require('i18n4v');

For browsers, you can use Browserify, WebPack, require.js to load runtime library. Also you can read it via script tag.

Simple Translation
------------------

.. code:: js

   //  Adds data that is used to translate
   i18n.translator.add({
       values:{
           "Hello": "こんにちは"
       }
   });

   //  Then translate something
   i18n("Hello");  // -> こんにちは

Pluralisation
-------------

``i18n4v`` treats the changing words by a number of things. You can specify Array as a translation word. Each entries has ``[min, max, translation]`` members:

.. code:: js

   {
       "values": {
           "%n comments": [
               [0, 0, "%n comments"],
               [1, 1, "%n comment"],
               [2, null, "%n comments"]
           ]
       }
   }

``i18n4v`` selects the translation by the ``min`` and ``max`` range:

.. code:: js

   i18n("%n comments", 0);    //  -> 0 comments
   i18n("%n comments", 1);    //  -> 1 comment
   i18n("%n comments", 2);    //  -> 2 comments

Formatting
----------

``i18n4v`` replaces placeholders with supplied values:

.. code:: js

   i18n("Welcome %{name}", { name:"John" });    //  -> Welcome John

Context
-------

Some languages' words have several forms by extra information like gender.

.. code:: js

   {
     "values": {
       "Yes": "Yes",
       "No": "No"
     },
     "contexts": [
       {
         "matches": {"gender": "male"},
         "values": {
           "%{name} updated their profile": "%{name} updated his profile"
         }
       },
       {
         "matches":{"gender": "female"},
         "values": {
           "%{name} updated their profile": "%{name} updated her profile"
         }
       }
     ]
   }

Third argument is used for context selecting:

.. code:: js

   i18n("%{name} updated their profile",
     { name: "John" },
     { gender: "male" }
   ); //  ->  John updated his profile 

   i18n("%{name} updated their profile",
     { name: "Jane" },
     { gender: "female" }
   ); //  ->  Jane updated her profile

You can use context support and pluralisation together:

.. code:: js

   {
     "values": {
       "Yes": "はい",
       "No": "いいえ"
     },
     "contexts": [
       {
         "matches": { "gender": "male" },
         "values":{
           "%{name} uploaded %n photos to their %{album} album":[
             [0, 0, "%{name}は彼の%{album}アルバムに写真%n枚をアップロードしました"]
           ]
         }
       },
       {
         "matches": { "gender": "female" },
         "values": {
           "%{name} uploaded %n photos to their %{album} album":[
             [0, 0, "%{name}は彼女の%{album}アルバムに写真%n枚をアップロードしました"]
           ]
         }
       }
     ]
   }

.. code:: js

   i18n("%{name} uploaded %n photos to their %{album} album", 1,
     { name: "John", album: "Buck's Night" },
     { gender:"male" }
   ); //  ->  Johnは彼のBuck's Nightアルバムに写真1枚をアップロードしました

   i18n("%{name} uploaded %n photos to their %{album} album", 4,
     { name: "Jane", album: "Hen's Night" },
     { gender: "female" }
   ); //  ->  Janeは彼女のHen's Nightアルバムに写真4枚をアップロードしました

Translate Static HTML
---------------------

``i18n4v`` searches tags that have ``data-i18n`` data attribute and replace the content:

.. code:: html

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

If you want to specify translation key, instead of its text, add key name to the data attribute:

.. code:: html

   <span data-i18n>Hello World</span>            <!-- key is 'Hello World' -->
   <span data-i18n="greeting">Hello World</span> <!-- key is 'greeting' -->

Static HTML feature has only limited functionality, that doesn't support formatting and contextual translation. 

By default, it translates tags that only have text, ignores tags that have child tags. To replace the tag, add ``data-i18n-safe`` attribute or add key to the tag. If you don't add ``data-i18n-safe`` attribute, ``i18n4v`` escape the translation automatically:

.. code:: html

   <span data-i18n>This tag will be translated</span>
   <span data-i18n><b>This tag will be ignored</b></span>
   <span data-i18n data-i18n-safe><b>This tag will be ignored</b></span>

Selecting Preferred Language
----------------------------

``i18n4v`` chooses preferred language from passed language list. On browsers, it checks ``navigator.language`` and ``navigator.languages`` property. On node.js, it uses `os-locale <https://github.com/sindresorhus/os-locale>`_ package:

.. code:: js

   i18n.translator.selectLanguage(['en', 'de', 'fr'], function (err, lang) {
       // If there is no good choice, it returns null
       if (!lang) {
           lang = 'en';
       }
       // load from server
       var xhr = new XMLHttpRequest();
       xhr.onreadystatechange = function() {
           if (this.readyState == 4 && this.status == 200) {
               i18n.translator.add(this.response);
           }
       };
       xhr.open('GET', '/assets/' + lang + '.json', true);
       xhr.responseType = 'json';
       xhr.send( null );
   });

As you see in the above sample code, ``i18n4v`` doesn't have any feature to load resources. Some client MVC frameworks provides feature to access server (e.g. Mithril's request function). Use framework's one.

If your project is small and bundling all language files are not expensive, the following solution is the easiest.

.. code:: js

   var languages = {
       en: require('./languages/en.json'),
       fr: require('./languages/fr.json'),
       de: require('./languages/de.json')
   }

   i18n.translator.selectLanguage(['en', 'de', 'fr'], function (err, lang) {
       i18n.translator.add(languages[lang] ? languages[lang] : languages.en);
   });

You can set preferred language manually. It feature is only on browser. It is stored in Browser's Local Storage. This language has higher priority in ``selectLanguage()``:

.. code:: js

   i18n.translator.setLanguage('tlh');

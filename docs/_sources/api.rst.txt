API Reference
=============

Instance
--------

``i18n4v`` provides global instance:

.. code:: js

   // i18n is a globals instance's translate() method
   const i18n = require('i18n4v');

   // i18n.translator is a global instance of Translator
   const translator = i18n.translator;

Resulting object of ``require()`` is a just ``translate()`` method.
It has property that points ``Translator`` instance.

You can access any features from ``i18n.translator``. ``i18n`` is for translating.

``i18n4v`` supports multiple ``Translator`` instances for server usage:

.. code:: js

   // es is a new instance's translate() method
   var es = i18n.create({
       values: {
           cat: "gato"
       }
   });

   // es.translator is a Translator instance 
   const translator = es.translator;


Translator class
----------------

.. js:class:: Translator

   This is a core component of ``i18n4v``.

   .. js:function:: translate(source:string[, count:number[, formatParams:object[, context:object]]]) : string

      Returns translated text from source string/key.

   .. js:function:: add(resource : object)

      Registers translation resource.

   .. js:function:: resetData()

      Resets translation resource that is set by :js:func:`add()`.

   .. js:function:: setContext(contextKey : string, contextValue : string)

      Sets default context. It is used by :js:func:`translate()` if ``context`` parameter is omitted.

   .. js:function:: clearContext(contextKey : string)

      Clears default context value specified by ``contextKey`` that is set by :js:func:`setContext()`.

   .. js:function:: resetContext()

      Clears all default context that is set by :js:func:`setContext()`.

   .. js:function:: reset()

      It is combined method of :js:func:`resetData()` and :js:func:`resetContext()`.

   .. js:function:: setLanguage(language : string)

      Stores preferred language of a user. It is available only on browsers.

   .. js:function:: selectLanguage(languageList : string[], callback : function(err:error, lang:string)) : Promise

      Returns preferred language from langaugeList from browsers' and node.js's environment.

      If the JavaScript environment supports `Promise <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise>`_ and
      ``callback`` is ommitted, it returns ``Promise``. 

      .. note::

         There is no feature selecting preferred language from user's request 
         for web applications on node.js now.

   .. js:function:: applyToHTML()

      Searches ``data-i18n`` attributes and replace text on current web page.

.. js:function: i18n(source:string[, count:number[, formatParams:object[, context:object]]]) : string

   This is a ``translate()`` method of default instance of :js:class:`Translator`.

   .. js:attribute:: translator

      It points a parent instance of ``translate()`` method.

   .. js:function:: create(resource : object) : Translator

      It creates a new instance of :js:class:`Translator`.


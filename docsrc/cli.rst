Command Line Interface
======================

``i18n4v`` npm package provides ``i18n4v`` command to support internatinalization. It extracts translatable strings from given input files like an ``xgettext`` command of ``gettext``.

.. code:: text

   i18n for virtual DOM (i18n4v)
   
     Usage: i18n4v -o output.json [other options] <source files/dirs...>
   
     Options:
   
       -h, --help                    output usage information
       -V, --version                 output the version number
       -o, --output [path]           Output file path. You can add extension .js/.json.
       -i, --js-include [pattern]    Input JavaScript file pattern. Default is "((\.js)|(\.ts)|(.jsx))$"
       -e, --js-exclude [pattern]    Input JavaScript file filtering pattern.
       -h, --html-include [pattern]  Input HTML file pattern. Default is /((\.html)|(\.xhtml))$
       -x, --html-exclude [pattern]  Input HTML file filtering pattern.
       -f, --fill-copy               Fill key as default translation text
       --i18n [name]                 Specify i18n library file name

If output file exists already, it reads the content and add new words to it. It keeps existing content.

Basically this tool is used in shell script or batch file like this:

.. code:: sh

   #!/bin/sh

   ./node_modules/.bin/i18n4v -o languges/en.json -f bin src
   ./node_modules/.bin/i18n4v -o languges/ja.json bin src

It searches the following strings as a key:

* HTML tags that has ``data-i18n`` data attribute:

  .. code:: html

     <div data-i18n>This item is extracted</div>
     <div data-i18n="key">This item is extracted too</div>

* It searching JavaScript code in two steps:

  1. Find ``require()`` statement with ``'i18n4v'``:

     .. code:: js

        // you can use 'var', 'let' instead of 'const' too
        const i18n = require('i18n4v');

        // you can use any name you want
        const _ = require('i18n4v');
     
     You can overwrite module name by using ``--i18n`` option.

  2. Find function call that uses the identifier in step.1.

     .. code:: js

        console.log(i18n('This string is extracted'));
        console.log(_('Pluralisation, formatting, contextual strings are extracted too', 4));

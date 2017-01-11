Use from TypeScript
====================

i18n4v bundles ``.d.ts`` file and it is registered at ``types`` field of ``package.json``.
You can download library from npm and use it without any settings.

.. code-block:: bash

   $ npm install i18n4v

.. code-block:: typescript

   // use via require
   import i18n = require("i18n4v");
   console.log(i18n("Hello World"));

.. code-block:: bash

   // compile and concat
   $ browserify -p tsify -o main.js main.ts


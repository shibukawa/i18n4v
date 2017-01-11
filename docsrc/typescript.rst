Use from TypeScript
====================

i18n4v bundles ``.d.ts`` file and it is registered at ``types`` field of ``package.json``.
You can download library from npm and use it without any settings.

Download and Use
-----------------

.. code-block:: bash
   :caption: install library via npm

   $ npm install i18n4v

.. code-block:: typescript
   :caption: main.ts

   // use via require
   import i18n = require("i18n4v");
   console.log(i18n("Hello World"));

Build with Browserify
---------------------

.. code-block:: bash
   :caption: compile and concat

   $ browserify -p tsify -o main.js main.ts

Build with WebPack
-------------------

.. code-block:: js
   :caption: webpack.config.js

   module.exports = {
     entry: [
       './main.ts'
     ],
     output: {
       path: 'dist',
       filename: 'bundle.js'
     },
     resolve: {
       extensions: ['', '.tsx', '.ts', '.js']
     },
     module: {
       loaders: [
         { test: /\.ts(x?)$/, loader: 'ts-loader' }
       ]
     }
   };

.. code-block:: json
   :caption: tsconfig.json

   {}

.. code-block:: bash
   :caption: compile and concat

   $ webpack


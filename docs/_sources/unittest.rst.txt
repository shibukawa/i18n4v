Unittest
========

.. raw:: html

   <link rel="stylesheet" media="all" href="https://cdnjs.cloudflare.com/ajax/libs/mocha/3.1.2/mocha.css">
   <script src="https://cdnjs.cloudflare.com/ajax/libs/mocha/3.1.2/mocha.js"></script>

   <script>
   mocha.setup('bdd');
   </script>
   <script src="_static/browser_test.js"></script>
   <div id="mocha"></div>
   <script>
   mocha.run();
   </script>

   <div style="display: none;">
       <span id="id1" data-i18n>hello world</span>
       <span id="id2" data-i18n="replace by key">hello world</span>
       <span id="id3" data-i18n="replace with tag">hello world</span>
       <span id="id4" data-i18n="replace with tag" data-i18n-safe>hello world</span>
       <span id="id5" data-i18n><b>hello world</b></span>
       <span id="id6" data-i18n="replace by key"><b>hello world</b></span>
       <span id="id7" data-i18n data-i18n-safe><b>hello world</b></span>
   </div>

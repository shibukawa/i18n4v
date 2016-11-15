Vue Example
===========

`Vue 2.0 <http://http://vuejs.org/>`_ is a progressive MVC framework. Core is small and fast, but there many plug-ins to extend Vue.

i18n4v provides vue.js plugin, called **i18n4vue**.

Install Plugin
--------------

.. code-block:: console

   $ npm install i18n4vue --save

Plugin Reference
----------------

You can register this plugin by using `Vue.use <https://vuejs.org/v2/api/#Vue-use>`_ method. 

.. code-block:: javascript

   Vue.use(require('i18n4vue'));

It provides ``v-i18n`` directive and ``i18n()`` method:

.. code-block:: html

   <!-- text contents of tags that has v-i18n directive become translation key -->
   <h3 v-i18n>Language Select</h3>

   <!-- if translation contains HTML tags, use .safe modifier -->
   <h3 v-i18n.safe>Language Select</h3>

.. code-block:: html
   
   <th v-for="label in dayOfWeekLabels">{{ i18n(label) }}</th>

   <!-- This form can use whole feature of i18n4, including pluralisation feature -->
   <div>{{ i18n('They have {{num}} records', 10) }}</div>

Sample Code
-----------

.. raw:: html

   <script type="text/javascript" src="../_static/i18n4v.js"></script>
   <script type="text/javascript" src="../_static/i18n4vue.js"></script>
   <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.0.3/vue.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/vue-router/2.0.1/vue-router.js"></script>

   <div id="app-calendar">
       <router-view></router-view> 
   </div>

   <script>
   
   Vue.use(i18n4vue);

   var router, vm;
   var translations = {
       en: {
           values: {
               "Language Select": "Language Select",
               Sun: "Sun", Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat",
               "Previous Month": "Previous Month",
               "Next Month": "Next Month",
               "%{month} %{year}": "%{month} %{year}",
               1: "January", 2: "February", 3: "March", 4: "April",
               5: "May", 6: "June", 7: "July", 8: "August",
               9: "September", 10: "October", 11: "November", 12: "December"
           }
       },
       ja: {
           values: {
               "Language Select": "言語選択",
               Sun: "日曜", Mon: "月曜", Tue: "火曜", Wed: "水曜", Thu: "木曜", Fri: "金曜", Sat: "土曜",
               "Previous Month": "前月",
               "Next Month": "次月",
               "%{month} %{year}": "%{year} %{month}",
               1: "睦月", 2: "如月", 3: "弥生", 4: "卯月",
               5: "皐月", 6: "水無月", 7: "文月", 8: "葉月",
               9: "長月", 10: "神無月", 11: "霜月", 12: "師走"
           }
       }
   };

   // Generates calendar
   function calcCalendar(year, month) {
       var i, d;
       var firstDay = new Date(year, month-1, 1).getDay();
       var last = new Date(year, month, 0);
       var weeks = [];
       var week = [];
       for (i = 0; i < firstDay; i++) {
           week.push('');
       }
       for (d = 1; d <= last.getDate(); d++) {
           week.push(d);
           if (week.length === 7) {
               weeks.push(week);
               week = [];
           }
       }
       for (i = 0; i < (6 - last.getDay()); i++) {
           week.push('');
       }
       weeks.push(week);
       return weeks;
   }

   Vue.component('calendar', {
       props: {
           year: Number,
           month: Number
       },
       template: [
           '<table>',
               '<thead>',
                   '<tr>',
                       '<th v-for="label in dayOfWeekLabels">{{ i18n(label) }}</th>',
                   '</tr>',
               '</thead>',
               '<tbody>',
                   '<tr v-for="week in calendar">',
                       '<td v-for="day in week">{{day}}</td>',
                   '</tr>',
               '</tbody>',
           '</table>'].join(''),
       computed: {
           calendar: function() {
               return calcCalendar(this.year, this.month);
           }
       },
       data: function () {
           return {
               dayOfWeekLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
           };
       },
       methods: {
           i18n: i18n
       }
   });

   var Calendar = {
       data: function () {
           return {
               year: null,
               month: null,
           };
       },
       template: [
           '<div>',
               '<h3 v-i18n>Language Select</h3>',
               '<button v-on:click="select(\'en\')">English</button>',
               '<button v-on:click="select(\'ja\')">Japanese</button>',
               '<h3>{{ i18n("%{month} %{year}", {year: year, month: i18n(month) }) }}</h3>',
               '<button v-on:click="prev" v-i18n>Previous Month</button>',
               '<button v-on:click="next" v-i18n>Next Month</button>',
               '<calendar :year="year" :month="month"></calendar>',
           '</div>'
       ].join(''),
       created: function () {
           this.year = Number(this.$route.params.year);
           this.month = Number(this.$route.params.month);
       },
       methods: {
           prev: function () {
               if (this.month === 1) {
                   router.push('/' + (this.year - 1) + '/12');
               } else {
                   router.push('/' + this.year + '/' + (this.month - 1));
               }
           },
           next: function () {
               if (this.month === 12) {
                   router.push('/' + (this.year + 1) + '/1');
               } else {
                   router.push('/' + this.year + '/' + (this.month + 1));
               }
           },
           select: function (lang) {
               i18n.translator.add(translations[lang]);
               this.$forceUpdate();
           },
           i18n: i18n
       },
       watch: {
           $route: function () {
               this.year = Number(this.$route.params.year);
               this.month = Number(this.$route.params.month);
           }
       }
   };
   var date = new Date();
   var thisMonth = '/' + date.getFullYear() + '/' + (date.getMonth() + 1);
   router = new VueRouter({
       routes: [
           { path: '/:year/:month', component: Calendar },
           { path: '/', redirect: thisMonth }
       ]
   });

   function main() {
       i18n.translator.selectLanguage(Object.keys(translations), function (err, lang) {
           i18n.translator.add(translations[lang] ? translations[lang] : translations.en);
       });

       vm = new Vue({
           router: router,
           el: '#app-calendar'
       });
   }
   
   if (document.readyState !== 'loading') {
       main();
   } else {
       document.addEventListener('DOMContentLoaded', main);
   }
   </script>

Source
------

.. code-block:: html
   :linenos:

   <script type="text/javascript" src="../_static/i18n4v.js"></script>
   <script type="text/javascript" src="../_static/i18n4vue.js"></script>
   <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.0.3/vue.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/vue-router/2.0.1/vue-router.js"></script>

   <div id="app-calendar">
       <router-view></router-view> 
   </div>

   <script>
   
   Vue.use(i18n4vue);

   var router, vm;
   var translations = {
       en: {
           values: {
               "Language Select": "Language Select",
               Sun: "Sun", Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat",
               "Previous Month": "Previous Month",
               "Next Month": "Next Month",
               "%{month} %{year}": "%{month} %{year}",
               1: "January", 2: "February", 3: "March", 4: "April",
               5: "May", 6: "June", 7: "July", 8: "August",
               9: "September", 10: "October", 11: "November", 12: "December"
           }
       },
       ja: {
           values: {
               "Language Select": "言語選択",
               Sun: "日曜", Mon: "月曜", Tue: "火曜", Wed: "水曜", Thu: "木曜", Fri: "金曜", Sat: "土曜",
               "Previous Month": "前月",
               "Next Month": "次月",
               "%{month} %{year}": "%{year} %{month}",
               1: "睦月", 2: "如月", 3: "弥生", 4: "卯月",
               5: "皐月", 6: "水無月", 7: "文月", 8: "葉月",
               9: "長月", 10: "神無月", 11: "霜月", 12: "師走"
           }
       }
   };

   // Generates calendar
   function calcCalendar(year, month) {
       var i, d;
       var firstDay = new Date(year, month-1, 1).getDay();
       var last = new Date(year, month, 0);
       var weeks = [];
       var week = [];
       for (i = 0; i < firstDay; i++) {
           week.push('');
       }
       for (d = 1; d <= last.getDate(); d++) {
           week.push(d);
           if (week.length === 7) {
               weeks.push(week);
               week = [];
           }
       }
       for (i = 0; i < (6 - last.getDay()); i++) {
           week.push('');
       }
       weeks.push(week);
       return weeks;
   }

   Vue.component('calendar', {
       props: {
           year: Number,
           month: Number
       },
       template: [
           '<table>',
               '<thead>',
                   '<tr>',
                       '<th v-for="label in dayOfWeekLabels">{{ i18n(label) }}</th>',
                   '</tr>',
               '</thead>',
               '<tbody>',
                   '<tr v-for="week in calendar">',
                       '<td v-for="day in week">{{day}}</td>',
                   '</tr>',
               '</tbody>',
           '</table>'].join(''),
       computed: {
           calendar: function() {
               return calcCalendar(this.year, this.month);
           }
       },
       data: function () {
           return {
               dayOfWeekLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
           };
       },
       methods: {
           i18n: i18n
       }
   });

   var Calendar = {
       data: function () {
           return {
               year: null,
               month: null,
           };
       },
       template: [
           '<div>',
               '<h3 v-i18n>Language Select</h3>',
               '<button v-on:click="select(\'en\')">English</button>',
               '<button v-on:click="select(\'ja\')">Japanese</button>',
               '<h3>{{ i18n("%{month} %{year}", {year: year, month: i18n(month) }) }}</h3>',
               '<button v-on:click="prev" v-i18n>Previous Month</button>',
               '<button v-on:click="next" v-i18n>Next Month</button>',
               '<calendar :year="year" :month="month"></calendar>',
           '</div>'
       ].join(''),
       created: function () {
           this.year = Number(this.$route.params.year);
           this.month = Number(this.$route.params.month);
       },
       methods: {
           prev: function () {
               if (this.month === 1) {
                   router.push('/' + (this.year - 1) + '/12');
               } else {
                   router.push('/' + this.year + '/' + (this.month - 1));
               }
           },
           next: function () {
               if (this.month === 12) {
                   router.push('/' + (this.year + 1) + '/1');
               } else {
                   router.push('/' + this.year + '/' + (this.month + 1));
               }
           },
           select: function (lang) {
               i18n.translator.add(translations[lang]);
               this.$forceUpdate();
           },
           i18n: i18n
       },
       watch: {
           $route: function () {
               this.year = Number(this.$route.params.year);
               this.month = Number(this.$route.params.month);
           }
       }
   };
   var date = new Date();
   var thisMonth = '/' + date.getFullYear() + '/' + (date.getMonth() + 1);
   router = new VueRouter({
       routes: [
           { path: '/:year/:month', component: Calendar },
           { path: '/', redirect: thisMonth }
       ]
   });

   function main() {
       i18n.translator.selectLanguage(Object.keys(translations), function (err, lang) {
           i18n.translator.add(translations[lang] ? translations[lang] : translations.en);
       });

       vm = new Vue({
           router: router,
           el: '#app-calendar'
       });
   }
   
   if (document.readyState !== 'loading') {
       main();
   } else {
       document.addEventListener('DOMContentLoaded', main);
   }
   </script>

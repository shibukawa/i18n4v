Mithril Example
===============

`Mithril <http://mithril.js.org/>`_ is tiny and fast and stable web single page application framework. It provides complete feature and has no dependency.

Sample
------

.. raw:: html

   <script type="text/javascript" src="../_static/i18n4v.js"></script>
   <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mithril/0.2.5/mithril.js"></script>

   <div id="select"></div>
   <div id="calendar"></div>
   <script>
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

   // language selection component
   var LanguageSelect = {
       controller: function () {
           this.select = function (lang) {
               i18n.translator.add(translations[lang]);
           };
       },
       view: function (ctrl) {
           return m('div', [
               m('h3', i18n('Language Select')),
               m('button', {onclick: ctrl.select.bind(ctrl, 'en')}, 'English'),
               m('button', {onclick: ctrl.select.bind(ctrl, 'ja')}, 'Japanese')
           ]);
       }
   };

   // Generates calendar
   function calendar(year, month) {
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

   // Jump to current month component
   var JumpThisMonth = {
       controller: function () {
           var date = new Date();
           m.route("/" + date.getFullYear() + "/" + (date.getMonth() + 1));
       },
   }
   
   // Calender component
   var Calendar = {
       controller: function () {
           var self = this;
           this.year = m.prop(Number(m.route.param('year')));
           this.month = m.prop(Number(m.route.param('month')));
           this.calendar = m.prop(calendar(this.year(), this.month()));
           this.next = function () {
               if (self.month() === 12) {
                   m.route('/' + (self.year() + 1) + '/1');
               } else {
                   m.route('/' + self.year() + '/' + (self.month() + 1));
               }
           };
           this.prev = function () {
               if (self.month() === 1) {
                   m.route('/' + (self.year() - 1) + '/12');
               } else {
                   m.route('/' + self.year() + '/' + (self.month() - 1));
               }
           };
       },
       view: function (ctrl) {
           var dayOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
           return m('div', [
               m('h3', i18n('%{month} %{year}', {
                   year: i18n(ctrl.year()),
                   month: i18n(String(ctrl.month()))
               })),
               m('div', [
                   m('button', {onclick: ctrl.prev}, i18n('Previous Month')),
                   m('button', {onclick: ctrl.next}, i18n('Next Month'))
               ]),
               m('table', [
                   m('thead', [
                       m('tr', dayOfWeekLabels.map(function(label) {
                           return m('th', i18n(label));
                       }))
                   ]),
                   m('tbody', ctrl.calendar().map(function(week) {
                       return m('tr', week.map(function(day) {
                           return m('td', (day !== '') ? day : m.trust('&nbsp'));
                       }));
                   }))
               ])
           ]);
       }
   };

   function main() {
       i18n.translator.selectLanguage(Object.keys(translations), function (err, lang) {
           i18n.translator.add(translations[lang] ? translations[lang] : translations.en);
       });
       m.mount(document.querySelector('#select'), LanguageSelect);
       m.route(document.querySelector('#calendar'), '/', {
           '/': JumpThisMonth,
           '/:year/:month': Calendar
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

.. code:: html

   <script type="text/javascript" src="../_static/i18n4v.js"></script>
   <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mithril/0.2.5/mithril.js"></script>

   <div id="select"></div>
   <div id="calendar"></div>
   <script>
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

   // language selection component
   var LanguageSelect = {
       controller: function () {
           this.select = function (lang) {
               i18n.translator.add(translations[lang]);
           };
       },
       view: function (ctrl) {
           return m('div', [
               m('h3', i18n('Language Select')),
               m('button', {onclick: ctrl.select.bind(ctrl, 'en')}, 'English'),
               m('button', {onclick: ctrl.select.bind(ctrl, 'ja')}, 'Japanese')
           ]);
       }
   };

   // Generates calendar
   function calendar(year, month) {
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
   
   // Jump to current month component
   var JumpThisMonth = {
       controller: function () {
           var date = new Date();
           m.route("/" + date.getFullYear() + "/" + (date.getMonth() + 1));
       },
   }

   // Calender component
   var Calendar = {
       controller: function () {
           var self = this;
           this.year = m.prop(Number(m.route.param('year')));
           this.month = m.prop(Number(m.route.param('month')));
           this.calendar = m.prop(calendar(this.year(), this.month()));
           this.next = function () {
               if (self.month() === 12) {
                   m.route('/' + (self.year() + 1) + '/1');
               } else {
                   m.route('/' + self.year() + '/' + (self.month() + 1));
               }
           };
           this.prev = function () {
               if (self.month() === 1) {
                   m.route('/' + (self.year() - 1) + '/12');
               } else {
                   m.route('/' + self.year() + '/' + (self.month() - 1));
               }
           };
       },
       view: function (ctrl) {
           var dayOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
           return m('div', [
               m('h3', i18n('%{month} %{year}', {
                   year: i18n(ctrl.year()),
                   month: i18n(String(ctrl.month()))
               })),
               m('div', [
                   m('button', {onclick: ctrl.prev}, i18n('Previous Month')),
                   m('button', {onclick: ctrl.next}, i18n('Next Month'))
               ]),
               m('table', [
                   m('thead', [
                       m('tr', dayOfWeekLabels.map(function(label) {
                           return m('th', i18n(label));
                       }))
                   ]),
                   m('tbody', ctrl.calendar().map(function(week) {
                       return m('tr', week.map(function(day) {
                           return m('td', (day !== '') ? day : m.trust('&nbsp'));
                       }));
                   }))
               ])
           ]);
       }
   };

   function main() {
       i18n.translator.selectLanguage(Object.keys(translations), function (err, lang) {
           i18n.translator.add(translations[lang] ? translations[lang] : translations.en);
       });
       m.mount(document.querySelector('#select'), LanguageSelect);
       m.route(document.querySelector('#calendar'), '/', {
           '/': JumpThisMonth,
           '/:year/:month': Calendar
       });
   }

   if (document.readyState !== 'loading') {
       main();
   } else {
       document.addEventListener('DOMContentLoaded', main);
   }
   </script>

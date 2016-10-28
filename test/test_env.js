/* eslint-env node, mocha, es6 */

'use strict';

const assert = require('power-assert');
const LocalStorage = require('node-localstorage').LocalStorage;
const locale = require('os-locale');
const i18n = require('../index');


describe('language select', () => {
    it('can find language of current environment', done => {
        locale((err, lang) => {
            var languages = ['en', 'de', 'fr', 'ja', lang];
            i18n.translator.selectLanguage(languages, (err, selectedLanguage) => {
                assert(lang === selectedLanguage);
                done();
            });
        });
    });

    it('can find language of current environment with Promise', done => {
        locale((err, lang) => {
            var languages = ['en', 'de', 'fr', 'ja', lang];
            i18n.translator.selectLanguage(languages)
            .then(selectedLanguage => {
                console.log("then", selectedLanguage);
                assert(lang === selectedLanguage);
                done();
            }, error => {
                console.log(error);
                done();
            }); 
        });
    });

   describe('store language', () => {
       var localStorage;
       before(() => {
           localStorage = new LocalStorage('./scratch');
       });

       it('can store/restore words', done => {
           i18n.translator.setLanguage('tlh', localStorage);
           i18n.translator.selectLanguage(['tlh', 'en', 'ja'], (err, selectedLanguage) => {
               assert(selectedLanguage === 'tlh');
               done();
           }, localStorage);
       }); 

       it('can store/restore words with Promise', () => {
           i18n.translator.setLanguage('tlh', localStorage);
           return i18n.translator.selectLanguage(['tlh', 'en', 'ja'], null, localStorage)
           .then(selectedLanguage => {
               console.log("then", selectedLanguage);
               assert(selectedLanguage === 'tlh');
           }, error => {
               console.log(error);
           }); 
       }); 

       after(() => {
           localStorage._deleteLocation();
       });
   }); 
});

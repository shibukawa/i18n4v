// Type definitions for i18n4v
// Project: i18n4v
// Definitions by: Yoshiki Shibukawa

import {Promise} from 'es6-promise'

interface SelectLanguageCallback {
    (string): void;
}

interface UpdateCallback {
    (string): void;
}

interface CallbackKey {
}

interface Formatting {
    [key: string]: string;
}

interface Context {
    [key: string]: string;
}

declare class Translator {
    translate(text: string, defaultNumOrFormatting?: string|number|Formatting, numOrFormattingOrContext?: number|Formatting|Context, formattingOrContext?: Formatting|Context, context?: Context): string;
    addCallback(callback: UpdateCallback): CallbackKey;
    removeCallback(key: CallbackKey);
    add(dict: any, lang?: string);
    setContext(key: string, value: string): void;
    clearContext(key: string): void;
    reset(): void;
    resetData(): void;
    resetContext(): void;
    applyToHTML(doc?: Document);
}

interface TranslatorFunction {
    (text: string, defaultNumOrFormatting?: string|number|Formatting, numOrFormattingOrContext?: number|Formatting|Context, formattingOrContext?: Formatting|Context, context?: Context): string;
    translator: Translator;
    create(data: any): Translator; 
    selectLanguage(languages: string[], callback?: SelectLanguageCallback): Promise<string>;
    setLanguage(language: string): void;
}

declare const t: TranslatorFunction;
export = t;


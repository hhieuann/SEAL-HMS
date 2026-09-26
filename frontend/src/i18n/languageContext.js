import { createContext } from 'react';

export const LANGUAGES = ['vi', 'en'];
export const DEFAULT_LANGUAGE = 'vi';
export const LANGUAGE_STORAGE_KEY = 'seal_lang';

export const LanguageContext = createContext(null);

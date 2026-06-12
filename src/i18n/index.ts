import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import de from './de';
import en from './en';

export const SUPPORTED_LANGUAGES = ['de', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

// Synchroner Init (Ressourcen inline, kein Backend) — t() ist sofort verfügbar,
// auch außerhalb von React über das Singleton (Store, Utils).
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    fallbackLng: 'de',
    supportedLngs: SUPPORTED_LANGUAGES,
    // 'de-DE' o. ä. auf 'de' reduzieren, damit Detector nur unsere zwei Sprachen liefert.
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
    interpolation: {
      escapeValue: false, // React escaped selbst
    },
  });

export default i18n;

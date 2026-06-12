import 'react-i18next';
import type de from './de';

// Compile-time-Prüfung der Übersetzungs-Keys: t('foo.bar') mit unbekanntem Key = TS-Fehler.
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof de;
    };
  }
}

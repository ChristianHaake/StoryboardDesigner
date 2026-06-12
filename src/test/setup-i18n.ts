// Initialisiert i18next und erzwingt Deutsch für Vitest, damit i18n.t() in
// Store/Utils deterministisch deutsche Strings liefert (Detector ignorieren).
import i18n from '../i18n';

await i18n.changeLanguage('de');

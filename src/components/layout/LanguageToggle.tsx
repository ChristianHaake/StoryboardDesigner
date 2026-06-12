import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n';

interface LanguageToggleProps {
  className?: string;
}

// Segmented Control DE/EN. changeLanguage cached die Wahl via Detector in localStorage.
export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language) as Language;

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={`inline-flex shrink-0 rounded-lg border border-slate-300 bg-slate-100 p-0.5 ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => void i18n.changeLanguage(lng)}
            aria-pressed={active}
            aria-label={t(lng === 'de' ? 'language.switchToDe' : 'language.switchToEn')}
            className={`min-h-9 min-w-9 rounded-md px-2.5 text-sm font-semibold transition-colors ${
              active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            {t(`language.${lng}`)}
          </button>
        );
      })}
    </div>
  );
}

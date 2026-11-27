import { useTranslation } from 'react-i18next';
import { CreatorLanguageMenu } from '../../creator/CreatorShell';
import { SUPPORTED_LANGUAGES, type Language } from '../../shared/i18n';

export default function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  return (
    <CreatorLanguageMenu
      className={className}
      selectClassName="rounded-lg border border-slate-300 bg-white px-2 text-sm"
      value={(i18n.resolvedLanguage ?? i18n.language) as Language}
      languages={SUPPORTED_LANGUAGES}
      onChange={(language) => void i18n.changeLanguage(language)}
    />
  );
}

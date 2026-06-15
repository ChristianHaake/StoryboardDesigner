import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import DisplaySettings from './DisplaySettings';
import BrandLogo from './BrandLogo';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-screen-lg flex-wrap items-end justify-between gap-6 px-4 py-6">
        <div className="flex flex-col gap-4">
          <BrandLogo showTagline={false} />
          <nav
            aria-label={t('footer.nav')}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600 [&_a]:font-medium [&_a]:hover:text-slate-950 [&_a]:hover:underline"
          >
            <Link to="/hilfe">{t('brand.forEducators')}</Link>
            <Link to="/ueber">{t('footer.about')}</Link>
            <Link to="/datenschutz">{t('footer.privacy')}</Link>
            <Link to="/impressum">{t('footer.imprint')}</Link>
          </nav>
          <p className="text-xs text-slate-500 max-sm:w-full">{t('footer.localNote')}</p>
        </div>

        <div className="flex flex-col items-end gap-4 max-sm:w-full max-sm:items-start">
          <div className="flex items-center gap-3">
            <DisplaySettings />
            <LanguageToggle />
          </div>
          <a
            href="https://github.com/ChristianHaake/StoryboardDesigner"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            title={t('footer.repository')}
          >
            <span>Quellcode (GitHub)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

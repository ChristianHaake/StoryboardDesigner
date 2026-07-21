import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import DisplaySettings from './DisplaySettings';
import { Code2 } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-screen-lg flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <nav
            aria-label={t('footer.nav')}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 [&_a]:transition-colors [&_a]:hover:text-blue-600"
          >
            <Link to="/hilfe">{t('footer.help')}</Link>
            <Link to="/lehrkraefte">{t('brand.forEducators')}</Link>
            <Link to="/ueber">{t('footer.about')}</Link>
            <Link to="/datenschutz">{t('footer.privacy')}</Link>
            <Link to="/impressum">{t('footer.imprint')}</Link>
          </nav>
          <p className="text-xs text-slate-400">{t('footer.localNote')}</p>
        </div>

        <div className="flex items-center gap-4">
          <DisplaySettings />
          <LanguageToggle />
          <div className="h-4 w-px bg-slate-200" aria-hidden="true" />
          <a
            href="https://github.com/ChristianHaake/Storyboard-Creator"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title={t('footer.repository')}
            aria-label={t('footer.repository')}
          >
            <Code2 className="h-5 w-5" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}

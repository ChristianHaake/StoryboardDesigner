import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DisplaySettings from './DisplaySettings';
import { Code2, Coffee } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/95 shadow-[0_-10px_28px_rgba(15,23,42,0.05)] print:hidden">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
        <span className="shrink-0 text-xs font-semibold text-slate-600 max-md:hidden">
          {t('footer.localNote')}
        </span>
        <nav
          aria-label={t('footer.nav')}
          className="flex min-w-0 flex-1 basis-full flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-600 sm:basis-auto [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center [&_a]:justify-center [&_a]:rounded-lg [&_a]:px-2 [&_a]:transition-colors [&_a]:hover:bg-slate-100 [&_a]:hover:text-blue-600"
        >
          <Link to="/hilfe">{t('footer.help')}</Link>
          <Link to="/ueber">{t('footer.about')}</Link>
          <Link to="/datenschutz">{t('footer.privacy')}</Link>
          <Link to="/impressum">{t('footer.imprint')}</Link>
        </nav>
        <DisplaySettings />
        <a
          href="https://buymeacoffee.com/Haake"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-black bg-[#ffdd00] px-3 text-xs font-bold text-black transition-[background-color,transform] motion-safe:active:scale-[0.96] hover:bg-[#ffe838] max-sm:px-3"
        >
          <Coffee className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          <span className="max-sm:hidden">{t('footer.coffee')}</span>
        </a>
        <a
          href="https://github.com/ChristianHaake/Storyboard-Creator"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-slate-500 transition-[color,background-color,transform] motion-safe:active:scale-[0.96] hover:bg-slate-100 hover:text-slate-900"
          title={t('footer.repository')}
          aria-label={t('footer.repository')}
        >
          <Code2 className="h-5 w-5" strokeWidth={1.5} />
          <span className="max-sm:sr-only">{t('footer.repository')}</span>
        </a>
      </div>
    </footer>
  );
}

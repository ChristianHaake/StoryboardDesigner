import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DisplaySettings from './DisplaySettings';
import { Code2, Coffee } from 'lucide-react';

// Kompakte, immer sichtbare Fußzeile (fix am unteren Rand) im SMC-Stil.
// Der Inhaltsabstand wird in App.tsx über pb-14 reserviert.
export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 shadow-[0_-10px_28px_rgba(15,23,42,0.07)] backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-2 sm:gap-4">
        <span className="shrink-0 text-xs font-semibold text-slate-600 max-md:hidden">
          {t('footer.localNote')}
        </span>
        <nav
          aria-label={t('footer.nav')}
          className="flex min-w-0 flex-1 items-center gap-x-4 overflow-x-auto whitespace-nowrap text-xs font-medium text-slate-600 [scrollbar-width:thin] [&_a]:transition-colors [&_a]:hover:text-blue-600"
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
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black bg-[#ffdd00] px-3 py-1 text-xs font-bold text-black transition-colors hover:bg-[#ffe838] max-sm:px-2"
        >
          <Coffee className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          <span className="max-sm:hidden">{t('footer.coffee')}</span>
        </a>
        <a
          href="https://github.com/ChristianHaake/Storyboard-Creator"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          title={t('footer.repository')}
          aria-label={t('footer.repository')}
        >
          <Code2 className="h-5 w-5" strokeWidth={1.5} />
        </a>
      </div>
    </footer>
  );
}

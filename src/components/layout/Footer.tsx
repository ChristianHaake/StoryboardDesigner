import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BrandLogo from './BrandLogo';
import StatusPill from './StatusPill';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-screen-lg flex-wrap items-center justify-between gap-4 px-4 py-6">
        <BrandLogo showTagline={false} />
        <nav
          aria-label={t('footer.nav')}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600"
        >
          <Link to="/hilfe" className="font-medium hover:text-slate-950 hover:underline">
            {t('footer.help')}
          </Link>
          <Link to="/datenschutz" className="font-medium hover:text-slate-950 hover:underline">
            {t('footer.privacy')}
          </Link>
          <Link to="/impressum" className="font-medium hover:text-slate-950 hover:underline">
            {t('footer.imprint')}
          </Link>
        </nav>
        <StatusPill label={t('brand.localPill')} className="max-sm:hidden" />
      </div>
    </footer>
  );
}

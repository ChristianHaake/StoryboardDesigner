import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-gray-300/70 bg-gray-100/80 px-4 py-5 text-center text-sm text-gray-600 print:hidden">
      <nav aria-label={t('footer.nav')} className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Link
          to="/hilfe"
          className="rounded-md px-1 py-1 font-medium hover:text-gray-950 hover:underline"
        >
          {t('footer.help')}
        </Link>
        <Link
          to="/datenschutz"
          className="rounded-md px-1 py-1 font-medium hover:text-gray-950 hover:underline"
        >
          {t('footer.privacy')}
        </Link>
        <Link
          to="/impressum"
          className="rounded-md px-1 py-1 font-medium hover:text-gray-950 hover:underline"
        >
          {t('footer.imprint')}
        </Link>
      </nav>
    </footer>
  );
}

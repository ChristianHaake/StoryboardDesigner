import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Dezenter Bildungs-Hinweisbanner (amber). Nicht im Druck.
export default function InfoBanner() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto mt-4 flex max-w-screen-lg items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 max-sm:mx-4 print:hidden">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <path d="M3 9l9-5 9 5-9 5-9-5Z" />
        <path d="M7 11v4c0 1 2 2 5 2s5-1 5-2v-4" />
      </svg>
      <p className="flex-1">
        {t('brand.eduNotice')}{' '}
        <Link to="/datenschutz" className="font-semibold underline underline-offset-2 hover:text-amber-950">
          {t('brand.eduNoticeLink')}
        </Link>
      </p>
    </div>
  );
}

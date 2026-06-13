import { useTranslation } from 'react-i18next';

interface BrandLogoProps {
  /** Tagline ausblenden (z. B. im Footer). */
  showTagline?: boolean;
  className?: string;
}

// Markenzeichen: blau-gradientes Quadrat mit Storyboard-Icon + Wortmarke.
export default function BrandLogo({ showTagline = true, className = '' }: BrandLogoProps) {
  const { t } = useTranslation();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        aria-hidden="true"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18M8 5v14M16 5v14" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight text-slate-950">
          {t('common.appTitle')}
        </span>
        {showTagline && (
          <span className="block text-xs text-slate-500">{t('brand.tagline')}</span>
        )}
      </span>
    </div>
  );
}

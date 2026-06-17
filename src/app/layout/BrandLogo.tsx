import { useTranslation } from 'react-i18next';
import logoSquareDefault from '../../assets/logo-square-default.png';
import logoSquareInverted from '../../assets/logo-square-inverted.png';
import logoWideDefault from '../../assets/logo-wide-default.png';
import logoWideInverted from '../../assets/logo-wide-inverted.png';

interface LocalBrandLogoProps {
  showTagline?: boolean;
  className?: string;
  inverted?: boolean;
}

export default function BrandLogo({
  showTagline = true,
  className = '',
  inverted = false,
}: LocalBrandLogoProps) {
  const { t } = useTranslation();

  const squareLogo = inverted ? logoSquareInverted : logoSquareDefault;
  const wideLogo = inverted ? logoWideInverted : logoWideDefault;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <picture className="flex shrink-0">
        <source media="(min-width: 768px)" srcSet={wideLogo} />
        <img
          src={squareLogo}
          alt={t('brand.name')}
          className="h-10 w-auto object-contain"
        />
      </picture>
      <span className="leading-tight md:hidden">
        <span className={`block text-base font-bold tracking-tight ${inverted ? 'text-white' : 'text-slate-950'}`}>
          {t('brand.name')}
        </span>
        {showTagline && t('brand.tagline') && (
          <span className={`block text-xs ${inverted ? 'text-slate-300' : 'text-slate-500'}`}>{t('brand.tagline')}</span>
        )}
      </span>
    </div>
  );
}

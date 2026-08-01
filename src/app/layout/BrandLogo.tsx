import { useTranslation } from 'react-i18next';
import logoWideDefault from '../../assets/logo-wide-default.png';
import logoWideInverted from '../../assets/logo-wide-inverted.png';
import logoSquareDefault from '../../assets/logo-square-default.png';
import logoSquareInverted from '../../assets/logo-square-inverted.png';

interface LocalBrandLogoProps {
  showTagline?: boolean; // Kept for interface compatibility
  className?: string;
  inverted?: boolean;
}

export default function BrandLogo({ className = '', inverted = false }: LocalBrandLogoProps) {
  const { t } = useTranslation();

  // Beide Varianten rendern; CSS in index.css blendet je nach data-theme die
  // passende ein (Theme-State lebt nicht in React, sondern auf <html>).
  return (
    <div className={`flex shrink-0 items-center ${className}`}>
      <span className="inline-flex sm:hidden">
        <img
          src={inverted ? logoSquareInverted : logoSquareDefault}
          alt={t('brand.name')}
          className="brand-logo-default size-9 shrink-0 object-contain"
        />
        <img
          src={logoSquareInverted}
          alt={t('brand.name')}
          className="brand-logo-inverted hidden size-9 shrink-0 object-contain"
        />
      </span>
      <span className="hidden sm:inline-flex">
        <img
          src={inverted ? logoWideInverted : logoWideDefault}
          alt={t('brand.name')}
          className="brand-logo-default h-9 w-auto shrink-0 object-contain"
        />
        <img
          src={logoWideInverted}
          alt={t('brand.name')}
          className="brand-logo-inverted hidden h-9 w-auto shrink-0 object-contain"
        />
      </span>
    </div>
  );
}

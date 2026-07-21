import { useTranslation } from 'react-i18next';
import logoWideDefault from '../../assets/logo-wide-default.png';
import logoWideInverted from '../../assets/logo-wide-inverted.png';

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
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={inverted ? logoWideInverted : logoWideDefault}
        alt={t('brand.name')}
        className="brand-logo-default h-9 w-auto object-contain"
      />
      <img
        src={logoWideInverted}
        alt={t('brand.name')}
        className="brand-logo-inverted hidden h-9 w-auto object-contain"
      />
    </div>
  );
}

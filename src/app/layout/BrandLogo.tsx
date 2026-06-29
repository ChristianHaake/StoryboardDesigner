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

  const wideLogo = inverted ? logoWideInverted : logoWideDefault;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={wideLogo} alt={t('brand.name')} className="h-9 w-auto object-contain" />
    </div>
  );
}

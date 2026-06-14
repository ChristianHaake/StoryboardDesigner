import { useTranslation } from 'react-i18next';
import { BrandLogo as SharedBrandLogo } from '@haak3/ui';

interface LocalBrandLogoProps {
  showTagline?: boolean;
  className?: string;
  inverted?: boolean;
}

export default function BrandLogo({ showTagline = true, className = '', inverted = false }: LocalBrandLogoProps) {
  const { t } = useTranslation();
  return (
    <SharedBrandLogo
      appTitle={t('brand.name')}
      tagline={t('brand.tagline')}
      showTagline={showTagline}
      className={className}
      inverted={inverted}
    />
  );
}

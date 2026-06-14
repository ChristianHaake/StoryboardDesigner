import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HeroIntro as SharedHeroIntro } from '@haak3/ui';

export default function HeroIntro() {
  const { t } = useTranslation();
  return (
    <SharedHeroIntro
      kicker={t('hero.kicker')}
      title={t('hero.title')}
      subtitle={t('hero.subtitle')}
      eduNotice={
        <>
          {t('brand.eduNotice')}{' '}
          <Link
            to="/datenschutz"
            className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-950"
          >
            {t('brand.eduNoticeLink')}
          </Link>
        </>
      }
    />
  );
}

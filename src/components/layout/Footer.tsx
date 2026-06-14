import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Footer as SharedFooter } from '@haak3/ui';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <SharedFooter
      appTitle={t('brand.name')}
      localNote={t('footer.localNote')}
      navAriaLabel={t('footer.nav')}
    >
      <Link to="/hilfe">{t('footer.help')}</Link>
      <Link to="/ueber">{t('footer.about')}</Link>
      <Link to="/datenschutz">{t('footer.privacy')}</Link>
      <Link to="/impressum">{t('footer.imprint')}</Link>
      <a
        href="https://github.com/ChristianHaake/StoryboardDesigner"
        target="_blank"
        rel="noreferrer"
      >
        {t('footer.repository')}
      </a>
    </SharedFooter>
  );
}

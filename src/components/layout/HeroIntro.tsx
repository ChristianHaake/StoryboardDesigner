import { useTranslation } from 'react-i18next';

// Kompakte Intro-Band über dem A4-Dokument (SMC-Hero-Stil). Nicht im Druck.
export default function HeroIntro() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto mt-6 max-w-screen-lg max-sm:mx-4 print:hidden">
      <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase">
        {t('hero.kicker')}
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
        {t('hero.title')}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-gray-600 sm:text-base">{t('hero.subtitle')}</p>
    </section>
  );
}

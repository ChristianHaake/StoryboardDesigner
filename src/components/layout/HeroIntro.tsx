import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Kompakter Einstieg über dem A4-Dokument (SMC-Hero-Stil): Kicker, Headline,
// ein Satz und eine einzeilige Bildungs-Fußnote. Nicht im Druck.
export default function HeroIntro() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto mt-6 max-w-screen-lg max-sm:mx-4 print:hidden">
      <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase">
        {t('hero.kicker')}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        {t('hero.title')}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">{t('hero.subtitle')}</p>
      <p className="mt-3 text-xs text-slate-500">
        {t('brand.eduNotice')}{' '}
        <Link
          to="/datenschutz"
          className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-950"
        >
          {t('brand.eduNoticeLink')}
        </Link>
      </p>
    </section>
  );
}

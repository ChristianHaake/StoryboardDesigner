import { Coffee, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { PATH_BY_STEP } from '../wizard/wizardPaths';

const coffeeClass =
  'inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg bg-[#b84a00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#943900] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#943900]';
const feedbackClass =
  'inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-blue-700 underline underline-offset-4 hover:bg-blue-50';

export default function SupportPage() {
  const { t } = useTranslation();
  const wizardPath = useStoryboardStore((state) => PATH_BY_STEP[state.activeStep]);

  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('support.title')}</h1>
        <p className="mt-3 text-slate-700">{t('support.intro')}</p>
        <a
          className={`mt-5 ${coffeeClass}`}
          href="https://buymeacoffee.com/Haake"
          target="_blank"
          rel="noopener noreferrer"
          aria-describedby="support-provider"
        >
          <Coffee size={18} aria-hidden="true" />
          {t('support.coffee')}
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <p id="support-provider" className="mt-3 text-sm text-slate-600">
          {t('support.privacy')}
        </p>

        <section className="mt-6 border-t border-slate-200 pt-5" aria-labelledby="support-feedback">
          <h2 id="support-feedback" className="text-lg font-semibold">
            {t('support.feedback')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t('support.feedbackNote')}</p>
          <div className="mt-1 flex flex-wrap gap-x-3">
            <a
              className={feedbackClass}
              href="https://haak3.atlassian.net/jira/software/form/69a50efc-0474-445e-8f01-66eb6b747cc1"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('support.bug')}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
            <a
              className={feedbackClass}
              href="https://haak3.atlassian.net/jira/software/form/50d4fc51-bff4-4e21-b46e-8fd987b90d24"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('support.idea')}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
            <a className={feedbackClass} href="mailto:apps@haak3.de">
              apps@haak3.de
            </a>
          </div>
        </section>

        <Link
          to={wizardPath}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {t('markdown.backToEditor')}
        </Link>
      </div>
    </main>
  );
}

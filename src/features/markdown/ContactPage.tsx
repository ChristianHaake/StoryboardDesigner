import { Camera, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import A4Page from '../../app/layout/A4Page';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { PATH_BY_STEP } from '../wizard/wizardPaths';

const profiles = [
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/christianhaake/', Icon: LinkIcon },
  { name: 'Instagram', href: 'https://www.instagram.com/_haake/', Icon: Camera },
  { name: 'Threads', href: 'https://www.threads.com/@_haake', Icon: MessageCircle },
] as const;

export default function ContactPage() {
  const { t } = useTranslation();
  const wizardPath = useStoryboardStore((s) => PATH_BY_STEP[s.activeStep]);
  return (
    <main id="main" tabIndex={-1} className="focus:outline-none">
      <A4Page>
        <Link
          to={wizardPath}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
        >
          {t('markdown.backToEditor')}
        </Link>
        <div className="prose prose-gray mt-6 max-w-none prose-headings:tracking-tight prose-a:text-blue-700 prose-a:decoration-blue-300 prose-a:underline-offset-3">
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.description')}</p>
          <h2>{t('contact.emailHeading')}</h2>
          <p><a href="mailto:apps@haak3.de">apps@haak3.de</a></p>
          <h2>{t('contact.socialHeading')}</h2>
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {profiles.map(({ name, href, Icon }) => (
              <li key={name}>
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-3 no-underline hover:bg-slate-50"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon aria-hidden="true" size={20} />
                  <span>{name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </A4Page>
    </main>
  );
}

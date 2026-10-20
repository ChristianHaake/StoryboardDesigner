import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import A4Page from '../../app/layout/A4Page';

export type ContentLanguage = 'de' | 'en';

interface MarkdownViewProps {
  source: string;
  /** Sprache des Textes (nicht der UI): setzt `lang` am Inhalt für Screenreader
   *  und zeigt einen Hinweis, wenn die UI-Sprache davon abweicht. */
  contentLanguage: ContentLanguage;
}

export default function MarkdownView({ source, contentLanguage }: MarkdownViewProps) {
  const { t, i18n } = useTranslation();
  const uiLanguage = i18n.resolvedLanguage ?? i18n.language;
  const showLanguageNote = uiLanguage !== contentLanguage;

  return (
    <main>
      <A4Page>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
        >
          {t('markdown.backToEditor')}
        </Link>
        {showLanguageNote && (
          <p role="note" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t(contentLanguage === 'de' ? 'markdown.germanOnly' : 'markdown.englishOnly')}
          </p>
        )}
        <div
          lang={contentLanguage}
          className="prose prose-gray mt-6 max-w-none prose-headings:tracking-tight prose-a:text-blue-700 prose-a:decoration-blue-300 prose-a:underline-offset-3"
        >
          <ReactMarkdown>{source}</ReactMarkdown>
        </div>
      </A4Page>
    </main>
  );
}

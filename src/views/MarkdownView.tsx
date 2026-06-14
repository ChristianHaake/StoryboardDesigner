import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import A4Page from '../components/layout/A4Page';

interface MarkdownViewProps {
  source: string;
  /** true für Rechtsseiten, die nur auf Deutsch vorliegen — zeigt auf
   *  nicht-deutscher UI einen Hinweis oberhalb des Inhalts. */
  germanOnly?: boolean;
}

export default function MarkdownView({ source, germanOnly = false }: MarkdownViewProps) {
  const { t, i18n } = useTranslation();
  const showGermanOnlyNote = germanOnly && i18n.language !== 'de';

  return (
    <main>
      <A4Page>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
        >
          {t('markdown.backToEditor')}
        </Link>
        {showGermanOnlyNote && (
          <p role="note" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('markdown.germanOnly')}
          </p>
        )}
        <div className="prose prose-gray mt-6 max-w-none prose-headings:tracking-tight prose-a:text-blue-700 prose-a:decoration-blue-300 prose-a:underline-offset-3">
          <ReactMarkdown>{source}</ReactMarkdown>
        </div>
      </A4Page>
    </main>
  );
}

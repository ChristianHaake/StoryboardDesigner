import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import A4Page from '../components/layout/A4Page';

interface MarkdownViewProps {
  source: string;
}

export default function MarkdownView({ source }: MarkdownViewProps) {
  return (
    <main>
      <A4Page>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
        >
          ← Zurück zum Editor
        </Link>
        <div className="prose prose-gray mt-6 max-w-none prose-headings:tracking-tight prose-a:text-blue-700 prose-a:decoration-blue-300 prose-a:underline-offset-3">
          <ReactMarkdown>{source}</ReactMarkdown>
        </div>
      </A4Page>
    </main>
  );
}

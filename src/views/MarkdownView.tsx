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
        <Link to="/" className="text-sm font-medium text-blue-600 hover:underline">
          ← Zurück zum Editor
        </Link>
        <div className="prose prose-gray mt-6 max-w-none">
          <ReactMarkdown>{source}</ReactMarkdown>
        </div>
      </A4Page>
    </main>
  );
}

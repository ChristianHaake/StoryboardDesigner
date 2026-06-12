import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="py-6 text-center text-xs text-gray-500 print:hidden">
      <nav className="flex justify-center gap-4">
        <Link to="/hilfe" className="hover:text-gray-900 hover:underline">
          Hilfe
        </Link>
        <Link to="/datenschutz" className="hover:text-gray-900 hover:underline">
          Datenschutz
        </Link>
        <Link to="/impressum" className="hover:text-gray-900 hover:underline">
          Impressum
        </Link>
      </nav>
    </footer>
  );
}

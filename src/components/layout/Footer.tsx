import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-300/70 bg-gray-100/80 px-4 py-5 text-center text-sm text-gray-600 print:hidden">
      <nav
        aria-label="Rechtliches und Hilfe"
        className="flex flex-wrap justify-center gap-x-6 gap-y-2"
      >
        <Link
          to="/hilfe"
          className="rounded-md px-1 py-1 font-medium hover:text-gray-950 hover:underline"
        >
          Hilfe
        </Link>
        <Link
          to="/datenschutz"
          className="rounded-md px-1 py-1 font-medium hover:text-gray-950 hover:underline"
        >
          Datenschutz
        </Link>
        <Link
          to="/impressum"
          className="rounded-md px-1 py-1 font-medium hover:text-gray-950 hover:underline"
        >
          Impressum
        </Link>
      </nav>
    </footer>
  );
}

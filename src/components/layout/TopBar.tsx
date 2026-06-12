export default function TopBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-300 bg-white print:hidden">
      <div className="mx-auto flex max-w-screen-lg flex-wrap items-center justify-between gap-2 px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-900">StoryboardCreator</h1>
        <nav className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Projekt laden
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Lokal speichern
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            PDF exportieren
          </button>
        </nav>
      </div>
    </header>
  );
}

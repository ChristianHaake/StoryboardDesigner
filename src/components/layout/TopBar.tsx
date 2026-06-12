import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { selectProject, useStoryboardStore } from '../../store/useStoryboardStore';
import { exportProject, importProject, ImportError } from '../../utils/zipHandler';

export default function TopBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const state = useStoryboardStore.getState();
    try {
      await exportProject(selectProject(state), state.images);
    } catch (err: unknown) {
      console.warn('Export fehlgeschlagen:', err);
      state.setErrorMessage('Projekt konnte nicht gespeichert werden.');
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const state = useStoryboardStore.getState();
    if (
      state.hasContent &&
      !window.confirm('Aktuelles Projekt ersetzen? Es wird durch die geladene Datei überschrieben.')
    ) {
      return;
    }
    try {
      const { project, images } = await importProject(file);
      useStoryboardStore.getState().loadProject(project, images, true);
      state.clearErrorMessage();
    } catch (err: unknown) {
      state.setErrorMessage(
        err instanceof ImportError ? err.message : 'Die Datei konnte nicht geladen werden.',
      );
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur print:hidden">
      <div className="mx-auto max-w-screen-lg px-4 py-2 sm:flex sm:min-h-14 sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-lg font-bold tracking-tight text-gray-950 max-sm:mb-2">
          StoryboardCreator
        </h1>
        <nav aria-label="Projektaktionen" className="grid grid-cols-3 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="max-[430px]:text-xs">Laden</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 21V9m0 0 4 4m-4-4-4 4" />
              <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="max-[430px]:text-xs">Speichern</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M7 8V3h10v5" />
              <path d="M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M7 14h10v7H7z" />
            </svg>
            <span className="max-[430px]:text-xs">PDF</span>
          </button>
        </nav>
        <input
          ref={fileInputRef}
          type="file"
          accept=".storyboard,.zip"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </header>
  );
}

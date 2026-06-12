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
      state.touched &&
      !window.confirm('Aktuelles Projekt ersetzen? Es wird durch die geladene Datei überschrieben.')
    ) {
      return;
    }
    try {
      const { project, images } = await importProject(file);
      useStoryboardStore.getState().loadProject(project, images);
      state.clearErrorMessage();
    } catch (err: unknown) {
      state.setErrorMessage(
        err instanceof ImportError ? err.message : 'Die Datei konnte nicht geladen werden.',
      );
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-300 bg-white print:hidden">
      <div className="mx-auto flex max-w-screen-lg flex-wrap items-center justify-between gap-2 px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-900">StoryboardCreator</h1>
        <nav className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Projekt laden
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Lokal speichern
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            PDF exportieren
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

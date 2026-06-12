import { useEffect } from 'react';
import { useStoryboardStore } from '../../store/useStoryboardStore';

const UNDO_DISMISS_MS = 6000;
const ERROR_DISMISS_MS = 8000;

/** Gestapelter Benachrichtigungsbereich: Fehler-Toast + Undo-Snackbar
 *  teilen sich eine Position und überlappen nie. */
export default function Notifications() {
  const lastDeleted = useStoryboardStore((s) => s.lastDeleted);
  const undoDelete = useStoryboardStore((s) => s.undoDelete);
  const clearLastDeleted = useStoryboardStore((s) => s.clearLastDeleted);
  const errorMessage = useStoryboardStore((s) => s.errorMessage);
  const clearErrorMessage = useStoryboardStore((s) => s.clearErrorMessage);

  useEffect(() => {
    if (!lastDeleted) return;
    const timer = window.setTimeout(clearLastDeleted, UNDO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [lastDeleted, clearLastDeleted]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(clearErrorMessage, ERROR_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [errorMessage, clearErrorMessage]);

  if (!lastDeleted && !errorMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 print:hidden">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-4 rounded-md bg-red-700 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={clearErrorMessage}
            aria-label="Meldung schließen"
            className="font-semibold underline-offset-2 hover:underline"
          >
            OK
          </button>
        </div>
      )}
      {lastDeleted && (
        <div
          role="status"
          className="flex items-center gap-4 rounded-md bg-gray-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>Szene {lastDeleted.index + 1} gelöscht</span>
          <button
            type="button"
            onClick={undoDelete}
            className="font-semibold text-blue-300 underline-offset-2 hover:underline"
          >
            Rückgängig
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { useStoryboardStore } from '../../store/useStoryboardStore';

const AUTO_DISMISS_MS = 6000;

export default function UndoSnackbar() {
  const lastDeleted = useStoryboardStore((s) => s.lastDeleted);
  const undoDelete = useStoryboardStore((s) => s.undoDelete);
  const clearLastDeleted = useStoryboardStore((s) => s.clearLastDeleted);

  useEffect(() => {
    if (!lastDeleted) return;
    const timer = window.setTimeout(clearLastDeleted, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [lastDeleted, clearLastDeleted]);

  if (!lastDeleted) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4 rounded-md bg-gray-900 px-4 py-3 text-sm text-white shadow-lg print:hidden"
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
  );
}

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../store/useStoryboardStore';

const UNDO_DISMISS_MS = 6000;
const ERROR_DISMISS_MS = 8000;
const SUCCESS_DISMISS_MS = 4000;

/** Gestapelter Benachrichtigungsbereich: Fehler-Toast + Undo-Snackbar
 *  teilen sich eine Position und überlappen nie. */
export default function Notifications() {
  const { t } = useTranslation();
  const lastDeleted = useStoryboardStore((s) => s.lastDeleted);
  const undoDelete = useStoryboardStore((s) => s.undoDelete);
  const clearLastDeleted = useStoryboardStore((s) => s.clearLastDeleted);

  const errorMessage = useStoryboardStore((s) => s.errorMessage);
  const clearErrorMessage = useStoryboardStore((s) => s.clearErrorMessage);

  const successMessage = useStoryboardStore((s) => s.successMessage);
  const clearSuccessMessage = useStoryboardStore((s) => s.clearSuccessMessage);

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

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(clearSuccessMessage, SUCCESS_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [successMessage, clearSuccessMessage]);

  if (!lastDeleted && !errorMessage && !successMessage) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-20 flex flex-col items-center gap-2 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 print:hidden">
      {errorMessage && (
        <div
          role="alert"
          className="flex w-full max-w-lg items-center justify-between gap-4 rounded-xl bg-red-700 px-4 py-3 text-sm text-white shadow-xl shadow-red-950/15"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={clearErrorMessage}
            aria-label={t('notifications.dismiss')}
            className="min-h-11 shrink-0 rounded-lg px-3 font-semibold hover:bg-white/10"
          >
            OK
          </button>
        </div>
      )}
      {successMessage && (
        <div
          role="status"
          className="flex w-full max-w-lg items-center justify-between gap-4 rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-xl shadow-emerald-900/20"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={clearSuccessMessage}
            aria-label={t('notifications.dismiss')}
            className="min-h-11 shrink-0 rounded-lg px-3 font-semibold hover:bg-white/10"
          >
            OK
          </button>
        </div>
      )}
      {lastDeleted && (
        <div
          role="status"
          className="flex w-full max-w-lg items-center justify-between gap-4 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-xl shadow-slate-950/20"
        >
          <span>{t('notifications.sceneDeleted', { n: lastDeleted.index + 1 })}</span>
          <button
            type="button"
            onClick={undoDelete}
            className="min-h-11 shrink-0 rounded-lg px-3 font-semibold text-blue-300 hover:bg-white/10"
          >
            {t('notifications.undo')}
          </button>
        </div>
      )}
    </div>
  );
}

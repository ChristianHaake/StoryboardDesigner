import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { buttonSecondary } from './fieldStyles';
import { useConfirmStore } from './confirm';

export default function ConfirmDialog() {
  const { t } = useTranslation();
  const request = useConfirmStore((s) => s.request);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (request && dialog && !dialog.open) dialog.showModal();
  }, [request]);

  if (!request) return null;

  // close() gibt den Fokus an das auslösende Element zurück.
  function finish(confirmed: boolean) {
    dialogRef.current?.close();
    request?.resolve(confirmed);
    useConfirmStore.setState({ request: null });
  }

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-describedby={messageId}
      className="m-auto w-[min(92vw,440px)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
      onCancel={(event) => {
        event.preventDefault();
        finish(false);
      }}
    >
      <div className="p-6">
        <p id={messageId} className="text-pretty text-base leading-relaxed">
          {request.message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {/* Abbrechen steht zuerst und bekommt den Startfokus: sicherer Standard. */}
          <button
            type="button"
            autoFocus
            onClick={() => finish(false)}
            className={`${buttonSecondary} min-h-11 px-5`}
          >
            {t('confirm.cancel')}
          </button>
          <button
            type="button"
            onClick={() => finish(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

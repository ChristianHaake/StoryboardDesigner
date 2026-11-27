import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatorDialog } from '../../creator/CreatorShell';
import { useConfirmStore } from './confirm';

export default function ConfirmDialog() {
  const { t } = useTranslation();
  const returnFocus = useRef<HTMLElement>(null);
  const request = useConfirmStore((s) => s.request);
  if (!request) return null;

  function finish(confirmed: boolean) {
    request?.resolve(confirmed);
    useConfirmStore.setState({ request: null });
  }

  return (
    <CreatorDialog
      open
      urgent
      returnFocus={returnFocus}
      title={request.confirmLabel}
      cancelLabel={t('confirm.cancel')}
      onCancel={() => finish(false)}
      className="w-[min(92vw,440px)] rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
      actions={
        <button
          type="button"
          onClick={() => finish(true)}
          className="rounded-lg bg-red-600 px-5 font-semibold text-white hover:bg-red-700"
        >
          {request.confirmLabel}
        </button>
      }
    >
      <p className="my-4 text-pretty text-base leading-relaxed">{request.message}</p>
    </CreatorDialog>
  );
}

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Folder, Trash2, Upload } from 'lucide-react';
import { buttonSecondary } from '../../shared/ui/fieldStyles';

interface FileMenuProps {
  onLoad: () => void;
  onSave: () => void;
  onReset: () => void;
  saveBusy: boolean;
}

const itemClass =
  'flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Datei-Menü als Disclosure-Muster: Knopf mit aria-expanded, Escape und Klick
 * daneben schließen, Fokus kehrt zum Knopf zurück. Die Einträge folgen im
 * Tab-Reihenfolge direkt auf den Knopf.
 */
export default function FileMenu({ onLoad, onSave, onReset, saveBusy }: FileMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Menü schließen und Fokus zurück an den Knopf, dann Aktion starten: ein
  // folgender Dialog gibt den Fokus so an einen existierenden Knopf zurück.
  function choose(action: () => void) {
    setOpen(false);
    triggerRef.current?.focus();
    action();
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('topbar.file')}
        title={t('topbar.file')}
        onClick={() => setOpen((value) => !value)}
        className={`${buttonSecondary} min-h-11`}
      >
        <Folder className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
        <span className="max-sm:hidden">{t('topbar.file')}</span>
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute top-full left-0 z-50 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          <button
            type="button"
            onClick={() => choose(onLoad)}
            className={`${itemClass} text-slate-700 hover:bg-slate-100 hover:text-slate-900`}
          >
            <Upload className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            {t('topbar.load')}
          </button>
          <button
            type="button"
            disabled={saveBusy}
            aria-busy={saveBusy}
            onClick={() => choose(onSave)}
            className={`${itemClass} text-slate-700 hover:bg-slate-100 hover:text-slate-900`}
          >
            <Download className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            {t('topbar.save')}
          </button>
          <div className="my-1.5 h-px bg-slate-100" role="separator" />
          <button
            type="button"
            onClick={() => choose(onReset)}
            className={`${itemClass} text-red-600 hover:bg-red-50 hover:text-red-700`}
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            {t('topbar.reset')}
          </button>
        </div>
      )}
    </div>
  );
}

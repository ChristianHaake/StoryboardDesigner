import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../store/useStoryboardStore';

// Sichtbarer Autosave-Hinweis (#6a): „Speichern …" / „Gespeichert".
// aria-live=polite, damit Screenreader den Statuswechsel mitbekommen.
export default function SaveIndicator({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const status = useStoryboardStore((s) => s.saveStatus);

  if (status === 'idle') return null;

  const saving = status === 'saving';
  const error = status === 'error';
  const label = saving ? t('save.saving') : error ? t('save.error') : t('save.saved');

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        error ? 'text-red-700' : 'text-slate-500'
      } ${className}`}
    >
      {saving ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          className="motion-safe:animate-spin"
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      ) : error ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M12 8v5M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </span>
  );
}

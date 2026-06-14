import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { Loader2, AlertCircle, Check } from 'lucide-react';

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
        <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" strokeWidth={2.4} aria-hidden="true" />
      ) : error ? (
        <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <Check className="w-3.5 h-3.5" strokeWidth={2.4} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

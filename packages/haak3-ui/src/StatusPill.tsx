import { Check } from 'lucide-react';

export interface StatusPillProps {
  label: string;
  className?: string;
}

// Grüne „Inhalte bleiben lokal"-Pill mit Haken (SMC-Stil).
export function StatusPill({ label, className = '' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ${className}`}
    >
      <Check className="w-3.5 h-3.5" strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

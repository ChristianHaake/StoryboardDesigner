import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';

// Durchgängiger 5-Schritt-Indikator (Format → Einrichten → Storyboard → Prüfen →
// Export). Rein visuell; Navigation läuft weiter über die Schaltflächen der
// Schritte, damit Pflichtfelder (Projektname) nicht übersprungen werden.
const STEPS = ['stepFormat', 'stepSetup', 'stepEditor', 'stepReview', 'stepExport'] as const;
const STEP_INDEX: Record<string, number> = { start: 0, setup: 1, editor: 2, review: 3, export: 4 };

export default function WizardSteps() {
  const { t } = useTranslation();
  const activeStep = useStoryboardStore((s) => s.activeStep);
  const current = STEP_INDEX[activeStep] ?? 0;

  return (
    <nav aria-label={t('wizard.stepsLabel')} className="mb-8 print:hidden">
      <ol className="flex items-center">
        {STEPS.map((key, i) => {
          const done = i < current;
          const active = i === current;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={key} className={`flex items-center gap-2.5 ${isLast ? '' : 'flex-1'}`}>
              <span
                className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : done
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span
                aria-current={active ? 'step' : undefined}
                className={`truncate text-sm font-medium max-sm:hidden ${
                  active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {t(`wizard.${key}`)}
                {active && <span className="sr-only"> — {t('wizard.stepStatusCurrent')}</span>}
                {done && <span className="sr-only"> — {t('wizard.stepStatusDone')}</span>}
              </span>
              {!isLast && (
                <span
                  className={`mx-2 h-px flex-1 ${done ? 'bg-blue-200' : 'bg-slate-200'}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

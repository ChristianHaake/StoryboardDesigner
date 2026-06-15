import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buttonPrimary, buttonSecondary } from '../../shared/ui/fieldStyles';

// Onboarding-Overlay (#9a): kurzes Schritt-für-Schritt-Intro beim ersten Besuch.
// Natives <dialog> → Fokus-Trap + Escape + Fokus-Restore. Einmal gesehen → Flag
// in localStorage, danach nicht mehr automatisch.
const SEEN_KEY = 'onboardingSeen';
const STEP_COUNT = 3;

export default function OnboardingOverlay() {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Initial aus localStorage ableiten (kein setState im Effekt): einmal gesehen → zu.
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) !== '1';
    } catch {
      // localStorage blockiert → Intro einfach zeigen.
      return true;
    }
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [open]);

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // ignorieren
    }
    dialogRef.current?.close();
    setOpen(false);
  }

  if (!open) return null;

  const isLast = step === STEP_COUNT - 1;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="onboarding-title"
      className="m-auto w-[min(92vw,460px)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <div className="p-6">
        <p className="text-xs font-bold tracking-[0.16em] text-blue-700 uppercase">
          {t('onboarding.kicker')}
        </p>
        <h2 id="onboarding-title" className="mt-2 text-lg font-bold tracking-tight">
          {t(`onboarding.step${step + 1}Title`)}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t(`onboarding.step${step + 1}Body`)}</p>

        <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            {t('onboarding.skip')}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className={`${buttonSecondary} min-h-11`}
              >
                {t('onboarding.back')}
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
              className={`${buttonPrimary} min-h-11`}
            >
              {isLast ? t('onboarding.done') : t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

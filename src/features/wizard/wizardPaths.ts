import type { WizardStep } from '../../app/store/types';

// Jeder Wizard-Schritt hat eine eigene URL, damit der Zurück-Button des Browsers
// einen Schritt zurückgeht und Reload/Lesezeichen den Schritt behalten.
export const PATH_BY_STEP: Record<WizardStep, string> = {
  start: '/',
  setup: '/setup',
  editor: '/editor',
  review: '/review',
  export: '/export',
};

export const WIZARD_PATHS = Object.values(PATH_BY_STEP);

export const STEP_BY_PATH: Partial<Record<string, WizardStep>> = Object.fromEntries(
  Object.entries(PATH_BY_STEP).map(([step, path]) => [path, step as WizardStep]),
);

/**
 * Begrenzt einen Schritt auf das, was der Projektstand erlaubt: ohne Projekt nur
 * der Start, ohne Projektnamen nur bis "Einrichten" (Pflichtfeld).
 */
export function clampStep(
  step: WizardStep,
  project: { hasContent: boolean; projectName: string },
): WizardStep {
  if (step === 'start' || !project.hasContent) return 'start';
  if (step === 'setup' || !project.projectName.trim()) return 'setup';
  return step;
}

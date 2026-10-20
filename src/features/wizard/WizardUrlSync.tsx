import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import type { WizardStep } from '../../app/store/types';
import { PATH_BY_STEP, STEP_BY_PATH, clampStep } from './wizardPaths';

/**
 * Hält Wizard-Schritt (Store) und URL synchron. Der Store bleibt die Quelle für
 * die Bildschirme; hier wird nur gespiegelt:
 * - Schrittwechsel im Store → neuer Verlaufseintrag (Zurück geht einen Schritt zurück)
 * - Einstieg, Reload oder Zurück/Vorwärts im Browser → die URL gewinnt, begrenzt
 *   auf erreichbare Schritte
 * Inhaltsseiten und /play werden nicht angefasst. Vor dem Autosave-Check
 * (isReady) passiert nichts, damit ein Reload auf /editor nicht verfällt.
 */
export default function WizardUrlSync() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ready = useStoryboardStore((s) => s.isReady);
  const activeStep = useStoryboardStore((s) => s.activeStep);
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const seen = useRef<{ pathname: string; step: WizardStep } | null>(null);

  useEffect(() => {
    if (!ready) return;
    const previous = seen.current;
    seen.current = { pathname, step: activeStep };
    const pathStep = STEP_BY_PATH[pathname];
    if (!pathStep) return;

    const stepChanged = previous !== null && previous.step !== activeStep;
    const urlDriven = previous === null || (!stepChanged && previous.pathname !== pathname);
    if (urlDriven) {
      const { hasContent, metaData } = useStoryboardStore.getState();
      const target = clampStep(pathStep, { hasContent, projectName: metaData.projectName });
      if (target !== activeStep) setWizardStep(target, true);
      if (PATH_BY_STEP[target] !== pathname) navigate(PATH_BY_STEP[target], { replace: true });
      return;
    }
    if (PATH_BY_STEP[activeStep] !== pathname) {
      const replace = useStoryboardStore.getState().stepNavigation === 'replace';
      navigate(PATH_BY_STEP[activeStep], { replace });
    }
  }, [ready, pathname, activeStep, navigate, setWizardStep]);

  return null;
}

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
 *
 * Der Router übernimmt Navigationen verzögert (Transition). Eigene Navigationen
 * werden daher in `requested` vermerkt: kommt eine davon verspätet an, obwohl der
 * Store schon weiter ist, wird sie nicht als Nutzeraktion gelesen, sondern auf
 * den aktuellen Schritt zurückgesetzt.
 */
export default function WizardUrlSync() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ready = useStoryboardStore((s) => s.isReady);
  const activeStep = useStoryboardStore((s) => s.activeStep);
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const seen = useRef<{ pathname: string; step: WizardStep } | null>(null);
  const requested = useRef<string[]>([]);

  useEffect(() => {
    if (!ready) return;
    const go = (path: string, replace: boolean) => {
      requested.current.push(path);
      navigate(path, { replace });
    };

    const previous = seen.current;
    seen.current = { pathname, step: activeStep };
    const pathChanged = previous !== null && previous.pathname !== pathname;
    let ownNavigation = false;
    if (pathChanged) {
      const index = requested.current.indexOf(pathname);
      if (index >= 0) {
        requested.current.splice(0, index + 1);
        ownNavigation = true;
      }
    }

    const pathStep = STEP_BY_PATH[pathname];
    if (!pathStep) return;

    const stepChanged = previous !== null && previous.step !== activeStep;
    const urlDriven = previous === null || (pathChanged && !ownNavigation && !stepChanged);
    if (urlDriven) {
      const { hasContent, metaData } = useStoryboardStore.getState();
      const target = clampStep(pathStep, { hasContent, projectName: metaData.projectName });
      if (target !== activeStep) setWizardStep(target, true);
      if (PATH_BY_STEP[target] !== pathname) go(PATH_BY_STEP[target], true);
      return;
    }
    if (PATH_BY_STEP[activeStep] !== pathname) {
      const replace = ownNavigation || useStoryboardStore.getState().stepNavigation === 'replace';
      go(PATH_BY_STEP[activeStep], replace);
    }
  }, [ready, pathname, activeStep, navigate, setWizardStep]);

  return null;
}

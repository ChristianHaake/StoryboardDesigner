import { Suspense, lazy, useLayoutEffect, useRef } from 'react';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import LoadingStatus from '../../shared/ui/LoadingStatus';
import StartScreen from './StartScreen';
import SetupScreen from './SetupScreen';

const EditorView = lazy(() => import('../editor/EditorView'));
const ReviewScreen = lazy(() => import('./ReviewScreen'));
const ExportScreen = lazy(() => import('./ExportScreen'));

export default function WizardRouter() {
  const activeStep = useStoryboardStore((state) => state.activeStep);
  const mainRef = useRef<HTMLElement>(null);
  const previousStepRef = useRef(activeStep);
  const focusedHeadingRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (previousStepRef.current === activeStep) {
      focusedHeadingRef.current = mainRef.current?.querySelector<HTMLElement>('h1') ?? null;
      return;
    }
    previousStepRef.current = activeStep;

    const focusHeading = () => {
      const heading = mainRef.current?.querySelector<HTMLElement>('h1');
      // Suspense kann den ausgehenden Schritt kurz stehen lassen. Diesen alten
      // Titel nicht erneut fokussieren, sondern auf den neuen Chunk warten.
      if (!heading || heading === focusedHeadingRef.current) return false;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: false });
      focusedHeadingRef.current = heading;
      return true;
    };

    if (focusHeading()) return;

    const observer = new MutationObserver(() => {
      if (focusHeading()) observer.disconnect();
    });
    if (mainRef.current) observer.observe(mainRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [activeStep]);

  return (
    <main ref={mainRef} className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {activeStep === 'start' && <StartScreen />}
      {activeStep === 'setup' && <SetupScreen />}
      <Suspense fallback={<LoadingStatus />}>
        {activeStep === 'editor' && <EditorView />}
        {activeStep === 'review' && <ReviewScreen />}
        {activeStep === 'export' && <ExportScreen />}
      </Suspense>
    </main>
  );
}

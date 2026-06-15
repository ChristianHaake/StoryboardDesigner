import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import StartScreen from './StartScreen';
import SetupScreen from './SetupScreen';
import EditorView from '../editor/EditorView';
import ReviewScreen from './ReviewScreen';
import ExportScreen from './ExportScreen';

export default function WizardRouter() {
  const activeStep = useStoryboardStore((state) => state.activeStep);

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {activeStep === 'start' && <StartScreen />}
      {activeStep === 'setup' && <SetupScreen />}
      {activeStep === 'editor' && <EditorView />}
      {activeStep === 'review' && <ReviewScreen />}
      {activeStep === 'export' && <ExportScreen />}
    </main>
  );
}

import { useEffect } from 'react';
import TopBar from './components/layout/TopBar';
import UndoSnackbar from './components/layout/UndoSnackbar';
import EditorView from './views/EditorView';
import { useStoryboardStore, selectProject } from './store/useStoryboardStore';
import { hasPendingAutosave, loadAutosave, scheduleAutosave } from './utils/persistence';

export default function App() {
  useEffect(() => {
    let cancelled = false;

    // Autosave nur wiederherstellen, solange noch nichts eingegeben wurde —
    // sonst würde frische Eingabe vom asynchron geladenen Stand überschrieben.
    void loadAutosave().then((project) => {
      if (cancelled || !project) return;
      const state = useStoryboardStore.getState();
      if (!state.touched) state.loadProject(project);
    });

    const unsubscribe = useStoryboardStore.subscribe((state) => {
      scheduleAutosave(selectProject(state));
    });

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasPendingAutosave()) event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white">
      <TopBar />
      <EditorView />
      <UndoSnackbar />
    </div>
  );
}

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from './components/layout/TopBar';
import Footer from './components/layout/Footer';
import Notifications from './components/layout/Notifications';
import EditorView from './views/EditorView';

// Lazy: react-markdown bleibt aus dem Editor-Bundle (Hilfe-Seiten selten besucht).
const MarkdownView = lazy(() => import('./views/MarkdownView'));
import { useStoryboardStore, selectProject } from './store/useStoryboardStore';
import { hasPendingAutosave, loadAutosave, scheduleAutosave } from './utils/persistence';
import hilfeDe from './content/hilfe.md?raw';
import hilfeEn from './content/hilfe.en.md?raw';
import datenschutzText from './content/datenschutz.md?raw';
import impressumText from './content/impressum.md?raw';

export default function App() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const hilfeText = language === 'en' ? hilfeEn : hilfeDe;

  // Dokument-Sprache und Titel an die UI-Sprache koppeln.
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('common.appTitle');
  }, [language, t]);

  useEffect(() => {
    let cancelled = false;

    // Autosave nur wiederherstellen, solange noch nichts eingegeben wurde —
    // sonst würde frische Eingabe vom asynchron geladenen Stand überschrieben.
    void loadAutosave().then((payload) => {
      if (cancelled || !payload) return;
      const state = useStoryboardStore.getState();
      if (!state.touched) state.loadProject(payload.project, payload.images);
    });

    const unsubscribe = useStoryboardStore.subscribe((state) => {
      scheduleAutosave({ project: selectProject(state), images: state.images });
    });

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasPendingAutosave()) {
        event.preventDefault();
        // Ältere Chrome/Edge auf Schulgeräten zeigen den Dialog nur mit returnValue.
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-gray-200 text-gray-900 print:bg-white">
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <TopBar />
                  <EditorView />
                  <Notifications />
                </>
              }
            />
            <Route path="/hilfe" element={<MarkdownView source={hilfeText} />} />
            <Route
              path="/datenschutz"
              element={<MarkdownView source={datenschutzText} germanOnly />}
            />
            <Route
              path="/impressum"
              element={<MarkdownView source={impressumText} germanOnly />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

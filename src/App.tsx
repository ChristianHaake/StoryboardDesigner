import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from './components/layout/TopBar';
import Footer from './components/layout/Footer';
import Notifications from './components/layout/Notifications';
import HeroIntro from './components/layout/HeroIntro';
import FormatTabs from './components/layout/FormatTabs';
import OnboardingOverlay from './components/layout/OnboardingOverlay';
import EditorView from './views/EditorView';

// Lazy: react-markdown bleibt aus dem Editor-Bundle (Hilfe-Seiten selten besucht).
const MarkdownView = lazy(() => import('./views/MarkdownView'));
import { useStoryboardStore, selectProject } from './store/useStoryboardStore';
import {
  hasPendingAutosave,
  loadAutosave,
  scheduleAutosave,
  setAutosaveStatusListener,
} from './utils/persistence';
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

    // Speicherhinweis aus dem Autosave-Lifecycle speisen (#6a).
    setAutosaveStatusListener((status) => {
      useStoryboardStore.getState().setSaveStatus(status);
    });

    // Nur bei echten Inhaltsänderungen speichern. Reine UI-State-Updates
    // (saveStatus, feedbackMode, Notifications) dürfen keinen Autosave auslösen —
    // sonst entsteht über setSaveStatus eine Endlosschleife.
    const unsubscribe = useStoryboardStore.subscribe((state, prev) => {
      if (
        state.metaData === prev.metaData &&
        state.prePlanning === prev.prePlanning &&
        state.fieldDefinitions === prev.fieldDefinitions &&
        state.scenes === prev.scenes &&
        state.images === prev.images
      ) {
        return;
      }
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
      setAutosaveStatusListener(null);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 print:bg-white">
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <TopBar />
                  <HeroIntro />
                  <FormatTabs />
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
        <OnboardingOverlay />
      </div>
    </BrowserRouter>
  );
}

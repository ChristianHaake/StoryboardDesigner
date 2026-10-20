import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';
import TopBar from './layout/TopBar';
import Footer from './layout/Footer';
import Notifications from './layout/Notifications';
import WizardRouter from '../features/wizard/WizardRouter';
import LoadingStatus from '../shared/ui/LoadingStatus';

// Lazy: react-markdown bleibt aus dem Editor-Bundle (Hilfe-Seiten selten besucht).
const MarkdownView = lazy(() => import('../features/markdown/MarkdownView'));
const PresentationView = lazy(() => import('../features/presentation/PresentationView'));
import { useStoryboardStore, selectProject } from './store/useStoryboardStore';
import {
  hasPendingAutosave,
  loadAutosave,
  scheduleAutosave,
  setAutosaveStatusListener,
} from '../shared/utils/persistence';
import {
  recordChange,
  redo as historyRedo,
  resetHistory,
  setHistoryHooks,
  undo as historyUndo,
  type ContentSnapshot,
} from '../domain/history';
import type { ContentLanguage } from '../features/markdown/MarkdownView';
import hilfeDe from '../content/hilfe.md?raw';
import hilfeEn from '../content/hilfe.en.md?raw';
import lehrkraefteDe from '../content/lehrkraefte.md?raw';
import lehrkraefteEn from '../content/lehrkraefte.en.md?raw';
import ueberDe from '../content/ueber.md?raw';
import ueberEn from '../content/ueber.en.md?raw';
import datenschutzText from '../content/datenschutz.md?raw';
import impressumText from '../content/impressum.md?raw';

// Titel-Keys: Route hat Vorrang, auf "/" bestimmt der Wizard-Schritt den Titel.
const ROUTE_TITLE_KEYS: Partial<Record<string, ParseKeys>> = {
  '/play': 'topbar.present',
  '/hilfe': 'footer.help',
  '/lehrkraefte': 'brand.forEducators',
  '/ueber': 'footer.about',
  '/datenschutz': 'footer.privacy',
  '/impressum': 'footer.imprint',
};
const STEP_TITLE_KEYS = {
  start: 'wizard.stepFormat',
  setup: 'wizard.stepSetup',
  editor: 'wizard.stepEditor',
  review: 'wizard.stepReview',
  export: 'wizard.stepExport',
} as const;

export default function App() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  // Inhaltsseiten gibt es nur auf Deutsch und Englisch; es/fr sehen Englisch.
  const contentLanguage: ContentLanguage = language === 'de' ? 'de' : 'en';
  const hilfeText = contentLanguage === 'en' ? hilfeEn : hilfeDe;
  const lehrkraefteText = contentLanguage === 'en' ? lehrkraefteEn : lehrkraefteDe;
  const ueberText = contentLanguage === 'en' ? ueberEn : ueberDe;

  // Dokument-Sprache an die UI-Sprache koppeln (Seitentitel: AppShell, pro Route).
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    // Undo/Redo-Verdrahtung (#6b): aktuellen Inhalt liefern, Schnappschuss
    // zurückspielen, Verfügbarkeits-Flags in den Store schreiben.
    const toSnapshot = (
      state: ReturnType<typeof useStoryboardStore.getState>,
    ): ContentSnapshot => ({
      metaData: state.metaData,
      prePlanning: state.prePlanning,
      fieldDefinitions: state.fieldDefinitions,
      scenes: state.scenes,
      images: state.images,
    });
    setHistoryHooks({
      getCurrent: () => toSnapshot(useStoryboardStore.getState()),
      restore: (snapshot) => useStoryboardStore.getState().restoreContent(snapshot),
      onFlags: (canUndo, canRedo) =>
        useStoryboardStore.getState().setHistoryFlags(canUndo, canRedo),
    });

    const initialMetaData = useStoryboardStore.getState().metaData;
    // Autosave nur wiederherstellen, solange noch nichts eingegeben wurde —
    // sonst würde frische Eingabe vom asynchron geladenen Stand überschrieben.
    void loadAutosave().then((payload) => {
      if (cancelled) return;
      const state = useStoryboardStore.getState();
      // Wenn die MetaData-Referenz sich geändert hat (z.B. durch resetProject),
      // hat der Nutzer bereits interagiert → Autosave verwerfen.
      if (payload && !state.touched && state.metaData === initialMetaData) {
        state.loadProject(payload.project, payload.images);
      }
      // History-Stack nach dem initialen Laden leeren — der Restore selbst soll
      // nicht rückgängig gemacht werden.
      resetHistory();
    });

    // Speicherhinweis aus dem Autosave-Lifecycle speisen (#6a).
    setAutosaveStatusListener((status) => {
      useStoryboardStore.getState().setSaveStatus(status);
    });

    // Nur bei echten Inhaltsänderungen speichern. Reine UI-State-Updates
    // (saveStatus, feedbackMode, Notifications) dürfen keinen Autosave auslösen —
    // sonst entsteht über setSaveStatus eine Endlosschleife.
    const unsubscribe = useStoryboardStore.subscribe((state, prev) => {
      const contentChanged =
        state.metaData !== prev.metaData ||
        state.prePlanning !== prev.prePlanning ||
        state.fieldDefinitions !== prev.fieldDefinitions ||
        state.scenes !== prev.scenes ||
        state.images !== prev.images;
      if (!contentChanged) return;

      recordChange(toSnapshot(prev), toSnapshot(state));
      scheduleAutosave({ project: selectProject(state), images: state.images });
    });

    // Tastatur: Cmd/Ctrl+Z = Undo, Cmd/Ctrl+Shift+Z oder Ctrl+Y = Redo.
    // Beim Editieren von Textfeldern dem nativen Text-Undo den Vortritt lassen.
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const el = document.activeElement;
      const editing =
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          (el as HTMLElement).isContentEditable);
      if (editing) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        historyUndo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        historyRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);

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
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return (
    <BrowserRouter>
      <AppShell
        contentLanguage={contentLanguage}
        hilfeText={hilfeText}
        lehrkraefteText={lehrkraefteText}
        ueberText={ueberText}
        datenschutzText={datenschutzText}
        impressumText={impressumText}
      />
    </BrowserRouter>
  );
}

function AppShell({
  contentLanguage,
  hilfeText,
  lehrkraefteText,
  ueberText,
  datenschutzText,
  impressumText,
}: {
  contentLanguage: ContentLanguage;
  hilfeText: string;
  lehrkraefteText: string;
  ueberText: string;
  datenschutzText: string;
  impressumText: string;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const activeStep = useStoryboardStore((s) => s.activeStep);
  const hideFooter = location.pathname === '/play';

  // Eindeutiger Seitentitel pro Route bzw. Wizard-Schritt (WCAG 2.4.2).
  const pageKey = ROUTE_TITLE_KEYS[location.pathname] ?? STEP_TITLE_KEYS[activeStep];
  const pageTitle = t(pageKey);
  const appTitle = t('common.appTitle');
  useEffect(() => {
    document.title = `${pageTitle} – ${appTitle}`;
  }, [pageTitle, appTitle]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 print:bg-white">
      <Suspense fallback={<LoadingStatus className="flex-1" />}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <TopBar />
                <WizardRouter />
                <Notifications />
              </>
            }
          />
          <Route path="/play" element={<PresentationView />} />
          <Route
            path="/hilfe"
            element={<MarkdownView source={hilfeText} contentLanguage={contentLanguage} />}
          />
          <Route
            path="/lehrkraefte"
            element={<MarkdownView source={lehrkraefteText} contentLanguage={contentLanguage} />}
          />
          <Route
            path="/ueber"
            element={<MarkdownView source={ueberText} contentLanguage={contentLanguage} />}
          />
          <Route
            path="/datenschutz"
            element={<MarkdownView source={datenschutzText} contentLanguage="de" />}
          />
          <Route
            path="/impressum"
            element={<MarkdownView source={impressumText} contentLanguage="de" />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {!hideFooter && <Footer />}
    </div>
  );
}

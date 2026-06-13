import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { selectProject, useStoryboardStore } from '../../store/useStoryboardStore';
import { exportProject, importProject, ImportError } from '../../utils/zipHandler';
import { clearAutosave } from '../../utils/persistence';
import { exportElementToPdf } from '../../utils/pdfExport';
import LanguageToggle from './LanguageToggle';
import DisplaySettings from './DisplaySettings';
import BrandLogo from './BrandLogo';
import StatusPill from './StatusPill';
import SaveIndicator from './SaveIndicator';
import { buttonPrimary, buttonSecondary } from '../forms/fieldStyles';

export default function TopBar() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Beim Scrollen die Marken-Zeile einklappen, damit auf Tablets mehr
  // Dokument sichtbar bleibt. focus-within klappt sie für Tastatur wieder auf.
  const [collapsed, setCollapsed] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const feedbackMode = useStoryboardStore((s) => s.feedbackMode);
  const toggleFeedbackMode = useStoryboardStore((s) => s.toggleFeedbackMode);

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleExport() {
    const state = useStoryboardStore.getState();
    try {
      await exportProject(selectProject(state), state.images);
    } catch (err: unknown) {
      console.warn('Export fehlgeschlagen:', err);
      state.setErrorMessage(t('topbar.exportFailed'));
    }
  }

  async function handlePdf() {
    const state = useStoryboardStore.getState();
    const element = document.getElementById('storyboard-document');
    if (!element) return;
    const rawName = state.metaData.projectName.trim() || t('topbar.pdfFallbackName');
    // Unzulässige Dateinamen-Zeichen ersetzen, damit der Download-Name nicht bricht.
    const name = rawName.replace(/[/\\:*?"<>|]/g, '_');
    setPdfBusy(true);
    try {
      await exportElementToPdf(element, `${name}.pdf`, 'article');
      state.clearErrorMessage();
    } catch (err: unknown) {
      console.warn('PDF-Export fehlgeschlagen:', err);
      state.setErrorMessage(t('topbar.pdfFailed'));
    } finally {
      setPdfBusy(false);
    }
  }

  function handleReset() {
    // Irreversibel: aktuelles Projekt UND Autosave löschen. Daher Bestätigung.
    if (!window.confirm(t('topbar.confirmReset'))) return;
    useStoryboardStore.getState().resetProject();
    void clearAutosave();
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const state = useStoryboardStore.getState();
    if (state.hasContent && !window.confirm(t('topbar.confirmReplace'))) {
      return;
    }
    try {
      const { project, images } = await importProject(file);
      useStoryboardStore.getState().loadProject(project, images, true);
      state.clearErrorMessage();
    } catch (err: unknown) {
      state.setErrorMessage(err instanceof ImportError ? err.message : t('topbar.importFailed'));
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur print:hidden">
      {/* Reihe 1: Marke + Status/Sprache/Lehrkräfte — klappt beim Scrollen ein */}
      <div
        className={`mx-auto flex max-w-screen-lg items-center justify-between gap-4 overflow-hidden px-4 transition-all duration-200 focus-within:max-h-24 focus-within:py-2.5 focus-within:opacity-100 ${
          collapsed ? 'max-h-0 py-0 opacity-0' : 'max-h-24 py-2.5 opacity-100'
        }`}
      >
        <BrandLogo />
        <div className="flex items-center gap-2 sm:gap-3">
          <SaveIndicator />
          <StatusPill label={t('brand.localPill')} className="max-sm:hidden" />
          <Link
            to="/hilfe"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 max-[420px]:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 9l9-5 9 5-9 5-9-5Z" />
              <path d="M7 11v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4" />
            </svg>
            <span className="max-sm:hidden">{t('brand.forEducators')}</span>
          </Link>
          <button
            type="button"
            onClick={toggleFeedbackMode}
            aria-pressed={feedbackMode}
            title={t('feedback.toggle')}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition-colors ${
              feedbackMode
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="max-sm:hidden">{t('feedback.toggle')}</span>
          </button>
          <DisplaySettings />
          <LanguageToggle />
        </div>
      </div>
      {/* Reihe 2: globale Aktionen */}
      <div className="border-t border-slate-100 bg-slate-50/60">
        <nav
          aria-label={t('topbar.actions')}
          className="mx-auto flex max-w-screen-lg items-center gap-2 px-4 py-2 max-sm:grid max-sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${buttonSecondary} min-h-11`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="max-[430px]:text-xs">{t('topbar.load')}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className={`${buttonSecondary} min-h-11`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 21V9m0 0 4 4m-4-4-4 4" />
              <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="max-[430px]:text-xs">{t('topbar.save')}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={`${buttonSecondary} min-h-11`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M7 8V3h10v5" />
              <path d="M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M7 14h10v7H7z" />
            </svg>
            <span className="max-[430px]:text-xs">{t('topbar.print')}</span>
          </button>
          <button
            type="button"
            onClick={handlePdf}
            disabled={pdfBusy}
            aria-busy={pdfBusy}
            className={`${buttonPrimary} min-h-11`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path d="M14 3v6h6" />
            </svg>
            <span className="max-[430px]:text-xs">
              {pdfBusy ? t('topbar.pdfBusy') : t('topbar.pdf')}
            </span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            title={t('topbar.reset')}
            className={`${buttonSecondary} min-h-11 hover:border-red-300 hover:bg-red-50 hover:text-red-700`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
            </svg>
            <span className="max-[430px]:text-xs">{t('topbar.reset')}</span>
          </button>
        </nav>
        <input
          ref={fileInputRef}
          type="file"
          accept=".storyboard,.zip"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </header>
  );
}

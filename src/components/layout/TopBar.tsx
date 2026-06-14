import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { selectProject, useStoryboardStore } from '../../store/useStoryboardStore';
import { exportProject, importProject, ImportError } from '../../utils/zipHandler';
import { clearAutosave } from '../../utils/persistence';
import { redo as historyRedo, undo as historyUndo } from '../../utils/history';
import { exportElementToPdf } from '../../utils/pdfExport';
import LanguageToggle from './LanguageToggle';
import DisplaySettings from './DisplaySettings';
import BrandLogo from './BrandLogo';
import StatusPill from './StatusPill';
import SaveIndicator from './SaveIndicator';
import { buttonPrimary, buttonSecondary } from '../forms/fieldStyles';

import { SharedTopBar } from '@haak3/ui';

export default function TopBar() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const feedbackMode = useStoryboardStore((s) => s.feedbackMode);
  const toggleFeedbackMode = useStoryboardStore((s) => s.toggleFeedbackMode);
  const canUndo = useStoryboardStore((s) => s.canUndo);
  const canRedo = useStoryboardStore((s) => s.canRedo);

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
    <>
      <SharedTopBar
        brandArea={<BrandLogo />}
        controlsArea={
          <>
            <SaveIndicator />
            <StatusPill label={t('brand.localPill')} className="max-sm:hidden" />
            <Link
              to="/hilfe"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 max-[420px]:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 9l9-5 9 5-9-5-9-5Z" />
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
          </>
        }
        actionsAriaLabel={t('topbar.actions')}
        actionsArea={
          <>
            <div className="flex gap-2 max-sm:col-span-2">
              <button
                type="button"
                onClick={historyUndo}
                disabled={!canUndo}
                aria-label={t('topbar.undo')}
                title={t('topbar.undo')}
                className={`${buttonSecondary} min-h-11 flex-1`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M9 14 4 9l5-5" />
                  <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
                </svg>
                <span className="max-[430px]:text-xs">{t('topbar.undo')}</span>
              </button>
              <button
                type="button"
                onClick={historyRedo}
                disabled={!canRedo}
                aria-label={t('topbar.redo')}
                title={t('topbar.redo')}
                className={`${buttonSecondary} min-h-11 flex-1`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m15 14 5-5-5-5" />
                  <path d="M20 9H9a5 5 0 0 0 0 10h1" />
                </svg>
                <span className="max-[430px]:text-xs">{t('topbar.redo')}</span>
              </button>
            </div>
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
          </>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".storyboard,.zip"
        className="hidden"
        onChange={handleImportFile}
      />
    </>
  );
}

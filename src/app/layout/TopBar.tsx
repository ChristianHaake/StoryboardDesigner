import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { selectProject, useStoryboardStore } from '../store/useStoryboardStore';
import { clearAutosave } from '../../shared/utils/persistence';
import { redo as historyRedo, undo as historyUndo } from '../../domain/history';
import { exportElementToPdf } from '../../shared/utils/pdfExport';
import BrandLogo from './BrandLogo';
import SaveIndicator from './SaveIndicator';
import { buttonPrimary, buttonSecondary } from '../../shared/ui/fieldStyles';
import {
  MessageSquare,
  Undo,
  Redo,
  Upload,
  Download,
  Printer,
  FileText,
  Trash2,
  Folder,
  Play,
} from 'lucide-react';

import { SharedTopBar } from '@haak3/ui';

export default function TopBar() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMenuRef = useRef<HTMLDetailsElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const feedbackMode = useStoryboardStore((s) => s.feedbackMode);
  const toggleFeedbackMode = useStoryboardStore((s) => s.toggleFeedbackMode);
  const canUndo = useStoryboardStore((s) => s.canUndo);
  const canRedo = useStoryboardStore((s) => s.canRedo);
  const activeStep = useStoryboardStore((s) => s.activeStep);
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const showDocumentActions =
    activeStep === 'editor' || activeStep === 'review' || activeStep === 'export';

  const [saveBusy, setSaveBusy] = useState(false);

  async function handleExport() {
    if (saveBusy) return;
    const state = useStoryboardStore.getState();
    setSaveBusy(true);
    try {
      const { exportProject } = await import('../../shared/utils/zipHandler');
      await exportProject(selectProject(state), state.images);
      state.setSuccessMessage(t('topbar.saveSuccess'));
      state.clearErrorMessage();
    } catch (err: unknown) {
      console.warn('Export fehlgeschlagen:', err);
      state.setErrorMessage(t('topbar.exportFailed'));
    } finally {
      setSaveBusy(false);
    }
  }

  async function handlePdf() {
    if (pdfBusy) return;
    const state = useStoryboardStore.getState();
    let element = document.getElementById('storyboard-document');
    if (!element) {
      setWizardStep('editor');
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      element = document.getElementById('storyboard-document');
    }
    if (!element) {
      state.setErrorMessage(t('topbar.documentMissing'));
      return;
    }
    const rawName = state.metaData.projectName.trim() || t('topbar.pdfFallbackName');
    // Unzulässige Dateinamen-Zeichen ersetzen, damit der Download-Name nicht bricht.
    const name = rawName.replace(/[/\\:*?"<>|]/g, '_');
    setPdfBusy(true);
    try {
      await exportElementToPdf(element, `${name}.pdf`, 'article');
      state.setSuccessMessage(t('topbar.pdfSuccess'));
      state.clearErrorMessage();
    } catch (err: unknown) {
      console.warn('PDF-Export fehlgeschlagen:', err);
      state.setErrorMessage(t('topbar.pdfFailed'));
    } finally {
      setPdfBusy(false);
    }
  }

  async function handlePrint() {
    if (!document.getElementById('storyboard-document')) {
      setWizardStep('editor');
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    }
    window.print();
  }

  function handleReset() {
    const state = useStoryboardStore.getState();
    // Irreversibel: aktuelles Projekt UND Autosave löschen. Daher Bestätigung.
    if (state.hasContent && !window.confirm(t('topbar.confirmReset'))) return;
    state.resetProject();
    void clearAutosave();
    state.setSuccessMessage(t('topbar.resetSuccess'));
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const state = useStoryboardStore.getState();
    if (state.hasContent && !window.confirm(t('topbar.confirmReplace'))) {
      return;
    }
    const zipHandler = await import('../../shared/utils/zipHandler');
    try {
      const { project, images } = await zipHandler.importProject(file);
      useStoryboardStore.getState().loadProject(project, images, true);
      useStoryboardStore.getState().setSuccessMessage(t('topbar.loadSuccess'));
      state.clearErrorMessage();
    } catch (err: unknown) {
      state.setErrorMessage(
        err instanceof zipHandler.ImportError ? err.message : t('topbar.importFailed'),
      );
    }
  }

  return (
    <>
      <SharedTopBar
        brandArea={<BrandLogo />}
        controlsArea={
          <>
            <SaveIndicator />
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
              <MessageSquare className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="max-lg:hidden">{t('feedback.toggle')}</span>
            </button>
          </>
        }
        actionsAriaLabel={t('topbar.actions')}
        actionsArea={
          <div className="flex w-full items-center gap-2 max-sm:col-span-2">
            {/* File Menu */}
            <details
              ref={fileMenuRef}
              className="relative group [&>summary::-webkit-details-marker]:hidden"
            >
              <summary
                aria-label={t('topbar.file')}
                title={t('topbar.file')}
                className={`${buttonSecondary} min-h-11 cursor-pointer list-none select-none`}
              >
                <Folder className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                <span className="max-sm:hidden">{t('topbar.file')}</span>
              </summary>
              {/* Overlay to close details when clicking outside */}
              <div
                className="fixed inset-0 z-40 hidden cursor-default group-open:block"
                onClick={() => {
                  if (fileMenuRef.current) fileMenuRef.current.open = false;
                }}
                aria-hidden="true"
              />
              <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                <button
                  type="button"
                  onClick={() => {
                    if (fileMenuRef.current) fileMenuRef.current.open = false;
                    fileInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <Upload className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  {t('topbar.load')}
                </button>
                <button
                  type="button"
                  disabled={saveBusy}
                  aria-busy={saveBusy}
                  onClick={() => {
                    if (fileMenuRef.current) fileMenuRef.current.open = false;
                    void handleExport();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  {t('topbar.save')}
                </button>
                <div className="my-1.5 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    if (fileMenuRef.current) fileMenuRef.current.open = false;
                    handleReset();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  {t('topbar.reset')}
                </button>
              </div>
            </details>

            {showDocumentActions ? (
              <>
                {/* History Controls */}
                <div className="flex gap-2 mr-auto">
                  <button
                    type="button"
                    onClick={historyUndo}
                    disabled={!canUndo}
                    aria-label={t('topbar.undo')}
                    title={t('topbar.undo')}
                    className={`${buttonSecondary} min-h-11 px-3`}
                  >
                    <Undo className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={historyRedo}
                    disabled={!canRedo}
                    aria-label={t('topbar.redo')}
                    title={t('topbar.redo')}
                    className={`${buttonSecondary} min-h-11 px-3`}
                  >
                    <Redo className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>

                {/* Export / Print */}
                <div className="flex gap-2">
                  <Link
                    to="/play"
                    className={`${buttonSecondary} min-h-11 flex items-center justify-center max-sm:px-3`}
                    title={t('topbar.present')}
                  >
                    <Play className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                    <span className="max-sm:hidden">{t('topbar.present')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className={`${buttonSecondary} min-h-11 max-sm:px-3`}
                    title={t('topbar.print')}
                  >
                    <Printer className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                    <span className="max-sm:hidden">{t('topbar.print')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePdf}
                    disabled={pdfBusy}
                    aria-busy={pdfBusy}
                    className={`${buttonPrimary} min-h-11 max-sm:px-3`}
                    title={t('topbar.pdf')}
                  >
                    <FileText className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                    <span className="max-sm:hidden">
                      {pdfBusy ? t('topbar.pdfBusy') : t('topbar.pdf')}
                    </span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
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

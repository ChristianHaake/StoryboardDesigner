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
import { GraduationCap, MessageSquare, Undo, Redo, Upload, Download, Printer, FileText, Trash2 } from 'lucide-react';

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
              <GraduationCap className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
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
              <MessageSquare className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
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
                <Undo className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
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
                <Redo className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                <span className="max-[430px]:text-xs">{t('topbar.redo')}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${buttonSecondary} min-h-11`}
            >
              <Upload className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="max-[430px]:text-xs">{t('topbar.load')}</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className={`${buttonSecondary} min-h-11`}
            >
              <Download className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="max-[430px]:text-xs">{t('topbar.save')}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className={`${buttonSecondary} min-h-11`}
            >
              <Printer className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="max-[430px]:text-xs">{t('topbar.print')}</span>
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={pdfBusy}
              aria-busy={pdfBusy}
              className={`${buttonPrimary} min-h-11`}
            >
              <FileText className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
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
              <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
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

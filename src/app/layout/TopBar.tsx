import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStoryboardStore } from '../store/useStoryboardStore';
import { clearAutosave } from '../../shared/utils/persistence';
import { redo as historyRedo, undo as historyUndo } from '../../domain/history';
import FileMenu from './FileMenu';
import { confirmAction } from '../../shared/ui/confirm';
import { useDocumentActions } from '../../shared/hooks/useDocumentActions';
import BrandLogo from './BrandLogo';
import SaveIndicator from './SaveIndicator';
import StatusPill from './StatusPill';
import LanguageToggle from './LanguageToggle';
import { buttonPrimary, buttonSecondary } from '../../shared/ui/fieldStyles';
import { MessageSquare, Undo, Redo, Printer, FileText, Play, GraduationCap } from 'lucide-react';

import { SharedTopBar } from '@haak3/ui';

export default function TopBar() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackMode = useStoryboardStore((s) => s.feedbackMode);
  const toggleFeedbackMode = useStoryboardStore((s) => s.toggleFeedbackMode);
  const canUndo = useStoryboardStore((s) => s.canUndo);
  const canRedo = useStoryboardStore((s) => s.canRedo);
  const activeStep = useStoryboardStore((s) => s.activeStep);
  const hasScenes = useStoryboardStore((s) => s.scenes.length > 0);
  const showDocumentActions =
    activeStep === 'editor' || activeStep === 'review' || activeStep === 'export';

  const { saveBusy, pdfBusy, saveProject, exportPdf, print } = useDocumentActions();

  async function handleReset() {
    const state = useStoryboardStore.getState();
    // Irreversibel: aktuelles Projekt UND Autosave löschen. Daher Bestätigung.
    if (state.hasContent && !(await confirmAction(t('topbar.confirmReset'), t('topbar.reset')))) {
      return;
    }
    state.resetProject();
    void clearAutosave();
    state.setSuccessMessage(t('topbar.resetSuccess'));
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const state = useStoryboardStore.getState();
    if (
      state.hasContent &&
      !(await confirmAction(t('topbar.confirmReplace'), t('confirm.replace')))
    ) {
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
            <StatusPill label={t('brand.localPill')} className="max-md:hidden" />
            <LanguageToggle />
            <Link
              to="/lehrkraefte"
              aria-label={t('brand.forEducators')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-600 transition-[color,background-color,transform] motion-safe:active:scale-[0.96] hover:bg-slate-100 hover:text-slate-900"
            >
              <GraduationCap className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="max-lg:hidden">{t('brand.forEducators')}</span>
            </Link>
            <button
              type="button"
              onClick={toggleFeedbackMode}
              aria-pressed={feedbackMode}
              title={t('feedback.toggle')}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition-[color,background-color,transform] motion-safe:active:scale-[0.96] ${
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
          <div className="flex min-w-0 w-full flex-wrap items-center gap-2">
            <span id="document-actions-require-scene" className="sr-only">
              {t('topbar.needScenes')}
            </span>
            <FileMenu
              onLoad={() => fileInputRef.current?.click()}
              onSave={() => void saveProject()}
              onReset={() => void handleReset()}
              saveBusy={saveBusy}
            />

            {showDocumentActions ? (
              <>
                {/* History Controls */}
                <div className="mr-auto flex gap-2">
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

                {/* Export / Print: im Export-Schritt stehen dieselben Aktionen als Karten bereit. */}
                {activeStep !== 'export' && (
                  <div className="flex flex-wrap gap-2">
                    {hasScenes ? (
                      <Link
                        to="/play"
                        aria-label={t('topbar.present')}
                        className={`${buttonSecondary} min-h-11 flex items-center justify-center max-sm:px-3`}
                        title={t('topbar.present')}
                      >
                        <Play className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                        <span className="max-sm:hidden">{t('topbar.present')}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        aria-label={t('topbar.present')}
                        aria-describedby="document-actions-require-scene"
                        title={t('topbar.needScenes')}
                        className={`${buttonSecondary} min-h-11 flex cursor-not-allowed items-center justify-center opacity-50 max-sm:px-3`}
                      >
                        <Play className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                        <span className="max-sm:hidden">{t('topbar.present')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={print}
                      disabled={!hasScenes}
                      aria-label={t('topbar.print')}
                      aria-describedby={!hasScenes ? 'document-actions-require-scene' : undefined}
                      className={`${buttonSecondary} min-h-11 max-sm:px-3`}
                      title={hasScenes ? t('topbar.print') : t('topbar.needScenes')}
                    >
                      <Printer className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                      <span className="max-sm:hidden">{t('topbar.print')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportPdf}
                      disabled={pdfBusy || !hasScenes}
                      aria-busy={pdfBusy}
                      aria-label={pdfBusy ? t('topbar.pdfBusy') : t('topbar.pdf')}
                      aria-describedby={!hasScenes ? 'document-actions-require-scene' : undefined}
                      className={`${buttonPrimary} min-h-11 max-sm:px-3`}
                      title={hasScenes ? t('topbar.pdf') : t('topbar.needScenes')}
                    >
                      <FileText
                        className="w-[18px] h-[18px]"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="max-sm:hidden">
                        {pdfBusy ? t('topbar.pdfBusy') : t('topbar.pdf')}
                      </span>
                    </button>
                  </div>
                )}
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

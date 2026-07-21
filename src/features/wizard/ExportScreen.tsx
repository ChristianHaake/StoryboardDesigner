import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStoryboardStore, selectProject } from '../../app/store/useStoryboardStore';
import { ArrowLeft, Download, Printer, FileText, Play, CheckCircle2 } from 'lucide-react';
import { exportElementToPdf } from '../../shared/utils/pdfExport';
import { buttonPrimary, buttonSecondary } from '../../shared/ui/fieldStyles';

export default function ExportScreen() {
  const { t } = useTranslation();
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const [saveBusy, setSaveBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

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

  // PDF und Druck brauchen das gemountete #storyboard-document aus dem Editor.
  // Deshalb kurz in den Editor wechseln und danach zum Export-Schritt zurück,
  // damit Nutzende nicht ohne Rückmeldung im Editor stranden.
  async function handlePdf() {
    if (pdfBusy) return;
    const state = useStoryboardStore.getState();
    setWizardStep('editor');
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const element = document.getElementById('storyboard-document');
    if (!element) {
      state.setErrorMessage(t('topbar.documentMissing'));
      setWizardStep('export');
      return;
    }
    const rawName = state.metaData.projectName.trim() || t('topbar.pdfFallbackName');
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
      setWizardStep('export');
    }
  }

  async function handlePrint() {
    const state = useStoryboardStore.getState();
    setWizardStep('editor');
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    if (!document.getElementById('storyboard-document')) {
      state.setErrorMessage(t('topbar.documentMissing'));
      setWizardStep('export');
      return;
    }
    window.print();
    setWizardStep('export');
  }

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="mb-8">
        <button
          onClick={() => setWizardStep('review')}
          className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('wizard.exportBack')}
        </button>
      </div>

      <div className="mb-10 flex flex-col items-center text-center">
        <div className="inline-flex rounded-full bg-emerald-100 p-4 text-emerald-600 mb-6">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          {t('wizard.exportTitle')}
        </h1>
        <p className="mt-4 text-xl text-slate-500 max-w-lg">{t('wizard.exportSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-4 text-blue-600">
            <Download className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{t('wizard.saveProject')}</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">{t('wizard.saveProjectDesc')}</p>
          <button
            onClick={handleExport}
            disabled={saveBusy}
            className={`${buttonPrimary} w-full py-3`}
          >
            {saveBusy ? t('wizard.saveBusy') : t('wizard.saveProjectFile')}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-purple-50 p-4 text-purple-600">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{t('wizard.exportPdf')}</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">{t('wizard.exportPdfDesc')}</p>
          <button
            onClick={handlePdf}
            disabled={pdfBusy}
            className={`${buttonSecondary} w-full py-3 border-purple-200 hover:bg-purple-50 text-purple-700`}
          >
            {pdfBusy ? t('wizard.exportPdfBusy') : t('wizard.exportPdfFile')}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-slate-50 p-4 text-slate-600">
            <Printer className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{t('wizard.directPrint')}</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">{t('wizard.directPrintDesc')}</p>
          <button onClick={handlePrint} className={`${buttonSecondary} w-full py-3`}>
            {t('topbar.print')}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-amber-50 p-4 text-amber-600">
            <Play className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{t('topbar.present')}</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">{t('wizard.presentationDesc')}</p>
          <Link
            to="/play"
            className={`${buttonSecondary} w-full py-3 flex items-center justify-center border-amber-200 hover:bg-amber-50 text-amber-700`}
          >
            {t('wizard.startPresentation')}
          </Link>
        </div>
      </div>
    </div>
  );
}

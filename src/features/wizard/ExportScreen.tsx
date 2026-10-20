import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Play,
  Printer,
} from 'lucide-react';
import { useDocumentActions } from '../../shared/hooks/useDocumentActions';
import { hasNoEmptyScenes } from '../../domain/sceneStatus';
import { buttonPrimary, buttonSecondary } from '../../shared/ui/fieldStyles';
import WizardSteps from './WizardSteps';

export default function ExportScreen() {
  const { t } = useTranslation();
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const { saveBusy, pdfBusy, saveProject, exportPdf, print } = useDocumentActions();
  const scenes = useStoryboardStore((s) => s.scenes);
  const imageUrls = useStoryboardStore((s) => s.imageUrls);
  const productType = useStoryboardStore((s) => s.metaData.productType);
  const complexity = useStoryboardStore((s) => s.metaData.complexity);
  const fieldDefinitions = useStoryboardStore((s) => s.fieldDefinitions);
  const ready = hasNoEmptyScenes(scenes, imageUrls, { productType, complexity, fieldDefinitions });

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <WizardSteps />
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setWizardStep('review')}
          className="flex min-h-11 items-center rounded-lg px-2 text-sm text-slate-500 transition-[color,background-color,transform] motion-safe:active:scale-[0.96] hover:bg-slate-100 hover:text-blue-600"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('wizard.exportBack')}
        </button>
      </div>

      <div className="mb-10 flex flex-col items-center text-center">
        <div
          className={`mb-6 inline-flex rounded-full p-4 ${
            ready ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {ready ? (
            <CheckCircle2 className="h-12 w-12" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-12 w-12" aria-hidden="true" />
          )}
        </div>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900">
          {ready ? t('wizard.exportTitle') : t('wizard.exportTitleDraft')}
        </h1>
        {!ready && (
          <p role="note" className="mt-3 text-sm font-medium text-amber-700">
            {scenes.length === 0 ? t('wizard.noScenesSummary') : t('wizard.someEmpty')}
          </p>
        )}
        <p className="mt-4 max-w-lg text-pretty text-xl text-slate-500">
          {t('wizard.exportSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-4 text-blue-600">
            <Download className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{t('wizard.saveProject')}</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">{t('wizard.saveProjectDesc')}</p>
          <button
            onClick={saveProject}
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
            onClick={exportPdf}
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
          <button onClick={print} className={`${buttonSecondary} w-full py-3`}>
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

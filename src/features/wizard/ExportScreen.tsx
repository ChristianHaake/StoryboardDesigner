import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStoryboardStore, selectProject } from '../../app/store/useStoryboardStore';
import { ArrowLeft, Download, Printer, FileText, Play, CheckCircle2 } from 'lucide-react';
import { exportProject } from '../../shared/utils/zipHandler';
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
      await exportProject(selectProject(state), state.images);
      state.setSuccessMessage(t('topbar.saveSuccess', 'Projekt gespeichert'));
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
    const element = document.getElementById('storyboard-document');
    if (!element) {
      state.setErrorMessage('Das Dokument konnte nicht für den PDF-Export gefunden werden.');
      return;
    }
    const rawName = state.metaData.projectName.trim() || t('topbar.pdfFallbackName');
    const name = rawName.replace(/[/\\:*?"<>|]/g, '_');
    setPdfBusy(true);
    try {
      await exportElementToPdf(element, `${name}.pdf`, 'article');
      state.setSuccessMessage(t('topbar.pdfSuccess', 'PDF erfolgreich erstellt'));
      state.clearErrorMessage();
    } catch (err: unknown) {
      console.warn('PDF-Export fehlgeschlagen:', err);
      state.setErrorMessage(t('topbar.pdfFailed'));
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="mb-8">
        <button
          onClick={() => setWizardStep('review')}
          className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zur Prüfung
        </button>
      </div>

      <div className="mb-10 flex flex-col items-center text-center">
        <div className="inline-flex rounded-full bg-emerald-100 p-4 text-emerald-600 mb-6">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Dein Storyboard ist fertig!
        </h1>
        <p className="mt-4 text-xl text-slate-500 max-w-lg">
          Schritt 5 von 5 • Exportiere dein Projekt als Projektdatei zur späteren Bearbeitung oder als PDF zum Ausdrucken.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-4 text-blue-600">
            <Download className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Projekt speichern</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Lädt eine .storyboard Datei herunter, die du später wieder importieren und weiterbearbeiten kannst.
          </p>
          <button
            onClick={handleExport}
            disabled={saveBusy}
            className={`${buttonPrimary} w-full py-3`}
          >
            {saveBusy ? 'Speichere...' : 'Als Projektdatei (.storyboard) speichern'}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-purple-50 p-4 text-purple-600">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Als PDF exportieren</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Erstellt eine kompakte PDF-Datei, ideal zum Drucken oder digitalen Teilen.
          </p>
          <button
            onClick={handlePdf}
            disabled={pdfBusy}
            className={`${buttonSecondary} w-full py-3 border-purple-200 hover:bg-purple-50 text-purple-700`}
          >
            {pdfBusy ? 'Erstelle PDF...' : 'Als PDF herunterladen'}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-slate-50 p-4 text-slate-600">
            <Printer className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Direkt drucken</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Öffnet den Druckdialog des Browsers. Optimal formatierte DIN A4 Seiten.
          </p>
          <button
            onClick={() => window.print()}
            className={`${buttonSecondary} w-full py-3`}
          >
            Drucken
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 inline-flex rounded-xl bg-amber-50 p-4 text-amber-600">
            <Play className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Präsentieren</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Starte den Vollbildmodus, um das Storyboard auf einem Beamer zu präsentieren.
          </p>
          <Link
            to="/play"
            className={`${buttonSecondary} w-full py-3 flex items-center justify-center border-amber-200 hover:bg-amber-50 text-amber-700`}
          >
            Präsentation starten
          </Link>
        </div>
      </div>
    </div>
  );
}

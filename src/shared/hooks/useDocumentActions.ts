import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectProject, useStoryboardStore } from '../../app/store/useStoryboardStore';
import { exportElementToPdf } from '../utils/pdfExport';

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

/**
 * Gemeinsame Export-Aktionen für Top-Bar und Export-Schritt: `.storyboard`-Datei,
 * PDF und Druck. PDF und Druck brauchen das gemountete #storyboard-document aus
 * dem Editor. Fehlt es, wird kurz in den Editor gewechselt und danach zum
 * vorherigen Schritt zurück, damit Nutzende nicht ohne Rückmeldung stranden.
 */
export function useDocumentActions() {
  const { t } = useTranslation();
  const [saveBusy, setSaveBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  async function withDocument(run: (element: HTMLElement) => Promise<void> | void) {
    const store = useStoryboardStore.getState();
    const previousStep = store.activeStep;
    let element = document.getElementById('storyboard-document');
    const mustSwitch = !element;
    if (mustSwitch) {
      store.setWizardStep('editor', true);
      await nextFrame();
      await nextFrame();
      element = document.getElementById('storyboard-document');
    }
    try {
      if (!element) {
        store.setErrorMessage(t('topbar.documentMissing'));
        return;
      }
      await run(element);
    } finally {
      if (mustSwitch) useStoryboardStore.getState().setWizardStep(previousStep, true);
    }
  }

  async function saveProject() {
    if (saveBusy) return;
    const state = useStoryboardStore.getState();
    setSaveBusy(true);
    try {
      const { exportProject } = await import('../utils/zipHandler');
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

  async function exportPdf() {
    if (pdfBusy) return;
    await withDocument(async (element) => {
      const state = useStoryboardStore.getState();
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
    });
  }

  async function print() {
    await withDocument(() => window.print());
  }

  return { saveBusy, pdfBusy, saveProject, exportPdf, print };
}

import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { buttonPrimary, buttonSecondary } from '../../shared/ui/fieldStyles';
import { getSceneStatus, hasNoEmptyScenes } from '../../domain/sceneStatus';
import { useTranslation } from 'react-i18next';
import WizardSteps from './WizardSteps';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const scenes = useStoryboardStore((s) => s.scenes);
  const toggleSceneCollapse = useStoryboardStore((s) => s.toggleSceneCollapse);
  const imageUrls = useStoryboardStore((s) => s.imageUrls);
  const productType = useStoryboardStore((s) => s.metaData.productType);
  const complexity = useStoryboardStore((s) => s.metaData.complexity);
  const fieldDefinitions = useStoryboardStore((s) => s.fieldDefinitions);

  // Springt in den Editor zur Szene. Der Editor ist lazy geladen, daher auf die
  // Karte warten (höchstens ~1 s), statt sofort zu scrollen.
  function editScene(id: string) {
    toggleSceneCollapse(id, false);
    setWizardStep('editor');
    let frames = 0;
    const focusCard = () => {
      const card = document.getElementById(`scene-${id}`);
      if (card) {
        card.scrollIntoView({ block: 'start' });
        card.focus({ preventScroll: true });
      } else if (frames++ < 60) {
        requestAnimationFrame(focusCard);
      }
    };
    requestAnimationFrame(focusCard);
  }

  const statusContext = { productType, complexity, fieldDefinitions };
  const allComplete = hasNoEmptyScenes(scenes, imageUrls, statusContext);

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <WizardSteps />
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setWizardStep('editor')}
          className="flex min-h-11 items-center rounded-lg px-2 text-sm text-slate-500 transition-[color,background-color,transform] motion-safe:active:scale-[0.96] hover:bg-slate-100 hover:text-blue-600"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('wizard.reviewBack')}
        </button>
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900">
          {t('wizard.reviewTitle')}
        </h1>
        <p className="mt-2 text-pretty text-slate-500">{t('wizard.reviewSubtitle')}</p>
      </div>

      <div className="space-y-4 mb-10">
        {scenes.map((scene, index) => {
          const status = getSceneStatus(scene, !!imageUrls[scene.id], statusContext);
          return (
            <div
              key={scene.id}
              className={`flex min-w-0 flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                status === 'empty' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 text-pretty font-medium text-slate-900 [overflow-wrap:anywhere]">
                  {scene.title?.trim() || t('scene.title', { n: index + 1 })}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                {status === 'complete' && (
                  <span className="flex items-center whitespace-nowrap text-sm text-emerald-600 font-medium">
                    <CheckCircle2 className="mr-1 h-5 w-5" /> {t('wizard.complete')}
                  </span>
                )}
                {status === 'partial' && (
                  <span className="flex items-center whitespace-nowrap text-sm text-blue-600 font-medium">
                    <CheckCircle2 className="mr-1 h-5 w-5" /> {t('wizard.partial')}
                  </span>
                )}
                {status === 'empty' && (
                  <span className="flex items-center whitespace-nowrap text-sm text-amber-600 font-medium">
                    <AlertCircle className="mr-1 h-5 w-5" /> {t('wizard.empty')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => editScene(scene.id)}
                  aria-label={t('wizard.editSceneAria', { n: index + 1 })}
                  className={`${buttonSecondary} min-h-11`}
                >
                  {t('wizard.editScene')}
                </button>
              </div>
            </div>
          );
        })}
        {scenes.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
            {t('wizard.noScenes')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-8">
        <p className="text-sm text-slate-500">
          {scenes.length === 0
            ? t('wizard.noScenesSummary')
            : allComplete
              ? t('wizard.allGood')
              : t('wizard.someEmpty')}
        </p>
        <button
          onClick={() => setWizardStep('export')}
          disabled={scenes.length === 0}
          className={`${buttonPrimary} px-8 py-3`}
        >
          {t('wizard.toExport')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

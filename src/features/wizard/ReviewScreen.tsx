import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { buttonPrimary } from '../../shared/ui/fieldStyles';

export default function ReviewScreen() {
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const scenes = useStoryboardStore((s) => s.scenes);
  const imageUrls = useStoryboardStore((s) => s.imageUrls);

  const getSceneStatus = (scene: any) => {
    const hasImage = !!imageUrls[scene.id];
    const hasText = !!scene.text?.trim() || !!scene.action?.trim();
    if (hasImage && hasText) return 'complete';
    if (hasImage || hasText) return 'partial';
    return 'empty';
  };

  const allComplete = scenes.every((s) => getSceneStatus(s) !== 'empty');

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="mb-8">
        <button
          onClick={() => setWizardStep('editor')}
          className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zum Editor
        </button>
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Projekt prüfen
        </h1>
        <p className="mt-2 text-slate-500">
          Schritt 4 von 5 • Überprüfe dein Storyboard auf Vollständigkeit.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        {scenes.map((scene, index) => {
          const status = getSceneStatus(scene);
          return (
            <div
              key={scene.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                status === 'empty' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                  {index + 1}
                </span>
                <span className="font-medium text-slate-900">
                  {scene.title?.trim() || `Szene ${index + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {status === 'complete' && (
                  <span className="flex items-center text-sm text-emerald-600 font-medium">
                    <CheckCircle2 className="mr-1 h-5 w-5" /> Vollständig
                  </span>
                )}
                {status === 'partial' && (
                  <span className="flex items-center text-sm text-blue-600 font-medium">
                    <CheckCircle2 className="mr-1 h-5 w-5" /> Teilweise (OK)
                  </span>
                )}
                {status === 'empty' && (
                  <span className="flex items-center text-sm text-amber-600 font-medium">
                    <AlertCircle className="mr-1 h-5 w-5" /> Leer
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {scenes.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
            Dein Projekt hat noch keine Szenen. Gehe zurück zum Editor, um welche hinzuzufügen.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-8">
        <p className="text-sm text-slate-500">
          {scenes.length === 0 ? 'Keine Szenen vorhanden' : allComplete ? 'Alles sieht gut aus!' : 'Einige Szenen sind noch leer.'}
        </p>
        <button
          onClick={() => setWizardStep('export')}
          disabled={scenes.length === 0}
          className={`${buttonPrimary} px-8 py-3`}
        >
          Weiter zum Export
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

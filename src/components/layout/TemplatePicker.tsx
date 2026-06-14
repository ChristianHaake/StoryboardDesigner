import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { STARTER_FORMATS, buildStarterProject, type StarterFormat } from '../../templates';
import { buttonSecondary } from '../forms/fieldStyles';

const FORMAT_KEY: Record<StarterFormat, string> = {
  film: 'format.film',
  fotostory: 'format.fotostory',
  rede: 'format.rede',
};

// Auswahl von Beispielvorlagen (#10). Erscheint im Leerzustand des Storyboards.
export default function TemplatePicker() {
  const { t } = useTranslation();
  const loadProject = useStoryboardStore((s) => s.loadProject);

  function pick(format: StarterFormat) {
    const state = useStoryboardStore.getState();
    if (state.hasContent && !window.confirm(t('templates.confirmReplace'))) return;
    loadProject(buildStarterProject(format), {}, true);
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 print:hidden">
      <p className="text-sm font-semibold text-slate-900">{t('templates.pickHeading')}</p>
      <p className="mt-1 text-xs text-slate-500">{t('templates.pickHint')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {STARTER_FORMATS.map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => pick(format)}
            className={`${buttonSecondary} min-h-11`}
          >
            {t(FORMAT_KEY[format])}
          </button>
        ))}
      </div>
    </div>
  );
}

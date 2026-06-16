import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { useShallow } from 'zustand/react/shallow';

// Szenen-Navigator (#5): nummerierte Sprungziele. Klick scrollt zur Szene und
// setzt den Fokus dorthin (Tastatur/SR). Erscheint erst ab zwei Szenen.
export default function SceneNavigator() {
  const { t } = useTranslation();
  const sceneIds = useStoryboardStore(useShallow((s) => s.scenes.map((scene) => scene.id)));
  const done = useStoryboardStore(
    (s) =>
      s.scenes.filter((scene) => scene.text.trim() || scene.action.trim() || scene.imageFileName)
        .length,
  );

  if (sceneIds.length < 2) return null;

  const percent = Math.round((done / sceneIds.length) * 100);

  function jump(id: string) {
    const el = document.getElementById(`scene-${id}`);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }

  return (
    <nav
      aria-label={t('navigator.label')}
      className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 print:hidden"
    >
      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {t('navigator.heading')}
      </span>
      <ul className="flex flex-wrap gap-1.5">
        {sceneIds.map((id, index) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => jump(id)}
              aria-label={t('navigator.jump', { n: index + 1 })}
              title={t('navigator.jump', { n: index + 1 })}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 tabular-nums transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              {index + 1}
            </button>
          </li>
        ))}
      </ul>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={sceneIds.length}
        aria-valuenow={done}
        aria-label={t('navigator.progressLabel')}
        className="ml-auto flex items-center gap-2"
      >
        <span className="text-xs text-slate-500 tabular-nums">
          {t('navigator.progress', { done, total: sceneIds.length })}
        </span>
        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
          <span
            className="block h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </span>
      </div>
    </nav>
  );
}

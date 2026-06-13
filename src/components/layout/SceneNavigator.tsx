import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../store/useStoryboardStore';

// Szenen-Navigator (#5): nummerierte Sprungziele. Klick scrollt zur Szene und
// setzt den Fokus dorthin (Tastatur/SR). Erscheint erst ab zwei Szenen.
export default function SceneNavigator() {
  const { t } = useTranslation();
  const scenes = useStoryboardStore((s) => s.scenes);

  if (scenes.length < 2) return null;

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
        {scenes.map((scene, index) => (
          <li key={scene.id}>
            <button
              type="button"
              onClick={() => jump(scene.id)}
              aria-label={t('navigator.jump', { n: index + 1 })}
              title={t('navigator.jump', { n: index + 1 })}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 tabular-nums transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              {index + 1}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

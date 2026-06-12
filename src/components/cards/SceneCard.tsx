import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../../types';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import AutoResizeTextarea from '../forms/AutoResizeTextarea';

const labelClass = 'block text-xs font-medium uppercase tracking-wide text-gray-500';

interface SceneCardProps {
  scene: Scene;
}

export default function SceneCard({ scene }: SceneCardProps) {
  const updateScene = useStoryboardStore((s) => s.updateScene);
  const duplicateScene = useStoryboardStore((s) => s.duplicateScene);
  const deleteScene = useStoryboardStore((s) => s.deleteScene);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative break-inside-avoid rounded-md border border-gray-200 p-4 print:rounded-none print:border-gray-300 ${
        isDragging ? 'z-10 bg-white opacity-90 shadow-lg' : ''
      }`}
    >
      {/* Kontextaktionen: Hover/Fokus, auf Touch-Geräten dezent permanent */}
      <div className="absolute -top-3 right-3 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 print:hidden">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Szene ${scene.orderIndex + 1} verschieben`}
          className="cursor-grab touch-none rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-500 hover:bg-gray-100 active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => duplicateScene(scene.id)}
          aria-label={`Szene ${scene.orderIndex + 1} duplizieren`}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="5" y="5" width="9" height="9" rx="1" />
            <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => deleteScene(scene.id)}
          aria-label={`Szene ${scene.orderIndex + 1} löschen`}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2 4h12M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4M6 7v5M10 7v5M3.5 4l.7 9.3a1 1 0 0 0 1 .7h5.6a1 1 0 0 0 1-.7L12.5 4" />
          </svg>
        </button>
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
        Szene {scene.orderIndex + 1}
      </h3>

      <div className="mt-3 flex gap-4 max-sm:flex-col">
        {/* Medien-Feld — Upload folgt in Sprint 3 */}
        <div className="flex aspect-square w-48 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-center text-xs text-gray-400 max-sm:w-full print:border-gray-300">
          Noch kein Bild
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label className={labelClass} htmlFor={`visual-${scene.id}`}>
              Bildbeschreibung
            </label>
            <AutoResizeTextarea
              id={`visual-${scene.id}`}
              placeholder="Was ist zu sehen?"
              value={scene.visualDescription}
              onChange={(e) => updateScene(scene.id, { visualDescription: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`audio-${scene.id}`}>
              Text / Ton
            </label>
            <AutoResizeTextarea
              id={`audio-${scene.id}`}
              placeholder="Was wird gesagt oder gehört?"
              value={scene.audioText}
              onChange={(e) => updateScene(scene.id, { audioText: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`notes-${scene.id}`}>
              Regieanweisung
            </label>
            <AutoResizeTextarea
              id={`notes-${scene.id}`}
              placeholder="Kamera, Bewegung, Hinweise …"
              value={scene.directorNotes}
              onChange={(e) => updateScene(scene.id, { directorNotes: e.target.value })}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

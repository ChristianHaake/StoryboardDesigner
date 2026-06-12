import { memo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../../types';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { resizeImage } from '../../utils/imageResizer';
import AutoResizeTextarea from '../forms/AutoResizeTextarea';
import { labelClass } from '../forms/fieldStyles';
import { MAX_SCENES } from '../../utils/projectCodec';

interface SceneCardProps {
  scene: Scene;
}

function SceneCard({ scene }: SceneCardProps) {
  const imageUrl = useStoryboardStore((s) => s.imageUrls[scene.id] ?? null);
  const updateScene = useStoryboardStore((s) => s.updateScene);
  const duplicateScene = useStoryboardStore((s) => s.duplicateScene);
  const deleteScene = useStoryboardStore((s) => s.deleteScene);
  const setSceneImage = useStoryboardStore((s) => s.setSceneImage);
  const removeSceneImage = useStoryboardStore((s) => s.removeSceneImage);
  const sceneLimitReached = useStoryboardStore((s) => s.scenes.length >= MAX_SCENES);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Zurücksetzen, damit dieselbe Datei erneut wählbar ist.
    event.target.value = '';
    if (!file) return;
    try {
      setSceneImage(scene.id, await resizeImage(file));
      setImageError(false);
    } catch (error: unknown) {
      console.warn('Bild konnte nicht verarbeitet werden:', error);
      setImageError(true);
    }
  }

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative break-inside-avoid rounded-xl border border-gray-200 bg-white p-4 transition-[border-color,box-shadow] hover:border-gray-300 hover:shadow-sm sm:p-5 print:rounded-none print:border-gray-300 print:p-3 ${
        isDragging ? 'z-10 border-blue-300 bg-white opacity-95 shadow-xl' : ''
      }`}
    >
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3 print:min-h-0">
        <h3 className="text-xs font-bold tracking-[0.14em] text-gray-700 uppercase">
          Szene {scene.orderIndex + 1}
        </h3>
        <div className="flex items-center gap-1 print:hidden">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Szene ${scene.orderIndex + 1} verschieben`}
            className="inline-flex size-11 cursor-grab touch-none items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 active:cursor-grabbing"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100 pointer-coarse:opacity-100">
            <button
              type="button"
              onClick={() => duplicateScene(scene.id)}
              disabled={sceneLimitReached}
              aria-label={`Szene ${scene.orderIndex + 1} duplizieren`}
              className="inline-flex size-11 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="5" y="5" width="9" height="9" rx="1" />
                <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => deleteScene(scene.id)}
              aria-label={`Szene ${scene.orderIndex + 1} löschen`}
              className="inline-flex size-11 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M2 4h12M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4M6 7v5M10 7v5M3.5 4l.7 9.3a1 1 0 0 0 1 .7h5.6a1 1 0 0 0 1-.7L12.5 4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-5 max-sm:flex-col max-sm:gap-4">
        {/* Medien-Feld */}
        <div className={`relative w-48 shrink-0 max-sm:w-full ${imageUrl ? '' : 'print:hidden'}`}>
          {imageUrl ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={`Bild der Szene ${scene.orderIndex + 1} ersetzen`}
                className="block w-full overflow-hidden rounded-lg"
              >
                <img
                  src={imageUrl}
                  alt={`Bild für Szene ${scene.orderIndex + 1}`}
                  className="aspect-square w-full object-cover max-sm:aspect-[4/3] print:aspect-square print:rounded-none"
                />
              </button>
              <button
                type="button"
                onClick={() => removeSceneImage(scene.id)}
                aria-label={`Bild der Szene ${scene.orderIndex + 1} entfernen`}
                className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-lg bg-white/95 text-gray-700 shadow-md transition-colors hover:bg-red-50 hover:text-red-700 print:hidden"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 max-sm:aspect-[4/3] print:aspect-square print:border-gray-300"
            >
              <span className="print:hidden">
                {imageError ? 'Bild nicht lesbar — JPG oder PNG verwenden' : '+ Bild hinzufügen'}
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3.5">
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

// updateScene erhält Referenzen unveränderter Szenen — memo verhindert,
// dass jeder Tastendruck alle Karten re-rendert.
export default memo(SceneCard);

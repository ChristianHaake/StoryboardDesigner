import { memo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../../types';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { resizeImage } from '../../utils/imageResizer';
import AutoResizeTextarea from '../forms/AutoResizeTextarea';
import { labelClass } from '../forms/fieldStyles';
import { MAX_SCENES } from '../../utils/projectCodec';

const EMPTY_FIELD_DEFINITIONS: NonNullable<
  ReturnType<typeof useStoryboardStore.getState>['fieldDefinitions']
> = [];

interface SceneCardProps {
  scene: Scene;
}

function SceneCard({ scene }: SceneCardProps) {
  const { t } = useTranslation();
  const n = scene.orderIndex + 1;
  const imageUrl = useStoryboardStore((s) => s.imageUrls[scene.id] ?? null);
  const fieldDefinitions = useStoryboardStore((s) => s.fieldDefinitions ?? EMPTY_FIELD_DEFINITIONS);
  const updateScene = useStoryboardStore((s) => s.updateScene);
  const updateCustomField = useStoryboardStore((s) => s.updateCustomField);
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
      className={`group relative break-inside-avoid rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md sm:p-5 print:rounded-none print:border-gray-300 print:p-3 print:shadow-none ${
        isDragging ? 'z-10 border-blue-300 bg-white opacity-95 shadow-xl' : ''
      }`}
    >
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3 print:min-h-0">
        <h3 className="flex items-center gap-2.5 text-xs font-bold tracking-[0.14em] text-gray-700 uppercase">
          <span
            aria-hidden="true"
            className="inline-flex size-6 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700 tabular-nums print:bg-transparent print:text-gray-700"
          >
            {n}
          </span>
          {t('scene.title', { n })}
        </h3>
        <div className="flex items-center gap-1 print:hidden">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={t('scene.move', { n })}
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
              aria-label={t('scene.duplicate', { n })}
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
              aria-label={t('scene.delete', { n })}
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
                aria-label={t('scene.imageReplace', { n })}
                className="block w-full overflow-hidden rounded-lg"
              >
                <img
                  src={imageUrl}
                  alt={t('scene.imageAlt', { n })}
                  className="aspect-square w-full object-cover max-sm:aspect-[4/3] print:aspect-square print:rounded-none"
                />
              </button>
              <button
                type="button"
                onClick={() => removeSceneImage(scene.id)}
                aria-label={t('scene.imageRemove', { n })}
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
                {imageError ? t('scene.imageError') : t('scene.imageAdd')}
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
              {t('scene.visual')}
            </label>
            <AutoResizeTextarea
              id={`visual-${scene.id}`}
              placeholder={t('scene.visualPlaceholder')}
              value={scene.visualDescription}
              onChange={(e) => updateScene(scene.id, { visualDescription: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`audio-${scene.id}`}>
              {t('scene.audio')}
            </label>
            <AutoResizeTextarea
              id={`audio-${scene.id}`}
              placeholder={t('scene.audioPlaceholder')}
              value={scene.audioText}
              onChange={(e) => updateScene(scene.id, { audioText: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`notes-${scene.id}`}>
              {t('scene.notes')}
            </label>
            <AutoResizeTextarea
              id={`notes-${scene.id}`}
              placeholder={t('scene.notesPlaceholder')}
              value={scene.directorNotes}
              onChange={(e) => updateScene(scene.id, { directorNotes: e.target.value })}
            />
          </div>
          {fieldDefinitions.map((definition) => {
            const value = scene.customFields?.[definition.key] ?? '';
            return (
              <div key={definition.key} className={value ? '' : 'print:hidden'}>
                <label className={labelClass} htmlFor={`custom-${definition.key}-${scene.id}`}>
                  {definition.label}
                </label>
                <AutoResizeTextarea
                  id={`custom-${definition.key}-${scene.id}`}
                  placeholder={t('scene.customPlaceholder', { label: definition.label })}
                  value={value}
                  onChange={(event) =>
                    updateCustomField(scene.id, definition.key, event.target.value)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

// updateScene erhält Referenzen unveränderter Szenen — memo verhindert,
// dass jeder Tastendruck alle Karten re-rendert.
export default memo(SceneCard);

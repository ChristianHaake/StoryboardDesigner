import { memo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../../types';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { resizeImage } from '../../utils/imageResizer';
import AutoResizeTextarea from '../forms/AutoResizeTextarea';
import CommentThread from './CommentThread';
import { inputClass, labelClass } from '../forms/fieldStyles';
import { MAX_SCENES } from '../../utils/projectCodec';
import { GripVertical, Copy, Trash2, X } from 'lucide-react';

const EMPTY_FIELD_DEFINITIONS: NonNullable<
  ReturnType<typeof useStoryboardStore.getState>['fieldDefinitions']
> = [];
const EMPTY_COMMENTS: NonNullable<Scene['comments']> = [];

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
  const feedbackMode = useStoryboardStore((s) => s.feedbackMode);

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
      id={`scene-${scene.id}`}
      tabIndex={-1}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative scroll-mt-24 break-inside-avoid rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md focus-visible:border-blue-400 sm:p-5 print:rounded-none print:border-slate-300 print:p-3 print:shadow-none ${
        isDragging ? 'z-10 border-blue-300 bg-white opacity-95 shadow-xl' : ''
      }`}
    >
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3 print:min-h-0">
        <h3 className="flex items-center gap-2.5 text-xs font-bold tracking-[0.14em] text-slate-700 uppercase">
          <span
            aria-hidden="true"
            className="inline-flex size-6 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700 tabular-nums print:bg-transparent print:text-slate-700"
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
            title={t('scene.move', { n })}
            className="inline-flex size-11 cursor-grab touch-none items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 active:cursor-grabbing"
          >
            <GripVertical className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100 pointer-coarse:opacity-100">
            <button
              type="button"
              onClick={() => duplicateScene(scene.id)}
              disabled={sceneLimitReached}
              aria-label={t('scene.duplicate', { n })}
              title={t('scene.duplicate', { n })}
              className="inline-flex size-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => deleteScene(scene.id)}
              aria-label={t('scene.delete', { n })}
              title={t('scene.delete', { n })}
              className="inline-flex size-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
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
                  alt={scene.altText?.trim() ? scene.altText : t('scene.imageAlt', { n })}
                  className="aspect-square w-full object-cover max-sm:aspect-[4/3] print:aspect-square print:rounded-none"
                />
              </button>
              <button
                type="button"
                onClick={() => removeSceneImage(scene.id)}
                aria-label={t('scene.imageRemove', { n })}
                title={t('scene.imageRemove', { n })}
                className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-lg bg-white/95 text-slate-700 shadow-md transition-colors hover:bg-red-50 hover:text-red-700 print:hidden"
              >
                <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-medium text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 max-sm:aspect-[4/3] print:aspect-square print:border-slate-300"
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
          {imageUrl && (
            <div className="mt-2 print:hidden">
              <label className={labelClass} htmlFor={`alt-${scene.id}`}>
                {t('scene.altLabel')}
              </label>
              <AutoResizeTextarea
                id={`alt-${scene.id}`}
                placeholder={t('scene.altPlaceholder')}
                value={scene.altText ?? ''}
                onChange={(e) => updateScene(scene.id, { altText: e.target.value })}
              />
            </div>
          )}
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
            const fieldId = `custom-${definition.key}-${scene.id}`;
            const isSelect = definition.type === 'select' && definition.options;
            // Altwert, der nicht (mehr) in den Optionen liegt, bleibt wählbar.
            const options =
              isSelect && value && !definition.options!.includes(value)
                ? [value, ...definition.options!]
                : definition.options ?? [];
            return (
              <div key={definition.key} className={value ? '' : 'print:hidden'}>
                <label className={labelClass} htmlFor={fieldId}>
                  {definition.label}
                </label>
                {isSelect ? (
                  <select
                    id={fieldId}
                    className={`${inputClass} appearance-none`}
                    value={value}
                    onChange={(event) =>
                      updateCustomField(scene.id, definition.key, event.target.value)
                    }
                  >
                    <option value="">{t('scene.selectPlaceholder')}</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <AutoResizeTextarea
                    id={fieldId}
                    placeholder={t('scene.customPlaceholder', { label: definition.label })}
                    value={value}
                    onChange={(event) =>
                      updateCustomField(scene.id, definition.key, event.target.value)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {feedbackMode && (
        <CommentThread
          sceneId={scene.id}
          sceneNumber={n}
          comments={scene.comments ?? EMPTY_COMMENTS}
        />
      )}
    </article>
  );
}

// updateScene erhält Referenzen unveränderter Szenen — memo verhindert,
// dass jeder Tastendruck alle Karten re-rendert.
export default memo(SceneCard);

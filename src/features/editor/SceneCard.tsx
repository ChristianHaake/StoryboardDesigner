import { memo, useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../../domain/types';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { resizeImage } from '../../shared/utils/imageResizer';
import AutoResizeTextarea from '../../shared/ui/AutoResizeTextarea';
import CommentThread from './CommentThread';
import { FORMAT_FEATURES } from '../../domain/formatConfig';
import { inputClass, labelClass } from '../../shared/ui/fieldStyles';
import { MAX_SCENES } from '../../domain/projectCodec';
import { GripVertical, Copy, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';

const EMPTY_FIELD_DEFINITIONS: NonNullable<
  ReturnType<typeof useStoryboardStore.getState>['fieldDefinitions']
> = [];
const EMPTY_COMMENTS: NonNullable<Scene['comments']> = [];

interface SceneCardProps {
  sceneId: string;
}

function SceneCard({ sceneId }: SceneCardProps) {
  const { t } = useTranslation();

  const scene = useStoryboardStore((s) => s.scenes.find((x) => x.id === sceneId));
  const orderIndex = useStoryboardStore((s) => s.scenes.findIndex((x) => x.id === sceneId));
  const n = orderIndex + 1;
  const productType = useStoryboardStore((s) => s.metaData.productType);
  const features = productType ? FORMAT_FEATURES[productType] : FORMAT_FEATURES.shortFilm;

  // We must return early if scene is deleted but component is still rendering
  // to avoid crashes. However, hooks must be called unconditionally.
  const imageUrl = useStoryboardStore((s) => s.imageUrls[sceneId] ?? null);
  const fieldDefinitions = useStoryboardStore(
    (state) => state.fieldDefinitions ?? EMPTY_FIELD_DEFINITIONS,
  );
  const isCollapsed = useStoryboardStore((state) => state.collapsedScenes[sceneId] ?? false);
  const toggleSceneCollapse = useStoryboardStore((state) => state.toggleSceneCollapse);
  const updateScene = useStoryboardStore((state) => state.updateScene);
  const updateCustomField = useStoryboardStore((s) => s.updateCustomField);
  const duplicateScene = useStoryboardStore((s) => s.duplicateScene);
  const deleteScene = useStoryboardStore((s) => s.deleteScene);
  const setSceneImage = useStoryboardStore((s) => s.setSceneImage);
  const removeSceneImage = useStoryboardStore((s) => s.removeSceneImage);
  const sceneLimitReached = useStoryboardStore((s) => s.scenes.length >= MAX_SCENES);
  const feedbackMode = useStoryboardStore((s) => s.feedbackMode);
  const complexity = useStoryboardStore((s) => s.metaData.complexity);

  const [imageError, setImageError] = useState(false);
  const [isTooTall, setIsTooTall] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);

  const [localMaterials, setLocalMaterials] = useState(() =>
    scene && Array.isArray(scene.materials) ? scene.materials.join(', ') : '',
  );
  const [prevMaterials, setPrevMaterials] = useState(scene?.materials);

  if (scene?.materials !== prevMaterials) {
    setPrevMaterials(scene?.materials);
    setLocalMaterials(scene && Array.isArray(scene.materials) ? scene.materials.join(', ') : '');
  }

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsTooTall(entry.contentRect.height > 900);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sceneId,
  });

  if (!scene) return null;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Zurücksetzen, damit dieselbe Datei erneut wählbar ist.
    event.target.value = '';
    if (!file) return;
    try {
      setSceneImage(sceneId, await resizeImage(file));
      setImageError(false);
    } catch (error: unknown) {
      console.warn('Bild konnte nicht verarbeitet werden:', error);
      setImageError(true);
    }
  }

  return (
    <article
      ref={(node) => {
        setNodeRef(node);
        if (node) {
          // Sync with local ref for ResizeObserver
          cardRef.current = node;
        }
      }}
      id={`scene-${scene.id}`}
      tabIndex={-1}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative scroll-mt-24 break-inside-avoid rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md focus-visible:border-blue-400 sm:p-6 print:rounded-none print:border-slate-300 print:p-3 print:shadow-none ${
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
          <input
            type="text"
            value={scene.title}
            placeholder={t('scene.title', { n })}
            onChange={(e) => updateScene(scene.id, { title: e.target.value })}
            className="flex-1 min-w-0 bg-transparent border-none p-0 focus:ring-0 text-xs font-bold tracking-[0.14em] text-slate-700 uppercase placeholder-slate-400"
            aria-label={t('scene.titleLabel', { n })}
          />
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
            <button
              type="button"
              onClick={() => toggleSceneCollapse(scene.id)}
              aria-expanded={!isCollapsed}
              aria-label={
                isCollapsed
                  ? t('editor.expandAll', 'Ausklappen')
                  : t('editor.collapseAll', 'Einklappen')
              }
              title={
                isCollapsed
                  ? t('editor.expandAll', 'Ausklappen')
                  : t('editor.collapseAll', 'Einklappen')
              }
              className="inline-flex size-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              {isCollapsed ? (
                <ChevronDown className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <ChevronUp className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex gap-5 max-sm:flex-col max-sm:gap-4">
            {/* Medien-Feld */}
            {features.hasImage && (
              <div
                className={`relative w-72 shrink-0 max-sm:w-full ${imageUrl ? '' : 'print:hidden'}`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 print:text-xs">
                    {t('scene.imageLabel', 'Szenenbild')}
                  </span>
                </div>
                {imageUrl ? (
                  <div className="relative group">
                    <label
                      htmlFor={`image-upload-${scene.id}`}
                      aria-label={t('scene.imageReplace', { n })}
                      className="block w-full cursor-pointer overflow-hidden rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                    >
                      <img
                        src={imageUrl}
                        alt={scene.altText?.trim() ? scene.altText : t('scene.imageAlt', { n })}
                        className={`aspect-video w-full max-sm:aspect-video print:aspect-video print:rounded-none ${
                          scene.imageFit === 'contain'
                            ? 'object-contain bg-slate-900'
                            : 'object-cover'
                        }`}
                      />
                    </label>
                    <div className="absolute bottom-2 left-2 flex gap-1 print:hidden opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() =>
                          updateScene(scene.id, {
                            imageFit: scene.imageFit === 'contain' ? 'cover' : 'contain',
                          })
                        }
                        className="inline-flex h-7 items-center justify-center rounded bg-slate-900/70 px-2 text-[10px] font-medium text-white backdrop-blur-md transition-colors hover:bg-slate-900"
                      >
                        {scene.imageFit === 'contain'
                          ? t('scene.fitCover', 'Füllen')
                          : t('scene.fitContain', 'Einpassen')}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSceneImage(scene.id)}
                      aria-label={t('scene.imageRemove', { n })}
                      title={t('scene.imageRemove', { n })}
                      className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-lg bg-white/95 text-slate-700 shadow-md transition-colors hover:bg-red-50 hover:text-red-700 print:hidden"
                    >
                      <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor={`image-upload-${scene.id}`}
                    className="flex flex-col aspect-video w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-medium text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 max-sm:aspect-video print:aspect-video print:border-slate-300"
                  >
                    <span className="print:hidden">
                      {imageError ? (
                        <span className="text-red-600">{t('scene.imageError')}</span>
                      ) : (
                        <>
                          <span className="mb-1 block font-semibold text-slate-700">
                            {t('scene.imageAdd', 'Bild hinzufügen')}
                          </span>
                          <span className="text-xs font-normal text-slate-500">
                            {t('scene.imageInstruction', 'Klicken oder Datei ziehen')}
                          </span>
                        </>
                      )}
                    </span>
                  </label>
                )}
                <input
                  id={`image-upload-${scene.id}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
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
            )}

            <div className="min-w-0 flex-1 space-y-3.5">
              {/* === IMMER SICHTBAR (SIMPLE) === */}
              <div>
                <label className={labelClass} htmlFor={`action-${scene.id}`}>
                  Handlung / Bildbeschreibung
                </label>
                <AutoResizeTextarea
                  id={`action-${scene.id}`}
                  placeholder="Was passiert im Bild?"
                  value={scene.action}
                  onChange={(e) => updateScene(scene.id, { action: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`text-${scene.id}`}>
                  Sprechtext / Voiceover
                </label>
                <AutoResizeTextarea
                  id={`text-${scene.id}`}
                  placeholder="Was wird gesprochen?"
                  value={scene.text}
                  onChange={(e) => updateScene(scene.id, { text: e.target.value })}
                />
              </div>

              {/* === STANDARD & ADVANCED === */}
              {(complexity === 'standard' || complexity === 'advanced') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor={`dialogue-${scene.id}`}>
                        Dialog
                      </label>
                      <AutoResizeTextarea
                        id={`dialogue-${scene.id}`}
                        placeholder="Wer spricht mit wem?"
                        value={scene.audio?.dialogue ?? ''}
                        onChange={(e) =>
                          updateScene(scene.id, {
                            audio: { ...scene.audio, dialogue: e.target.value },
                          })
                        }
                      />
                    </div>
                    {features.hasAudioEffects && (
                      <div>
                        <label className={labelClass} htmlFor={`soundEffects-${scene.id}`}>
                          Soundeffekte / Musik
                        </label>
                        <AutoResizeTextarea
                          id={`soundEffects-${scene.id}`}
                          placeholder="Geräusche oder Musik"
                          value={scene.audio?.soundEffects ?? ''}
                          onChange={(e) =>
                            updateScene(scene.id, {
                              audio: { ...scene.audio, soundEffects: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  {features.hasLocation && (
                    <div>
                      <label className={labelClass} htmlFor={`location-${scene.id}`}>
                        Ort / Location
                      </label>
                      <AutoResizeTextarea
                        id={`location-${scene.id}`}
                        placeholder="Wo findet die Szene statt?"
                        value={scene.location ?? ''}
                        onChange={(e) => updateScene(scene.id, { location: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}

              {/* === ADVANCED ONLY === */}
              {complexity === 'advanced' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {features.hasCameraSize && (
                      <div>
                        <label className={labelClass} htmlFor={`camera-size-${scene.id}`}>
                          Einstellungsgröße
                        </label>
                        <AutoResizeTextarea
                          id={`camera-size-${scene.id}`}
                          placeholder="z.B. Halbnah, Totale"
                          value={scene.camera?.shotSize ?? ''}
                          onChange={(e) =>
                            updateScene(scene.id, {
                              camera: { ...scene.camera, shotSize: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}
                    {features.hasCameraMovement && (
                      <div>
                        <label className={labelClass} htmlFor={`camera-movement-${scene.id}`}>
                          Kamerabewegung
                        </label>
                        <AutoResizeTextarea
                          id={`camera-movement-${scene.id}`}
                          placeholder="z.B. Schwenk, Statisch"
                          value={scene.camera?.movement ?? ''}
                          onChange={(e) =>
                            updateScene(scene.id, {
                              camera: { ...scene.camera, movement: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`materials-${scene.id}`}>
                      Requisiten / Material
                    </label>
                    <AutoResizeTextarea
                      id={`materials-${scene.id}`}
                      placeholder="Was wird für das Bild benötigt?"
                      value={localMaterials}
                      onChange={(e) => setLocalMaterials(e.target.value)}
                      onBlur={() =>
                        updateScene(scene.id, {
                          materials: localMaterials
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </>
              )}

              {/* Custom Fields (aus v1 für Legacy-Projekte/Vorlagen) */}
              {fieldDefinitions.map((definition) => {
                const value = scene.customFields?.[definition.key] ?? '';
                const fieldId = `custom-${definition.key}-${scene.id}`;
                const isSelect = definition.type === 'select' && definition.options;
                // Altwert, der nicht (mehr) in den Optionen liegt, bleibt wählbar.
                const options =
                  isSelect && value && !definition.options!.includes(value)
                    ? [value, ...definition.options!]
                    : (definition.options ?? []);
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
                        aria-describedby={definition.description ? `${fieldId}-desc` : undefined}
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
                        aria-describedby={definition.description ? `${fieldId}-desc` : undefined}
                        value={value}
                        onChange={(event) =>
                          updateCustomField(scene.id, definition.key, event.target.value)
                        }
                      />
                    )}
                    {definition.description && (
                      <p
                        className="mt-1.5 text-xs text-slate-500 print:hidden"
                        id={`${fieldId}-desc`}
                      >
                        {definition.description}
                      </p>
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
        </>
      )}

      {isTooTall && !isCollapsed && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">
          {t(
            'scene.heightWarning',
            'Hinweis: Diese Szene ist sehr lang und könnte beim PDF-Druck auf zwei Seiten aufgeteilt werden.',
          )}
        </div>
      )}
    </article>
  );
}

// updateScene erhält Referenzen unveränderter Szenen — memo verhindert,
// dass jeder Tastendruck alle Karten re-rendert.
export default memo(SceneCard);

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Announcements, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import A4Page from '../../app/layout/A4Page';
import SceneCard from './SceneCard';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { MAX_SCENES } from '../../domain/projectCodec';
import FieldConfigDialog from '../../shared/ui/FieldConfigDialog';
import SceneNavigator from './SceneNavigator';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDown, ChevronUp, LayoutTemplate, Film, Camera } from 'lucide-react';
import PrePlanningSection from './PrePlanningSection';

export default function EditorView() {
  const { t } = useTranslation();
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const closeFieldDialog = useCallback(() => setFieldDialogOpen(false), []);

  const sceneIds = useStoryboardStore(useShallow((s) => s.scenes.map((x) => x.id)));
  const numScenes = sceneIds.length;

  const productType = useStoryboardStore((state) => state.metaData.productType);
  const collapseAllScenes = useStoryboardStore((state) => state.collapseAllScenes);
  const isAllCollapsed = useStoryboardStore((state) => {
    if (state.scenes.length === 0) return false;
    return state.scenes.every((s) => state.collapsedScenes[s.id] === true);
  });

  const addScene = useStoryboardStore((s) => s.addScene);
  const moveScene = useStoryboardStore((s) => s.moveScene);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveScene(String(active.id), String(over.id));
    }
  }

  // Übersetzte Screenreader-Ansagen (dnd-kit-Defaults sind Englisch).
  const position = (id: UniqueIdentifier) => sceneIds.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('dnd.pickedUp', { pos: position(active.id) }),
    onDragOver: ({ over }) =>
      over ? t('dnd.movedOver', { pos: position(over.id) }) : t('dnd.noTarget'),
    onDragEnd: ({ over }) =>
      over ? t('dnd.dropped', { pos: position(over.id) }) : t('dnd.cancelled'),
    onDragCancel: () => t('dnd.cancelled'),
  };
  const screenReaderInstructions = { draggable: t('dnd.instructions') };

  useEffect(() => {
    const handleBeforePrint = () => {
      document.querySelectorAll('details').forEach((d) => {
        d.setAttribute('data-print-open', d.open ? 'true' : 'false');
        d.setAttribute('open', '');
      });
    };
    const handleAfterPrint = () => {
      document.querySelectorAll('details').forEach((d) => {
        if (d.getAttribute('data-print-open') === 'false') {
          d.removeAttribute('open');
        }
        d.removeAttribute('data-print-open');
      });
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return (
    <main>
      <A4Page id="storyboard-document">
        {/* Wizard Navigation */}
        <div className="mb-8 flex items-center justify-between print:hidden">
          <button
            onClick={() => useStoryboardStore.getState().setWizardStep('setup')}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            Zurück zu Einstellungen
          </button>

          <button
            onClick={() => useStoryboardStore.getState().setWizardStep('review')}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            Prüfen & Abschließen
          </button>
        </div>
        {/* Pre-Planning */}
        <PrePlanningSection />

        {/* Szenen */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold tracking-[0.16em] text-slate-700 uppercase">
              {t('editor.storyboard')}
            </h2>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setFieldDialogOpen(true)}
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 print:hidden"
            >
              {t('editor.configureFields')}
            </button>
          </div>
          <SceneNavigator />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={{ announcements, screenReaderInstructions }}
          >
            <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
              <div className="mt-4 space-y-3">
                {numScenes > 1 && (
                  <div className="flex justify-end print:hidden">
                    <button
                      type="button"
                      onClick={() => collapseAllScenes(!isAllCollapsed)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {isAllCollapsed ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          {t('editor.expandAll', 'Alle ausklappen')}
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          {t('editor.collapseAll', 'Alle einklappen')}
                        </>
                      )}
                    </button>
                  </div>
                )}
                {numScenes === 0 && (
                  <>
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-slate-500 print:hidden">
                      {productType === 'shortFilm' && (
                        <Film className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                      )}
                      {productType === 'fotostory' && (
                        <Camera className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                      )}

                      {productType === 'custom' && (
                        <LayoutTemplate className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                      )}
                      <p className="text-sm">
                        {t(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          `editor.emptyState${productType.charAt(0).toUpperCase() + productType.slice(1)}` as any,
                          t('editor.emptyStateCustom'),
                        )}
                      </p>
                    </div>
                  </>
                )}
                {sceneIds.map((id) => (
                  <SceneCard key={id} sceneId={id} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addScene}
            disabled={numScenes >= MAX_SCENES}
            className="mt-4 min-h-12 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 print:hidden"
          >
            {numScenes >= MAX_SCENES
              ? t('editor.maxScenes', { max: MAX_SCENES })
              : t('editor.addScene')}
          </button>
        </section>
      </A4Page>
      <FieldConfigDialog open={fieldDialogOpen} onClose={closeFieldDialog} />
    </main>
  );
}

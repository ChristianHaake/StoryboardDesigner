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
import A4Page from '../components/layout/A4Page';
import AutoResizeTextarea from '../components/forms/AutoResizeTextarea';
import SceneCard from '../components/cards/SceneCard';
import { useStoryboardStore } from '../store/useStoryboardStore';
import type { MetaData } from '../types';
import { inputClass, labelClass } from '../components/forms/fieldStyles';
import { MAX_SCENES } from '../utils/projectCodec';
import FieldConfigDialog from '../components/forms/FieldConfigDialog';
import SceneNavigator from '../components/layout/SceneNavigator';
import TemplatePicker from '../components/layout/TemplatePicker';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, LayoutTemplate, Film, Camera, Mic } from 'lucide-react';

export default function EditorView() {
  const { t } = useTranslation();
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const metaData = useStoryboardStore((s) => s.metaData);
  const prePlanning = useStoryboardStore((s) => s.prePlanning);
  const scenes = useStoryboardStore((s) => s.scenes);
  const updateMetaData = useStoryboardStore((s) => s.updateMetaData);
  const setFormatType = useStoryboardStore((s) => s.setFormatType);
  const formatType = useStoryboardStore((state) => state.metaData.formatType);
  const collapseAllScenes = useStoryboardStore((state) => state.collapseAllScenes);
  const isAllCollapsed = useStoryboardStore((state) => {
    if (scenes.length === 0) return false;
    return scenes.every((s) => state.collapsedScenes[s.id] === true);
  });
  const updatePrePlanning = useStoryboardStore((s) => s.updatePrePlanning);
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
  const position = (id: UniqueIdentifier) => scenes.findIndex((s) => s.id === id) + 1;
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

  const hasPrePlanningContent = Boolean(
    prePlanning.logline || prePlanning.objective || prePlanning.roles || prePlanning.resources,
  );

  return (
    <main>
      <A4Page id="storyboard-document">
        {/* Metadaten */}
        <header className="border-b border-slate-200 pb-8">
          <p className="mb-4 text-xs font-bold tracking-[0.16em] text-blue-700 uppercase print:text-slate-700">
            {t('editor.kicker')}
          </p>
          <label className={labelClass} htmlFor="projectName">
            {t('editor.projectName')}
          </label>
          <input
            id="projectName"
            type="text"
            placeholder={t('editor.projectNamePlaceholder')}
            className={`${inputClass} text-xl font-bold tracking-tight sm:text-2xl print:text-2xl`}
            value={metaData.projectName}
            onChange={(e) => updateMetaData({ projectName: e.target.value })}
          />
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div className="col-span-2 max-sm:col-span-1">
              <label className={labelClass} htmlFor="participants">
                {t('editor.participants')}
              </label>
              <input
                id="participants"
                type="text"
                placeholder={t('editor.participantsPlaceholder')}
                className={inputClass}
                value={metaData.participants}
                onChange={(e) => updateMetaData({ participants: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="subject">
                {t('editor.subject')}
              </label>
              <input
                id="subject"
                type="text"
                placeholder={t('editor.subjectPlaceholder')}
                className={inputClass}
                value={metaData.subject}
                onChange={(e) => updateMetaData({ subject: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="date">
                {t('editor.date')}
              </label>
              <input
                id="date"
                type="date"
                className={inputClass}
                value={metaData.date}
                onChange={(e) => updateMetaData({ date: e.target.value })}
              />
            </div>
            <div className="hidden print:block col-span-2 max-sm:col-span-1">
              <label className={labelClass} htmlFor="formatType">
                {t('editor.format')}
              </label>
              <select
                id="formatType"
                className={`${inputClass} appearance-none`}
                value={metaData.formatType}
                onChange={(e) => setFormatType(e.target.value as MetaData['formatType'])}
              >
                <option value="film">{t('format.film')}</option>
                <option value="fotostory">{t('format.fotostory')}</option>
                <option value="rede">{t('format.rede')}</option>
                <option value="custom">{t('format.custom')}</option>
              </select>
            </div>
          </div>
        </header>

        {/* Pre-Planning */}
        <details className="group mt-8" open={hasPrePlanningContent || undefined}>
          <summary className="flex cursor-pointer items-center gap-3 list-none [&::-webkit-details-marker]:hidden print:hidden">
            <h2 className="text-xs font-bold tracking-[0.16em] text-slate-700 uppercase transition-colors group-open:text-blue-700">
              {t('editor.planning')}
            </h2>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          {/* Print-only heading since summary is hidden for cleaner print */}
          <div className="hidden items-center gap-3 print:flex">
            <h2 className="text-xs font-bold tracking-[0.16em] text-slate-700 uppercase">
              {t('editor.planning')}
            </h2>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div>
              <label className={labelClass} htmlFor="logline">
                {t('editor.logline')}
              </label>
              <AutoResizeTextarea
                id="logline"
                placeholder={t('editor.loglinePlaceholder')}
                value={prePlanning.logline}
                onChange={(e) => updatePrePlanning({ logline: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="objective">
                {t('editor.objective')}
              </label>
              <AutoResizeTextarea
                id="objective"
                placeholder={t('editor.objectivePlaceholder')}
                value={prePlanning.objective}
                onChange={(e) => updatePrePlanning({ objective: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="roles">
                {t('editor.roles')}
              </label>
              <AutoResizeTextarea
                id="roles"
                placeholder={t('editor.rolesPlaceholder')}
                value={prePlanning.roles}
                onChange={(e) => updatePrePlanning({ roles: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="resources">
                {t('editor.resources')}
              </label>
              <AutoResizeTextarea
                id="resources"
                placeholder={t('editor.resourcesPlaceholder')}
                value={prePlanning.resources}
                onChange={(e) => updatePrePlanning({ resources: e.target.value })}
              />
            </div>
          </div>
        </details>

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
            <SortableContext
              items={scenes.map((scene) => scene.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="mt-4 space-y-3">
                {scenes.length > 1 && (
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
                {scenes.length === 0 && (
                  <>
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-slate-500 print:hidden">
                      {formatType === 'film' && (
                        <Film className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                      )}
                      {formatType === 'fotostory' && (
                        <Camera className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                      )}
                      {formatType === 'rede' && (
                        <Mic className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                      )}
                      {formatType === 'custom' && (
                        <LayoutTemplate className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                      )}
                      <p className="text-sm">
                        {t(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          `editor.emptyState${formatType.charAt(0).toUpperCase() + formatType.slice(1)}` as any,
                          t('editor.emptyStateCustom'),
                        )}
                      </p>
                    </div>
                    <TemplatePicker />
                  </>
                )}
                {scenes.map((scene) => (
                  <SceneCard key={scene.id} scene={scene} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addScene}
            disabled={scenes.length >= MAX_SCENES}
            className="mt-4 min-h-12 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 print:hidden"
          >
            {scenes.length >= MAX_SCENES
              ? t('editor.maxScenes', { max: MAX_SCENES })
              : t('editor.addScene')}
          </button>
        </section>
      </A4Page>
      <FieldConfigDialog open={fieldDialogOpen} onClose={() => setFieldDialogOpen(false)} />
    </main>
  );
}

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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function EditorView() {
  const { t } = useTranslation();
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const metaData = useStoryboardStore((s) => s.metaData);
  const prePlanning = useStoryboardStore((s) => s.prePlanning);
  const scenes = useStoryboardStore((s) => s.scenes);
  const updateMetaData = useStoryboardStore((s) => s.updateMetaData);
  const setFormatType = useStoryboardStore((s) => s.setFormatType);
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
            <div>
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
          </div>
        </header>

        {/* Pre-Planning */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
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
        </section>

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
                {scenes.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 print:hidden">
                    {t('editor.emptyState')}
                  </p>
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

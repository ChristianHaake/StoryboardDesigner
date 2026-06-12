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

const screenReaderInstructions = {
  draggable:
    'Zum Aufnehmen einer Szene Leertaste oder Eingabetaste drücken. Mit den Pfeiltasten verschieben, zum Ablegen erneut Leertaste oder Eingabetaste drücken. Escape bricht ab.',
};

export default function EditorView() {
  const metaData = useStoryboardStore((s) => s.metaData);
  const prePlanning = useStoryboardStore((s) => s.prePlanning);
  const scenes = useStoryboardStore((s) => s.scenes);
  const updateMetaData = useStoryboardStore((s) => s.updateMetaData);
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

  // Deutsche Screenreader-Ansagen (dnd-kit-Defaults sind Englisch).
  const position = (id: UniqueIdentifier) => scenes.findIndex((s) => s.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Szene an Position ${position(active.id)} aufgenommen.`,
    onDragOver: ({ over }) =>
      over ? `Szene über Position ${position(over.id)} bewegt.` : 'Szene über keiner Ablageposition.',
    onDragEnd: ({ over }) =>
      over ? `Szene an Position ${position(over.id)} abgelegt.` : 'Verschieben abgebrochen.',
    onDragCancel: () => 'Verschieben abgebrochen.',
  };

  return (
    <main>
      <A4Page>
        {/* Metadaten */}
        <header className="border-b border-gray-300 pb-6">
          <input
            type="text"
            placeholder="Projektname"
            aria-label="Projektname"
            className={`${inputClass} text-3xl font-bold`}
            value={metaData.projectName}
            onChange={(e) => updateMetaData({ projectName: e.target.value })}
          />
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 max-sm:grid-cols-1">
            <div>
              <label className={labelClass} htmlFor="participants">
                Beteiligte
              </label>
              <input
                id="participants"
                type="text"
                placeholder="Namen der Gruppenmitglieder"
                className={inputClass}
                value={metaData.participants}
                onChange={(e) => updateMetaData({ participants: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="subject">
                Thema / Fach
              </label>
              <input
                id="subject"
                type="text"
                placeholder="z. B. Wasserkreislauf"
                className={inputClass}
                value={metaData.subject}
                onChange={(e) => updateMetaData({ subject: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="formatType">
                Format
              </label>
              <select
                id="formatType"
                className={`${inputClass} appearance-none`}
                value={metaData.formatType}
                onChange={(e) =>
                  updateMetaData({ formatType: e.target.value as MetaData['formatType'] })
                }
              >
                <option value="film">Film</option>
                <option value="fotostory">Fotostory</option>
                <option value="rede">Rede</option>
                <option value="custom">Eigenes Format</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="date">
                Datum
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
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Planung</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass} htmlFor="logline">
                Logline
              </label>
              <AutoResizeTextarea
                id="logline"
                placeholder="Worum geht es? Ein Satz."
                value={prePlanning.logline}
                onChange={(e) => updatePrePlanning({ logline: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="objective">
                Ziel
              </label>
              <AutoResizeTextarea
                id="objective"
                placeholder="Was soll das Publikum verstehen oder fühlen?"
                value={prePlanning.objective}
                onChange={(e) => updatePrePlanning({ objective: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="roles">
                Rollen
              </label>
              <AutoResizeTextarea
                id="roles"
                placeholder="Wer übernimmt welche Aufgabe?"
                value={prePlanning.roles}
                onChange={(e) => updatePrePlanning({ roles: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="resources">
                Ressourcen
              </label>
              <AutoResizeTextarea
                id="resources"
                placeholder="Was wird benötigt? (Orte, Geräte, Requisiten …)"
                value={prePlanning.resources}
                onChange={(e) => updatePrePlanning({ resources: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Szenen */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Storyboard
          </h2>
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
              <div className="mt-4 space-y-4">
                {scenes.map((scene) => (
                  <SceneCard key={scene.id} scene={scene} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addScene}
            className="mt-4 w-full rounded-md border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-blue-600 print:hidden"
          >
            + Szene hinzufügen
          </button>
        </section>
      </A4Page>
    </main>
  );
}

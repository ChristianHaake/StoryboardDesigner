import { create } from 'zustand';
import type { MetaData, PrePlanning, Scene, StoryboardProject } from '../types';
import { generateId } from '../utils/idGenerator';

export const PROJECT_VERSION = '1.0';

function createEmptyScene(orderIndex: number): Scene {
  return {
    id: generateId(),
    orderIndex,
    imageFileName: null,
    visualDescription: '',
    audioText: '',
    directorNotes: '',
  };
}

function createInitialMetaData(): MetaData {
  return {
    id: generateId(),
    projectName: '',
    participants: '',
    subject: '',
    formatType: 'film',
    date: new Date().toISOString().slice(0, 10),
  };
}

const initialPrePlanning: PrePlanning = {
  logline: '',
  objective: '',
  roles: '',
  resources: '',
};

function renumber(scenes: Scene[]): Scene[] {
  return scenes.map((scene, index) => ({ ...scene, orderIndex: index }));
}

interface StoryboardState {
  metaData: MetaData;
  prePlanning: PrePlanning;
  scenes: Scene[];
  /** true sobald der Nutzer in dieser Sitzung irgendetwas verändert hat —
   *  Guard gegen Überschreiben frischer Eingaben durch den Autosave-Restore. */
  touched: boolean;
  /** Zuletzt gelöschte Szene für Rückgängig-Snackbar. */
  lastDeleted: { scene: Scene; index: number } | null;
  updateMetaData: (patch: Partial<MetaData>) => void;
  updatePrePlanning: (patch: Partial<PrePlanning>) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  addScene: () => void;
  duplicateScene: (id: string) => void;
  deleteScene: (id: string) => void;
  undoDelete: () => void;
  clearLastDeleted: () => void;
  moveScene: (activeId: string, overId: string) => void;
  loadProject: (project: StoryboardProject) => void;
}

export const useStoryboardStore = create<StoryboardState>((set) => ({
  metaData: createInitialMetaData(),
  prePlanning: initialPrePlanning,
  scenes: [],
  touched: false,
  lastDeleted: null,

  updateMetaData: (patch) =>
    set((state) => ({ touched: true, metaData: { ...state.metaData, ...patch } })),

  updatePrePlanning: (patch) =>
    set((state) => ({ touched: true, prePlanning: { ...state.prePlanning, ...patch } })),

  updateScene: (id, patch) =>
    set((state) => ({
      touched: true,
      scenes: state.scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)),
    })),

  addScene: () =>
    set((state) => ({
      touched: true,
      scenes: [...state.scenes, createEmptyScene(state.scenes.length)],
    })),

  duplicateScene: (id) =>
    set((state) => {
      const index = state.scenes.findIndex((scene) => scene.id === id);
      if (index === -1) return state;
      const copy: Scene = { ...state.scenes[index], id: generateId() };
      const scenes = [...state.scenes];
      scenes.splice(index + 1, 0, copy);
      return { touched: true, scenes: renumber(scenes) };
    }),

  deleteScene: (id) =>
    set((state) => {
      const index = state.scenes.findIndex((scene) => scene.id === id);
      if (index === -1) return state;
      return {
        touched: true,
        lastDeleted: { scene: state.scenes[index], index },
        scenes: renumber(state.scenes.filter((scene) => scene.id !== id)),
      };
    }),

  undoDelete: () =>
    set((state) => {
      if (!state.lastDeleted) return state;
      const scenes = [...state.scenes];
      scenes.splice(Math.min(state.lastDeleted.index, scenes.length), 0, state.lastDeleted.scene);
      return { touched: true, lastDeleted: null, scenes: renumber(scenes) };
    }),

  clearLastDeleted: () => set({ lastDeleted: null }),

  moveScene: (activeId, overId) =>
    set((state) => {
      const from = state.scenes.findIndex((scene) => scene.id === activeId);
      const to = state.scenes.findIndex((scene) => scene.id === overId);
      if (from === -1 || to === -1 || from === to) return state;
      const scenes = [...state.scenes];
      const [moved] = scenes.splice(from, 1);
      scenes.splice(to, 0, moved);
      return { touched: true, scenes: renumber(scenes) };
    }),

  loadProject: (project) =>
    set({
      metaData: project.metaData,
      prePlanning: project.prePlanning,
      scenes: renumber([...project.scenes].sort((a, b) => a.orderIndex - b.orderIndex)),
      lastDeleted: null,
    }),
}));

// Serialisiert den aktuellen State als data.json-Struktur (Autosave, Sprint 4: ZIP-Export).
export function selectProject(state: Pick<StoryboardState, 'metaData' | 'prePlanning' | 'scenes'>): StoryboardProject {
  return {
    version: PROJECT_VERSION,
    metaData: state.metaData,
    prePlanning: state.prePlanning,
    scenes: state.scenes,
  };
}

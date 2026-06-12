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

// Lokales Datum, nicht UTC — toISOString() würde nach Mitternacht CET den Vortag liefern.
function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function createInitialMetaData(): MetaData {
  return {
    id: generateId(),
    projectName: '',
    participants: '',
    subject: '',
    formatType: 'film',
    date: todayLocalISO(),
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
  /** Bild-Blobs pro Szene (Key = scene.id). Leben außerhalb der data.json;
   *  Scene.imageFileName wird erst beim ZIP-Export vergeben. */
  images: Record<string, Blob>;
  /** Object URLs zu den Blobs — Lifecycle (create/revoke) liegt komplett in den
   *  Store-Aktionen, damit StrictMode-Remounts keine aktive URL revoken. */
  imageUrls: Record<string, string>;
  /** true sobald der Nutzer in dieser Sitzung irgendetwas verändert hat —
   *  Guard gegen Überschreiben frischer Eingaben durch den Autosave-Restore. */
  touched: boolean;
  /** Zuletzt gelöschte Szene für Rückgängig-Snackbar (inkl. Bild). */
  lastDeleted: { scene: Scene; index: number; image: Blob | null } | null;
  /** Nutzer-Fehlermeldung (z. B. Import fehlgeschlagen) für den Notification-Stack. */
  errorMessage: string | null;
  updateMetaData: (patch: Partial<MetaData>) => void;
  updatePrePlanning: (patch: Partial<PrePlanning>) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  setSceneImage: (id: string, blob: Blob) => void;
  removeSceneImage: (id: string) => void;
  addScene: () => void;
  duplicateScene: (id: string) => void;
  deleteScene: (id: string) => void;
  undoDelete: () => void;
  clearLastDeleted: () => void;
  setErrorMessage: (message: string) => void;
  clearErrorMessage: () => void;
  moveScene: (activeId: string, overId: string) => void;
  loadProject: (project: StoryboardProject, images?: Record<string, Blob>) => void;
}

export const useStoryboardStore = create<StoryboardState>((set) => ({
  metaData: createInitialMetaData(),
  prePlanning: initialPrePlanning,
  scenes: [],
  images: {},
  imageUrls: {},
  touched: false,
  lastDeleted: null,
  errorMessage: null,

  updateMetaData: (patch) =>
    set((state) => ({ touched: true, metaData: { ...state.metaData, ...patch } })),

  updatePrePlanning: (patch) =>
    set((state) => ({ touched: true, prePlanning: { ...state.prePlanning, ...patch } })),

  updateScene: (id, patch) =>
    set((state) => ({
      touched: true,
      scenes: state.scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)),
    })),

  setSceneImage: (id, blob) =>
    set((state) => {
      if (state.imageUrls[id]) URL.revokeObjectURL(state.imageUrls[id]);
      return {
        touched: true,
        images: { ...state.images, [id]: blob },
        imageUrls: { ...state.imageUrls, [id]: URL.createObjectURL(blob) },
      };
    }),

  removeSceneImage: (id) =>
    set((state) => {
      if (!(id in state.images)) return state;
      if (state.imageUrls[id]) URL.revokeObjectURL(state.imageUrls[id]);
      const images = { ...state.images };
      const imageUrls = { ...state.imageUrls };
      delete images[id];
      delete imageUrls[id];
      return { touched: true, images, imageUrls };
    }),

  addScene: () =>
    set((state) => ({
      touched: true,
      scenes: [...state.scenes, createEmptyScene(state.scenes.length)],
    })),

  duplicateScene: (id) =>
    set((state) => {
      const index = state.scenes.findIndex((scene) => scene.id === id);
      if (index === -1) return state;
      const original = state.scenes[index];
      const copy: Scene = {
        ...original,
        id: generateId(),
        // customFields tief kopieren — geteilte Referenz wäre eine latente Falle (v1.1).
        ...(original.customFields ? { customFields: { ...original.customFields } } : {}),
      };
      const scenes = [...state.scenes];
      scenes.splice(index + 1, 0, copy);
      const originalImage = state.images[id];
      return {
        touched: true,
        scenes: renumber(scenes),
        // Blob-Referenz teilen ist ok — Blobs sind immutable. Eigene URL pro Szene.
        ...(originalImage
          ? {
              images: { ...state.images, [copy.id]: originalImage },
              imageUrls: { ...state.imageUrls, [copy.id]: URL.createObjectURL(originalImage) },
            }
          : {}),
      };
    }),

  deleteScene: (id) =>
    set((state) => {
      const index = state.scenes.findIndex((scene) => scene.id === id);
      if (index === -1) return state;
      if (state.imageUrls[id]) URL.revokeObjectURL(state.imageUrls[id]);
      const images = { ...state.images };
      const imageUrls = { ...state.imageUrls };
      delete images[id];
      delete imageUrls[id];
      return {
        touched: true,
        lastDeleted: { scene: state.scenes[index], index, image: state.images[id] ?? null },
        scenes: renumber(state.scenes.filter((scene) => scene.id !== id)),
        images,
        imageUrls,
      };
    }),

  undoDelete: () =>
    set((state) => {
      if (!state.lastDeleted) return state;
      const { scene, index, image } = state.lastDeleted;
      const scenes = [...state.scenes];
      scenes.splice(Math.min(index, scenes.length), 0, scene);
      return {
        touched: true,
        lastDeleted: null,
        scenes: renumber(scenes),
        ...(image
          ? {
              images: { ...state.images, [scene.id]: image },
              imageUrls: { ...state.imageUrls, [scene.id]: URL.createObjectURL(image) },
            }
          : {}),
      };
    }),

  clearLastDeleted: () => set({ lastDeleted: null }),

  // Kein touched: true — Meldungen sind kein Nutzerinhalt.
  setErrorMessage: (message) => set({ errorMessage: message }),

  clearErrorMessage: () => set({ errorMessage: null }),

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

  loadProject: (project, images = {}) =>
    set((state) => {
      Object.values(state.imageUrls).forEach((url) => URL.revokeObjectURL(url));
      const imageUrls: Record<string, string> = {};
      for (const [id, blob] of Object.entries(images)) {
        imageUrls[id] = URL.createObjectURL(blob);
      }
      return {
        metaData: project.metaData,
        prePlanning: project.prePlanning,
        scenes: renumber([...project.scenes].sort((a, b) => a.orderIndex - b.orderIndex)),
        images,
        imageUrls,
        lastDeleted: null,
      };
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

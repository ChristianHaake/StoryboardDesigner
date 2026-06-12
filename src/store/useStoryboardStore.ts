import { create } from 'zustand';
import type {
  CustomFieldDefinition,
  MetaData,
  PrePlanning,
  Scene,
  StoryboardProject,
} from '../types';
import { generateId } from '../utils/idGenerator';
import { MAX_SCENES, PROJECT_VERSION } from '../utils/projectCodec';
import {
  MAX_CUSTOM_FIELDS,
  createCustomFieldDefinition,
  getFormatPreset,
  mergeFormatPreset,
  validateCustomFieldLabel,
} from '../utils/customFields';
import i18n from '../i18n';

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
  fieldDefinitions?: CustomFieldDefinition[];
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
  /** true sobald ein Projekt geladen oder Inhalt verändert wurde. */
  hasContent: boolean;
  /** Zuletzt gelöschte Szene für Rückgängig-Snackbar (inkl. Bild). */
  lastDeleted: { scene: Scene; index: number; image: Blob | null } | null;
  /** Nutzer-Fehlermeldung (z. B. Import fehlgeschlagen) für den Notification-Stack. */
  errorMessage: string | null;
  updateMetaData: (patch: Partial<MetaData>) => void;
  setFormatType: (formatType: MetaData['formatType']) => number;
  updatePrePlanning: (patch: Partial<PrePlanning>) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  updateCustomField: (sceneId: string, fieldKey: string, value: string) => void;
  addCustomField: (label: string) => string | null;
  renameCustomField: (key: string, label: string) => string | null;
  deleteCustomField: (key: string) => void;
  applyCurrentFormatPreset: () => number;
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
  loadProject: (
    project: StoryboardProject,
    images?: Record<string, Blob>,
    markTouched?: boolean,
  ) => void;
}

export const useStoryboardStore = create<StoryboardState>((set) => ({
  metaData: createInitialMetaData(),
  prePlanning: initialPrePlanning,
  fieldDefinitions: getFormatPreset('film'),
  scenes: [],
  images: {},
  imageUrls: {},
  touched: false,
  hasContent: false,
  lastDeleted: null,
  errorMessage: null,

  updateMetaData: (patch) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      metaData: { ...state.metaData, ...patch },
    })),

  setFormatType: (formatType) => {
    let added = 0;
    set((state) => {
      const merged = mergeFormatPreset(state.fieldDefinitions ?? [], formatType);
      added = merged.added;
      return {
        touched: true,
        hasContent: true,
        metaData: { ...state.metaData, formatType },
        fieldDefinitions: merged.definitions.length > 0 ? merged.definitions : undefined,
      };
    });
    return added;
  },

  updatePrePlanning: (patch) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      prePlanning: { ...state.prePlanning, ...patch },
    })),

  updateScene: (id, patch) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      scenes: state.scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)),
    })),

  updateCustomField: (sceneId, fieldKey, value) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      scenes: state.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              customFields: {
                ...(scene.customFields ?? {}),
                [fieldKey]: value,
              },
            }
          : scene,
      ),
    })),

  addCustomField: (label) => {
    let error: string | null = null;
    set((state) => {
      const definitions = state.fieldDefinitions ?? [];
      error = validateCustomFieldLabel(label, definitions);
      if (error) return state;
      if (definitions.length >= MAX_CUSTOM_FIELDS) {
        error = i18n.t('fields.maxFields', { max: MAX_CUSTOM_FIELDS });
        return state;
      }
      return {
        touched: true,
        hasContent: true,
        fieldDefinitions: [...definitions, createCustomFieldDefinition(label)],
      };
    });
    return error;
  },

  renameCustomField: (key, label) => {
    let error: string | null = null;
    set((state) => {
      const definitions = state.fieldDefinitions ?? [];
      if (!definitions.some((definition) => definition.key === key)) {
        error = i18n.t('fields.notFound');
        return state;
      }
      error = validateCustomFieldLabel(label, definitions, key);
      if (error) return state;
      return {
        touched: true,
        hasContent: true,
        fieldDefinitions: definitions.map((definition) =>
          definition.key === key ? { ...definition, label: label.trim() } : definition,
        ),
      };
    });
    return error;
  },

  deleteCustomField: (key) =>
    set((state) => {
      const definitions = state.fieldDefinitions ?? [];
      if (!definitions.some((definition) => definition.key === key)) return state;
      return {
        touched: true,
        hasContent: true,
        fieldDefinitions: definitions.filter((definition) => definition.key !== key),
        scenes: state.scenes.map((scene) => {
          if (!scene.customFields || !(key in scene.customFields)) return scene;
          const customFields = { ...scene.customFields };
          delete customFields[key];
          return {
            ...scene,
            ...(Object.keys(customFields).length > 0
              ? { customFields }
              : { customFields: undefined }),
          };
        }),
      };
    }),

  applyCurrentFormatPreset: () => {
    let added = 0;
    set((state) => {
      const merged = mergeFormatPreset(state.fieldDefinitions ?? [], state.metaData.formatType);
      added = merged.added;
      if (added === 0) return state;
      return {
        touched: true,
        hasContent: true,
        fieldDefinitions: merged.definitions,
      };
    });
    return added;
  },

  setSceneImage: (id, blob) =>
    set((state) => {
      if (state.imageUrls[id]) URL.revokeObjectURL(state.imageUrls[id]);
      return {
        touched: true,
        hasContent: true,
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
      return { touched: true, hasContent: true, images, imageUrls };
    }),

  addScene: () =>
    set((state) =>
      state.scenes.length >= MAX_SCENES
        ? state
        : {
            touched: true,
            hasContent: true,
            scenes: [...state.scenes, createEmptyScene(state.scenes.length)],
          },
    ),

  duplicateScene: (id) =>
    set((state) => {
      if (state.scenes.length >= MAX_SCENES) return state;
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
        hasContent: true,
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
        hasContent: true,
        lastDeleted: { scene: state.scenes[index], index, image: state.images[id] ?? null },
        scenes: renumber(state.scenes.filter((scene) => scene.id !== id)),
        images,
        imageUrls,
      };
    }),

  undoDelete: () =>
    set((state) => {
      if (!state.lastDeleted) return state;
      if (state.scenes.length >= MAX_SCENES) {
        return {
          lastDeleted: null,
          errorMessage: i18n.t('fields.undoLimit', { max: MAX_SCENES }),
        };
      }
      const { scene, index, image } = state.lastDeleted;
      const scenes = [...state.scenes];
      scenes.splice(Math.min(index, scenes.length), 0, scene);
      return {
        touched: true,
        hasContent: true,
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
      return { touched: true, hasContent: true, scenes: renumber(scenes) };
    }),

  loadProject: (project, images = {}, markTouched = false) =>
    set((state) => {
      Object.values(state.imageUrls).forEach((url) => URL.revokeObjectURL(url));
      const imageUrls: Record<string, string> = {};
      for (const [id, blob] of Object.entries(images)) {
        imageUrls[id] = URL.createObjectURL(blob);
      }
      return {
        metaData: project.metaData,
        prePlanning: project.prePlanning,
        fieldDefinitions: project.fieldDefinitions,
        scenes: renumber([...project.scenes].sort((a, b) => a.orderIndex - b.orderIndex)),
        images,
        imageUrls,
        touched: markTouched,
        hasContent: true,
        lastDeleted: null,
      };
    }),
}));

// Serialisiert den aktuellen State als data.json-Struktur (Autosave, Sprint 4: ZIP-Export).
export function selectProject(
  state: Pick<StoryboardState, 'metaData' | 'prePlanning' | 'fieldDefinitions' | 'scenes'>,
): StoryboardProject {
  return {
    version: PROJECT_VERSION,
    metaData: state.metaData,
    prePlanning: state.prePlanning,
    ...(state.fieldDefinitions ? { fieldDefinitions: state.fieldDefinitions } : {}),
    scenes: state.scenes,
  };
}

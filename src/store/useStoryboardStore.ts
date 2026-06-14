import { create } from 'zustand';
import type {
  CustomFieldDefinition,
  CustomFieldType,
  MetaData,
  PrePlanning,
  Scene,
  SceneComment,
  StoryboardProject,
} from '../types';
import { generateId } from '../utils/idGenerator';
import { MAX_SCENES, PROJECT_VERSION } from '../utils/projectCodec';
import {
  MAX_CUSTOM_FIELDS,
  createCustomFieldDefinition,
  getFormatPreset,
  mergeFormatPreset,
  normalizeSelectOptions,
  validateCustomFieldLabel,
  validateSelectOptions,
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

function createInitialMetaData(): MetaData {
  return {
    id: generateId(),
    projectName: '',
    participants: '',
    subject: '',
    formatType: 'film',
    // Kein Vorbelegen mit heute — Nutzer wählt das Projektdatum selbst (#8).
    date: '',
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
  /** Erfolgsmeldung (z. B. Export erfolgreich) für den Notification-Stack. */
  successMessage: string | null;
  /** Feedback-Modus (Lehrkraft-Sicht): blendet die Kommentar-UI je Szene ein.
   *  Reine Ansichtseinstellung, nicht Teil des Projekts/Autosaves. */
  feedbackMode: boolean;
  /** Autosave-Status für den sichtbaren Speicherhinweis (#6a). Reine UI-State,
   *  nicht Teil des Projekts/Autosaves. */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  collapsedScenes: Record<string, boolean>;
  /** Undo/Redo-Verfügbarkeit (#6b). Wird vom History-Manager gespeist. */
  canUndo: boolean;
  canRedo: boolean;
  updateMetaData: (patch: Partial<MetaData>) => void;
  setFormatType: (formatType: MetaData['formatType']) => number;
  updatePrePlanning: (patch: Partial<PrePlanning>) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  updateCustomField: (sceneId: string, fieldKey: string, value: string) => void;
  toggleFeedbackMode: () => void;
  setSaveStatus: (status: StoryboardState['saveStatus']) => void;
  toggleSceneCollapse: (id: string, force?: boolean) => void;
  collapseAllScenes: (collapse: boolean) => void;
  setHistoryFlags: (canUndo: boolean, canRedo: boolean) => void;
  restoreContent: (snapshot: {
    metaData: MetaData;
    prePlanning: PrePlanning;
    fieldDefinitions?: CustomFieldDefinition[];
    scenes: Scene[];
  }) => void;
  addComment: (sceneId: string, text: string) => void;
  toggleCommentDone: (sceneId: string, commentId: string) => void;
  deleteComment: (sceneId: string, commentId: string) => void;
  addCustomField: (
    label: string,
    type?: CustomFieldType,
    options?: string[],
    description?: string,
  ) => string | null;
  renameCustomField: (key: string, label: string, description?: string) => string | null;
  updateCustomFieldOptions: (key: string, options: string[]) => string | null;
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
  setSuccessMessage: (message: string) => void;
  clearSuccessMessage: () => void;
  moveScene: (activeId: string, overId: string) => void;
  resetProject: () => void;
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
  successMessage: null,
  feedbackMode: false,
  saveStatus: 'idle',
  collapsedScenes: {},
  canUndo: false,
  canRedo: false,

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

  toggleFeedbackMode: () => set((state) => ({ feedbackMode: !state.feedbackMode })),

  // Kein touched: true — Speicherstatus ist kein Nutzerinhalt.
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  toggleSceneCollapse: (id, force) =>
    set((state) => ({
      collapsedScenes: {
        ...state.collapsedScenes,
        [id]: force !== undefined ? force : !state.collapsedScenes[id],
      },
    })),

  collapseAllScenes: (collapse) =>
    set((state) => {
      const newCollapsed: Record<string, boolean> = {};
      if (collapse) {
        state.scenes.forEach((scene) => {
          newCollapsed[scene.id] = true;
        });
      }
      return { collapsedScenes: newCollapsed };
    }),

  // Kein touched: true — reine UI-Flags aus dem History-Manager.
  setHistoryFlags: (canUndo, canRedo) => set({ canUndo, canRedo }),

  // Setzt Projektinhalt aus einem History-Schnappschuss (Undo/Redo, #6b).
  // Bilder bleiben unverändert.
  restoreContent: (snapshot) =>
    set({
      touched: true,
      hasContent: true,
      metaData: snapshot.metaData,
      prePlanning: snapshot.prePlanning,
      fieldDefinitions: snapshot.fieldDefinitions,
      scenes: snapshot.scenes,
    }),

  addComment: (sceneId, text) =>
    set((state) => {
      const trimmed = text.trim();
      if (!trimmed) return state;
      const comment: SceneComment = {
        id: generateId(),
        text: trimmed,
        done: false,
        createdAt: new Date().toISOString(),
      };
      return {
        touched: true,
        hasContent: true,
        scenes: state.scenes.map((scene) =>
          scene.id === sceneId
            ? { ...scene, comments: [...(scene.comments ?? []), comment] }
            : scene,
        ),
      };
    }),

  toggleCommentDone: (sceneId, commentId) =>
    set((state) => ({
      touched: true,
      scenes: state.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              comments: (scene.comments ?? []).map((comment) =>
                comment.id === commentId ? { ...comment, done: !comment.done } : comment,
              ),
            }
          : scene,
      ),
    })),

  deleteComment: (sceneId, commentId) =>
    set((state) => ({
      touched: true,
      scenes: state.scenes.map((scene) => {
        if (scene.id !== sceneId) return scene;
        const comments = (scene.comments ?? []).filter((comment) => comment.id !== commentId);
        return comments.length > 0 ? { ...scene, comments } : { ...scene, comments: undefined };
      }),
    })),

  addCustomField: (label, type = 'text', options = [], description?: string) => {
    let error: string | null = null;
    set((state) => {
      const definitions = state.fieldDefinitions ?? [];
      error = validateCustomFieldLabel(label, definitions);
      if (error) return state;
      if (type === 'select') {
        error = validateSelectOptions(options);
        if (error) return state;
      }
      if (definitions.length >= MAX_CUSTOM_FIELDS) {
        error = i18n.t('fields.maxFields', { max: MAX_CUSTOM_FIELDS });
        return state;
      }
      return {
        touched: true,
        hasContent: true,
        fieldDefinitions: [
          ...definitions,
          createCustomFieldDefinition(label, type, options, description),
        ],
      };
    });
    return error;
  },

  renameCustomField: (key, label, description?: string) => {
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
          definition.key === key
            ? {
                ...definition,
                label: label.trim(),
                description: description?.trim(),
              }
            : definition,
        ),
      };
    });
    return error;
  },

  updateCustomFieldOptions: (key, options) => {
    let error: string | null = null;
    set((state) => {
      const definitions = state.fieldDefinitions ?? [];
      const target = definitions.find((definition) => definition.key === key);
      if (!target || target.type !== 'select') {
        error = i18n.t('fields.notFound');
        return state;
      }
      error = validateSelectOptions(options);
      if (error) return state;
      return {
        touched: true,
        hasContent: true,
        fieldDefinitions: definitions.map((definition) =>
          definition.key === key
            ? { ...definition, options: normalizeSelectOptions(options) }
            : definition,
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
        // Feedback gehört zur Originalszene, nicht zur Kopie.
        comments: undefined,
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

  setSuccessMessage: (message) => set({ successMessage: message }),
  clearSuccessMessage: () => set({ successMessage: null }),

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

  resetProject: () =>
    set((state) => {
      // Alle Object-URLs freigeben, bevor der State auf Anfang gesetzt wird.
      Object.values(state.imageUrls).forEach((url) => URL.revokeObjectURL(url));
      return {
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
      };
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

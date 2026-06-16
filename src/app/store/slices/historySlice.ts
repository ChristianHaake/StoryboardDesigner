import type { StoryboardCreator, HistorySlice } from '../types';
import { MAX_SCENES } from '../../../domain/projectCodec';
import { getFormatPreset } from '../../../domain/customFields';
import { createInitialMetaData, initialPrePlanning } from './projectSlice';
import { renumber } from './sceneSlice';
import i18n from '../../../shared/i18n';
import { resetHistory } from '../../../domain/history';

export const createHistorySlice: StoryboardCreator<HistorySlice> = (set) => ({
  touched: false,
  hasContent: false,
  lastDeleted: null,
  canUndo: false,
  canRedo: false,

  setHistoryFlags: (canUndo, canRedo) => set({ canUndo, canRedo }),

  restoreContent: (snapshot) =>
    set({
      touched: true,
      hasContent: true,
      metaData: snapshot.metaData,
      prePlanning: snapshot.prePlanning,
      fieldDefinitions: snapshot.fieldDefinitions,
      scenes: snapshot.scenes,
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

  resetProject: () => {
    // Undo-Stack der Vorgängerprojekts leeren, sonst kann Undo nach „Neu"
    // den alten Projektinhalt zurückholen.
    resetHistory();
    set((state) => {
      Object.values(state.imageUrls).forEach((url) => URL.revokeObjectURL(url));
      return {
        metaData: createInitialMetaData(),
        prePlanning: initialPrePlanning,
        fieldDefinitions: getFormatPreset('shortFilm'),
        scenes: [],
        images: {},
        imageUrls: {},
        touched: false,
        hasContent: false,
        activeStep: 'start',
        isReady: false,
        lastDeleted: null,
        canUndo: false,
        canRedo: false,
        errorMessage: null,
        successMessage: null,
      };
    });
  },

  clearProject: () => {
    resetHistory();
    set((state) => {
      Object.values(state.imageUrls).forEach((url) => URL.revokeObjectURL(url));
      return {
        metaData: createInitialMetaData(),
        prePlanning: initialPrePlanning,
        fieldDefinitions: getFormatPreset('shortFilm'),
        scenes: [],
        images: {},
        imageUrls: {},
        touched: false,
        hasContent: false,
        activeStep: 'start',
        isReady: false,
        lastDeleted: null,
        canUndo: false,
        canRedo: false,
        errorMessage: null,
        successMessage: null,
      };
    });
  },

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
        activeStep: 'editor',
        lastDeleted: null,
      };
    }),
});

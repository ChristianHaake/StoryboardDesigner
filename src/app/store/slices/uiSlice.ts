import type { StoryboardCreator, UiSlice } from '../types';

export const createUiSlice: StoryboardCreator<UiSlice> = (set) => ({
  errorMessage: null,
  successMessage: null,
  feedbackMode: false,
  saveStatus: 'idle',
  activeStep: 'start',
  isReady: false,
  collapsedScenes: {},

  setWizardStep: (step) => set({ activeStep: step }),

  toggleFeedbackMode: () => set((state) => ({ feedbackMode: !state.feedbackMode })),

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

  setErrorMessage: (message) => set({ errorMessage: message }),
  clearErrorMessage: () => set({ errorMessage: null }),

  setSuccessMessage: (message) => set({ successMessage: message }),
  clearSuccessMessage: () => set({ successMessage: null }),
});

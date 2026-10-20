import type { StoryboardCreator, UiSlice } from '../types';

export const createUiSlice: StoryboardCreator<UiSlice> = (set) => ({
  errorMessage: null,
  successMessage: null,
  feedbackMode: false,
  saveStatus: 'idle',
  activeStep: 'start',
  stepNavigation: 'push',
  isReady: false,
  collapsedScenes: {},

  setWizardStep: (step, replaceHistory = false) =>
    set({ activeStep: step, stepNavigation: replaceHistory ? 'replace' : 'push' }),

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

import { create } from 'zustand';
import type { StoryboardState, WizardStep } from './types';
import { createProjectSlice } from './slices/projectSlice';
import { createSceneSlice } from './slices/sceneSlice';
import { createUiSlice } from './slices/uiSlice';
import { createHistorySlice } from './slices/historySlice';
import { PROJECT_VERSION } from '../../domain/projectCodec';
import type { StoryboardProject } from '../../domain/types';

export type { WizardStep };

export const useStoryboardStore = create<StoryboardState>((...args) => ({
  ...createProjectSlice(...args),
  ...createSceneSlice(...args),
  ...createUiSlice(...args),
  ...createHistorySlice(...args),
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

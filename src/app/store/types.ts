import type { StateCreator } from 'zustand';
import type {
  CustomFieldDefinition,
  CustomFieldType,
  MetaData,
  PrePlanning,
  Scene,
  StoryboardProject,
} from '../../domain/types';

export type WizardStep = 'start' | 'setup' | 'editor' | 'review' | 'export';

export interface ProjectSlice {
  metaData: MetaData;
  prePlanning: PrePlanning;
  fieldDefinitions?: CustomFieldDefinition[];
  updateMetaData: (patch: Partial<MetaData>) => void;
  setFormatType: (productType: MetaData['productType']) => number;
  updatePrePlanning: (patch: Partial<PrePlanning>) => void;
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
}

export interface SceneSlice {
  scenes: Scene[];
  images: Record<string, Blob>;
  imageUrls: Record<string, string>;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  updateCustomField: (sceneId: string, fieldKey: string, value: string) => void;
  addComment: (sceneId: string, text: string) => void;
  toggleCommentDone: (sceneId: string, commentId: string) => void;
  deleteComment: (sceneId: string, commentId: string) => void;
  setSceneImage: (id: string, blob: Blob) => void;
  removeSceneImage: (id: string) => void;
  addScene: () => void;
  duplicateScene: (id: string) => void;
  deleteScene: (id: string) => void;
  moveScene: (activeId: string, overId: string) => void;
}

export interface UiSlice {
  errorMessage: string | null;
  successMessage: string | null;
  feedbackMode: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  activeStep: WizardStep;
  isReady: boolean;
  collapsedScenes: Record<string, boolean>;
  setWizardStep: (step: WizardStep) => void;
  toggleFeedbackMode: () => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  toggleSceneCollapse: (id: string, force?: boolean) => void;
  collapseAllScenes: (collapse: boolean) => void;
  setErrorMessage: (message: string) => void;
  clearErrorMessage: () => void;
  setSuccessMessage: (message: string) => void;
  clearSuccessMessage: () => void;
}

export interface HistorySlice {
  touched: boolean;
  hasContent: boolean;
  lastDeleted: { scene: Scene; index: number; image: Blob | null } | null;
  canUndo: boolean;
  canRedo: boolean;
  setHistoryFlags: (canUndo: boolean, canRedo: boolean) => void;
  restoreContent: (snapshot: {
    metaData: MetaData;
    prePlanning: PrePlanning;
    fieldDefinitions?: CustomFieldDefinition[];
    scenes: Scene[];
  }) => void;
  undoDelete: () => void;
  clearLastDeleted: () => void;
  resetProject: () => void;
  clearProject: () => void;
  loadProject: (
    project: StoryboardProject,
    images?: Record<string, Blob>,
    markTouched?: boolean,
  ) => void;
}

export type StoryboardState = ProjectSlice & SceneSlice & UiSlice & HistorySlice;

export type StoryboardCreator<T> = StateCreator<StoryboardState, [], [], T>;

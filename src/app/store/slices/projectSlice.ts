import type { StoryboardCreator, ProjectSlice } from '../types';
import type { MetaData, PrePlanning } from '../../../domain/types';
import { generateId } from '../../../shared/utils/idGenerator';
import {
  MAX_CUSTOM_FIELDS,
  createCustomFieldDefinition,
  getFormatPreset,
  mergeFormatPreset,
  normalizeSelectOptions,
  validateCustomFieldLabel,
  validateSelectOptions,
} from '../../../domain/customFields';
import i18n from '../../../shared/i18n';

export function createInitialMetaData(): MetaData {
  return {
    id: generateId(),
    projectName: '',
    groupMembers: [],
    topic: '',
    complexity: 'standard',
    subject: '',
    productType: 'shortFilm',
    date: '',
  };
}

export const initialPrePlanning: PrePlanning = {
  logline: '',
  objective: '',
  roles: '',
  resources: '',
};

export const createProjectSlice: StoryboardCreator<ProjectSlice> = (set) => ({
  metaData: createInitialMetaData(),
  prePlanning: initialPrePlanning,
  fieldDefinitions: getFormatPreset('shortFilm'),

  updateMetaData: (patch) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      metaData: { ...state.metaData, ...patch },
    })),

  setFormatType: (productType) => {
    let added = 0;
    set((state) => {
      const existingProject = state.hasContent || state.scenes.length > 0;
      const freshPreset = getFormatPreset(productType);
      const nextDefinitions = existingProject
        ? mergeFormatPreset(state.fieldDefinitions ?? [], productType)
        : { definitions: freshPreset, added: freshPreset.length };
      added = nextDefinitions.added;
      return {
        touched: true,
        hasContent: true,
        metaData: { ...state.metaData, productType },
        fieldDefinitions:
          nextDefinitions.definitions.length > 0 ? nextDefinitions.definitions : undefined,
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
      const merged = mergeFormatPreset(state.fieldDefinitions ?? [], state.metaData.productType);
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
});

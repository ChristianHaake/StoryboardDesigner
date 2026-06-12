import type { CustomFieldDefinition, MetaData, Scene, StoryboardProject } from '../types';
import { MAX_CUSTOM_FIELDS, MAX_CUSTOM_FIELD_LABEL_LENGTH } from './customFields';
import { generateId } from './idGenerator';
import i18n from '../i18n';

export const PROJECT_VERSION = '1.1';
export const MAX_SCENES = 200;

export class ProjectValidationError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

const FORMAT_TYPES: MetaData['formatType'][] = ['film', 'fotostory', 'rede', 'custom'];

function validateVersion(value: unknown): string {
  if (typeof value !== 'string') throw new ProjectValidationError(i18n.t('errors.versionMissing'));
  const major = Number.parseInt(value.split('.')[0] ?? '', 10);
  if (!Number.isInteger(major) || major < 1) {
    throw new ProjectValidationError(i18n.t('errors.versionInvalid'));
  }
  if (major > 1) {
    throw new ProjectValidationError(i18n.t('errors.versionTooNew'));
  }
  return PROJECT_VERSION;
}

function validateFieldDefinitions(value: unknown): CustomFieldDefinition[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seenKeys = new Set<string>();
  const seenLabels = new Set<string>();
  const definitions: CustomFieldDefinition[] = [];
  for (const item of value) {
    if (definitions.length >= MAX_CUSTOM_FIELDS) break;
    if (!isRecord(item)) continue;
    const key = str(item.key).trim();
    const label = str(item.label).trim().slice(0, MAX_CUSTOM_FIELD_LABEL_LENGTH);
    const normalizedLabel = label.toLocaleLowerCase('de');
    if (!key || !label || seenKeys.has(key) || seenLabels.has(normalizedLabel)) continue;
    seenKeys.add(key);
    seenLabels.add(normalizedLabel);
    definitions.push({ key, label });
  }
  return definitions.length > 0 ? definitions : undefined;
}

/**
 * Gemeinsamer Decoder für ZIP-Import und IndexedDB-Restore.
 * Normalisiert v1-Daten und verwirft unbekannte Felder kontrolliert.
 */
export function decodeProject(raw: unknown): StoryboardProject {
  if (!isRecord(raw)) throw new ProjectValidationError(i18n.t('errors.invalidFormat'));
  const version = validateVersion(raw.version);
  if (!isRecord(raw.metaData) || !Array.isArray(raw.scenes)) {
    throw new ProjectValidationError(i18n.t('errors.incompleteStructure'));
  }
  if (raw.scenes.length > MAX_SCENES) {
    throw new ProjectValidationError(i18n.t('errors.codecTooManyScenes', { max: MAX_SCENES }));
  }

  const md = raw.metaData;
  const formatType = FORMAT_TYPES.includes(md.formatType as MetaData['formatType'])
    ? (md.formatType as MetaData['formatType'])
    : 'custom';
  const pp = isRecord(raw.prePlanning) ? raw.prePlanning : {};
  const seenIds = new Set<string>();
  const scenes: Scene[] = raw.scenes.map((scene, index) => {
    if (!isRecord(scene)) {
      throw new ProjectValidationError(i18n.t('errors.sceneCorrupt', { n: index + 1 }));
    }
    const customFields = isRecord(scene.customFields)
      ? (Object.fromEntries(
          Object.entries(scene.customFields).filter(
            ([, fieldValue]) => typeof fieldValue === 'string',
          ),
        ) as Record<string, string>)
      : undefined;
    const id =
      typeof scene.id === 'string' && scene.id && !seenIds.has(scene.id) ? scene.id : generateId();
    seenIds.add(id);
    return {
      id,
      orderIndex: typeof scene.orderIndex === 'number' ? scene.orderIndex : index,
      imageFileName: typeof scene.imageFileName === 'string' ? scene.imageFileName : null,
      visualDescription: str(scene.visualDescription),
      audioText: str(scene.audioText),
      directorNotes: str(scene.directorNotes),
      ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
    };
  });

  const fieldDefinitions = validateFieldDefinitions(raw.fieldDefinitions);
  return {
    version,
    metaData: {
      id: str(md.id) || generateId(),
      projectName: str(md.projectName),
      participants: str(md.participants),
      subject: str(md.subject),
      formatType,
      date: str(md.date),
    },
    prePlanning: {
      logline: str(pp.logline),
      objective: str(pp.objective),
      roles: str(pp.roles),
      resources: str(pp.resources),
    },
    ...(fieldDefinitions ? { fieldDefinitions } : {}),
    scenes,
  };
}

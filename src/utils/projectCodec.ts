import type {
  CustomFieldDefinition,
  MetaData,
  Scene,
  SceneComment,
  StoryboardProject,
} from '../types';
import {
  MAX_CUSTOM_FIELDS,
  MAX_CUSTOM_FIELD_LABEL_LENGTH,
  normalizeSelectOptions,
} from './customFields';
import { generateId } from './idGenerator';
import i18n from '../i18n';

export const PROJECT_VERSION = '1.4';
export const MAX_SCENES = 200;
export const MAX_COMMENTS_PER_SCENE = 100;
export const MAX_COMMENT_LENGTH = 2000;

function validateComments(value: unknown): SceneComment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seenIds = new Set<string>();
  const comments: SceneComment[] = [];
  for (const item of value) {
    if (comments.length >= MAX_COMMENTS_PER_SCENE) break;
    if (!isRecord(item)) continue;
    const text = str(item.text).trim().slice(0, MAX_COMMENT_LENGTH);
    if (!text) continue;
    const id =
      typeof item.id === 'string' && item.id && !seenIds.has(item.id) ? item.id : generateId();
    seenIds.add(id);
    comments.push({
      id,
      text,
      done: item.done === true,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    });
  }
  return comments.length > 0 ? comments : undefined;
}

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
    // type 'select' nur mit gültigen Optionen; sonst auf Freitext zurückfallen.
    const options = Array.isArray(item.options)
      ? normalizeSelectOptions(item.options.filter((o): o is string => typeof o === 'string'))
      : [];
    if (item.type === 'select' && options.length > 0) {
      definitions.push({ key, label, type: 'select', options });
    } else {
      definitions.push({ key, label });
    }
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
    const comments = validateComments(scene.comments);
    return {
      id,
      orderIndex: typeof scene.orderIndex === 'number' ? scene.orderIndex : index,
      imageFileName: typeof scene.imageFileName === 'string' ? scene.imageFileName : null,
      visualDescription: str(scene.visualDescription),
      audioText: str(scene.audioText),
      directorNotes: str(scene.directorNotes),
      ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
      ...(comments ? { comments } : {}),
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

import type {
  CustomFieldDefinition,
  MetaData,
  Scene,
  SceneComment,
  StoryboardProject,
} from './types';
import { PRODUCT_TYPES } from './formatConfig';
import {
  MAX_CUSTOM_FIELDS,
  MAX_CUSTOM_FIELD_DESCRIPTION_LENGTH,
  MAX_CUSTOM_FIELD_LABEL_LENGTH,
  isActiveField,
  normalizeSelectOptions,
} from './customFields';
import { generateId } from '../shared/utils/idGenerator';
import i18n from '../shared/i18n';

export const PROJECT_VERSION = '1.5';
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

function imageFileName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('images/')) return null;
  if (value.includes('\\') || value.split('/').includes('..')) return null;
  return value;
}

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

function validateFieldDefinitions(
  value: unknown,
  productType: MetaData['productType'],
): CustomFieldDefinition[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seenKeys = new Set<string>();
  const seenLabels = new Set<string>();
  const definitions: CustomFieldDefinition[] = [];
  let activeCount = 0;
  for (const item of value) {
    if (!isRecord(item)) continue;
    const key = str(item.key).trim();
    // Nur aktive Felder zählen gegen das Limit; ausgeblendete Presets sind endlich und eindeutig.
    const active = isActiveField(key, productType);
    if (active && activeCount >= MAX_CUSTOM_FIELDS) continue;
    const label = str(item.label).trim().slice(0, MAX_CUSTOM_FIELD_LABEL_LENGTH);
    const description = str(item.description).trim().slice(0, MAX_CUSTOM_FIELD_DESCRIPTION_LENGTH);
    const normalizedLabel = label.toLocaleLowerCase('de');
    // Labels nur unter aktiven Feldern eindeutig: Presets verschiedener Formate teilen Labels.
    if (!key || !label || seenKeys.has(key) || (active && seenLabels.has(normalizedLabel)))
      continue;
    seenKeys.add(key);
    if (active) {
      seenLabels.add(normalizedLabel);
      activeCount++;
    }
    // type 'select' nur mit gültigen Optionen; sonst auf Freitext zurückfallen.
    const options = Array.isArray(item.options)
      ? normalizeSelectOptions(item.options.filter((o): o is string => typeof o === 'string'))
      : [];
    if (item.type === 'select' && options.length > 0) {
      definitions.push({
        key,
        label,
        type: 'select',
        options,
        ...(description ? { description } : {}),
      });
    } else {
      definitions.push({ key, label, ...(description ? { description } : {}) });
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
  const productType = PRODUCT_TYPES.includes(md.productType as MetaData['productType'])
    ? (md.productType as MetaData['productType'])
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
    const altText = str(scene.altText);
    const imageFit = scene.imageFit === 'contain' ? 'contain' : 'cover';

    return {
      id,
      orderIndex: typeof scene.orderIndex === 'number' ? scene.orderIndex : index,
      imageFileName: imageFileName(scene.imageFileName),
      action: str(scene.action || scene.directorNotes),
      text: str(scene.text || scene.audioText),
      audio: {
        dialogue: str((scene.audio as Record<string, unknown> | undefined)?.dialogue),
        soundEffects: str((scene.audio as Record<string, unknown> | undefined)?.soundEffects),
        music: str((scene.audio as Record<string, unknown> | undefined)?.music),
      },
      camera: {
        shotSize: str((scene.camera as Record<string, unknown> | undefined)?.shotSize),
        angle: str((scene.camera as Record<string, unknown> | undefined)?.angle),
        movement: str((scene.camera as Record<string, unknown> | undefined)?.movement),
      },
      title: str(scene.title),
      location: str(scene.location),
      materials: Array.isArray(scene.materials) ? scene.materials.map((x) => str(x)) : [],
      imageFit,
      ...(altText ? { altText } : {}),
      ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
      ...(comments ? { comments } : {}),
    };
  });

  const fieldDefinitions = validateFieldDefinitions(raw.fieldDefinitions, productType);
  return {
    version,
    metaData: {
      id: str(md.id) || generateId(),
      projectName: str(md.projectName),
      groupMembers: Array.isArray(md.groupMembers)
        ? md.groupMembers.map((x) => str(x))
        : typeof md.participants === 'string'
          ? [md.participants]
          : [],
      topic: str(md.topic),
      subject: str(md.subject),
      productType,
      complexity:
        typeof md.complexity === 'string' &&
        ['simple', 'standard', 'advanced'].includes(md.complexity)
          ? (md.complexity as import('./types').Complexity)
          : 'standard',
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

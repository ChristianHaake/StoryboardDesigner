import type { CustomFieldDefinition, MetaData } from '../types';
import { generateId } from './idGenerator';
import i18n from '../i18n';

export const MAX_CUSTOM_FIELDS = 20;
export const MAX_CUSTOM_FIELD_LABEL_LENGTH = 60;

// Stabile Keys; Labels werden zur Aufruf-Zeit übersetzt. Bereits in eine
// .storyboard gespeicherte Labels bleiben unverändert (Projektinhalt).
const FORMAT_FIELD_PRESETS: Record<MetaData['formatType'], { key: string; labelKey: string }[]> = {
  film: [
    { key: 'preset:film:shot-size', labelKey: 'presets.filmShotSize' },
    { key: 'preset:film:camera-movement', labelKey: 'presets.filmCameraMovement' },
  ],
  fotostory: [
    { key: 'preset:fotostory:framing', labelKey: 'presets.fotostoryFraming' },
    { key: 'preset:fotostory:caption', labelKey: 'presets.fotostoryCaption' },
  ],
  rede: [
    { key: 'preset:rede:key-message', labelKey: 'presets.redeKeyMessage' },
    { key: 'preset:rede:visualization', labelKey: 'presets.redeVisualization' },
  ],
  custom: [],
};

function normalizedLabel(label: string): string {
  return label.trim().toLocaleLowerCase('de');
}

export function getFormatPreset(formatType: MetaData['formatType']): CustomFieldDefinition[] {
  return FORMAT_FIELD_PRESETS[formatType].map((definition) => ({
    key: definition.key,
    label: i18n.t(definition.labelKey),
  }));
}

export function validateCustomFieldLabel(
  label: string,
  definitions: CustomFieldDefinition[],
  ignoredKey?: string,
): string | null {
  const trimmed = label.trim();
  if (!trimmed) return i18n.t('fields.labelEmpty');
  if (trimmed.length > MAX_CUSTOM_FIELD_LABEL_LENGTH) {
    return i18n.t('fields.labelTooLong', { max: MAX_CUSTOM_FIELD_LABEL_LENGTH });
  }
  const duplicate = definitions.some(
    (definition) =>
      definition.key !== ignoredKey &&
      normalizedLabel(definition.label) === normalizedLabel(trimmed),
  );
  return duplicate ? i18n.t('fields.labelDuplicate') : null;
}

export function createCustomFieldDefinition(label: string): CustomFieldDefinition {
  return {
    key: `custom:${generateId()}`,
    label: label.trim(),
  };
}

export function mergeFormatPreset(
  definitions: CustomFieldDefinition[],
  formatType: MetaData['formatType'],
): { definitions: CustomFieldDefinition[]; added: number } {
  const preset = getFormatPreset(formatType);
  const knownKeys = new Set(definitions.map((definition) => definition.key));
  const knownLabels = new Set(definitions.map((definition) => normalizedLabel(definition.label)));
  const missing = preset.filter(
    (definition) =>
      !knownKeys.has(definition.key) && !knownLabels.has(normalizedLabel(definition.label)),
  );
  const available = Math.max(0, MAX_CUSTOM_FIELDS - definitions.length);
  const additions = missing.slice(0, available);
  return {
    definitions: [...definitions, ...additions],
    added: additions.length,
  };
}

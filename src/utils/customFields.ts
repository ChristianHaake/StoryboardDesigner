import type { CustomFieldDefinition, MetaData } from '../types';
import { generateId } from './idGenerator';

export const MAX_CUSTOM_FIELDS = 20;
export const MAX_CUSTOM_FIELD_LABEL_LENGTH = 60;

const FORMAT_FIELD_PRESETS: Record<MetaData['formatType'], CustomFieldDefinition[]> = {
  film: [
    { key: 'preset:film:shot-size', label: 'Kameraeinstellung' },
    { key: 'preset:film:camera-movement', label: 'Kamerabewegung' },
  ],
  fotostory: [
    { key: 'preset:fotostory:framing', label: 'Bildausschnitt' },
    { key: 'preset:fotostory:caption', label: 'Sprechblase / Text' },
  ],
  rede: [
    { key: 'preset:rede:key-message', label: 'Kernaussage' },
    { key: 'preset:rede:visualization', label: 'Visualisierung' },
  ],
  custom: [],
};

function normalizedLabel(label: string): string {
  return label.trim().toLocaleLowerCase('de');
}

export function getFormatPreset(formatType: MetaData['formatType']): CustomFieldDefinition[] {
  return FORMAT_FIELD_PRESETS[formatType].map((definition) => ({ ...definition }));
}

export function validateCustomFieldLabel(
  label: string,
  definitions: CustomFieldDefinition[],
  ignoredKey?: string,
): string | null {
  const trimmed = label.trim();
  if (!trimmed) return 'Bitte eine Feldbezeichnung eingeben.';
  if (trimmed.length > MAX_CUSTOM_FIELD_LABEL_LENGTH) {
    return `Die Feldbezeichnung darf maximal ${MAX_CUSTOM_FIELD_LABEL_LENGTH} Zeichen lang sein.`;
  }
  const duplicate = definitions.some(
    (definition) =>
      definition.key !== ignoredKey &&
      normalizedLabel(definition.label) === normalizedLabel(trimmed),
  );
  return duplicate ? 'Diese Feldbezeichnung ist bereits vorhanden.' : null;
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

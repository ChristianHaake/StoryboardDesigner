import type { CustomFieldDefinition, CustomFieldType, MetaData } from './types';
import { generateId } from '../shared/utils/idGenerator';
import i18n from '../shared/i18n';

export const MAX_CUSTOM_FIELDS = 20;
export const MAX_CUSTOM_FIELD_LABEL_LENGTH = 60;
export const MAX_SELECT_OPTIONS = 20;
export const MAX_SELECT_OPTION_LENGTH = 40;

interface PresetField {
  key: string;
  labelKey: string;
  type?: CustomFieldType;
  optionKeys?: string[]; // i18n-Keys der Auswahloptionen (nur bei type 'select')
  descriptionKey?: string; // i18n-Key für den Hilfstext
}

// Stabile Keys; Labels und Optionen werden zur Aufruf-Zeit übersetzt. Bereits in
// eine .storyboard gespeicherte Werte bleiben unverändert (Projektinhalt).
const FORMAT_FIELD_PRESETS: Record<MetaData['formatType'], PresetField[]> = {
  film: [
    {
      key: 'preset:film:shot-size',
      labelKey: 'presets.filmShotSize',
      descriptionKey: 'presets.filmShotSizeDesc',
      type: 'select',
      optionKeys: [
        'presets.shotWide',
        'presets.shotFull',
        'presets.shotMedium',
        'presets.shotCloseUp',
        'presets.shotDetail',
        'presets.shotAmerican',
        'presets.shotBird',
        'presets.shotWorm',
      ],
    },
    { key: 'preset:film:camera-movement', labelKey: 'presets.filmCameraMovement' },
    { key: 'preset:film:caption', labelKey: 'presets.caption' },
  ],
  fotostory: [
    { key: 'preset:fotostory:framing', labelKey: 'presets.fotostoryFraming' },
    { key: 'preset:fotostory:caption', labelKey: 'presets.fotostoryCaption' },
  ],
  rede: [
    { key: 'preset:rede:key-message', labelKey: 'presets.redeKeyMessage' },
    { key: 'preset:rede:visualization', labelKey: 'presets.redeVisualization' },
    { key: 'preset:rede:caption', labelKey: 'presets.caption' },
  ],
  custom: [],
};

function normalizedLabel(label: string): string {
  return label.trim().toLocaleLowerCase('de');
}

export function getFormatPreset(formatType: MetaData['formatType']): CustomFieldDefinition[] {
  return FORMAT_FIELD_PRESETS[formatType].map((definition) => {
    const base: CustomFieldDefinition = {
      key: definition.key,
      label: i18n.t(definition.labelKey),
    };
    if (definition.descriptionKey) {
      base.description = i18n.t(definition.descriptionKey);
    }
    if (definition.type === 'select' && definition.optionKeys) {
      base.type = 'select';
      base.options = definition.optionKeys.map((optionKey) => i18n.t(optionKey));
    }
    return base;
  });
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

/** Bereinigt Roh-Optionen: trimmen, leere weg, eindeutig, gekürzt, begrenzt. */
export function normalizeSelectOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of options) {
    const trimmed = raw.trim().slice(0, MAX_SELECT_OPTION_LENGTH);
    if (!trimmed) continue;
    const norm = trimmed.toLocaleLowerCase('de');
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push(trimmed);
    if (result.length >= MAX_SELECT_OPTIONS) break;
  }
  return result;
}

/** Prüft Auswahloptionen für ein Select-Feld. */
export function validateSelectOptions(options: string[]): string | null {
  return normalizeSelectOptions(options).length === 0 ? i18n.t('fields.optionsEmpty') : null;
}

export function createCustomFieldDefinition(
  label: string,
  type: CustomFieldType = 'text',
  options: string[] = [],
  description?: string,
): CustomFieldDefinition {
  const definition: CustomFieldDefinition = {
    key: `custom:${generateId()}`,
    label: label.trim(),
  };
  if (description?.trim()) {
    definition.description = description.trim();
  }
  if (type === 'select') {
    definition.type = 'select';
    definition.options = normalizeSelectOptions(options);
  }
  return definition;
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

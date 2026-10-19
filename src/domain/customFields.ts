import type {
  Complexity,
  CustomFieldDefinition,
  CustomFieldType,
  MetaData,
  ProductType,
} from './types';
import { COMPLEXITY_RANK, FORMAT_SPECS } from './formatConfig';
import { generateId } from '../shared/utils/idGenerator';
import i18n from '../shared/i18n';

export const MAX_CUSTOM_FIELDS = 20;
export const MAX_CUSTOM_FIELD_LABEL_LENGTH = 60;
export const MAX_CUSTOM_FIELD_DESCRIPTION_LENGTH = 100;
export const MAX_SELECT_OPTIONS = 20;
export const MAX_SELECT_OPTION_LENGTH = 40;

// Render-Zeit-Lookup: Key → Mindeststufe. Wird nicht persistiert (Codec verwirft
// Zusatzfelder ohnehin), daher pro Render aus den Preset-Definitionen abgeleitet.
const PRESET_MIN_COMPLEXITY: Record<string, Complexity> = {};
const PRESET_PRODUCT_TYPE: Partial<Record<string, ProductType>> = {};
const RETIRED_PRESETS = new Set<string>();
for (const [productType, spec] of Object.entries(FORMAT_SPECS) as [
  ProductType,
  (typeof FORMAT_SPECS)[ProductType],
][]) {
  for (const field of spec.presets) {
    if (field.minComplexity) PRESET_MIN_COMPLEXITY[field.key] = field.minComplexity;
    PRESET_PRODUCT_TYPE[field.key] = productType;
    if (field.retired) RETIRED_PRESETS.add(field.key);
  }
}

/** Mindest-Detailstufe eines Preset-Feldes; undefined für Nutzerfelder (immer sichtbar). */
export function presetFieldMinComplexity(key: string): Complexity | undefined {
  return PRESET_MIN_COMPLEXITY[key];
}

/** Besitzer eines bekannten Format-Presets; unbekannte/importierte Keys gelten als Nutzerfelder. */
export function presetProductType(key: string): ProductType | undefined {
  return PRESET_PRODUCT_TYPE[key];
}

/** Ehemaliges Preset, dessen Daten erhalten bleiben, das aber nicht mehr gerendert wird. */
export function isRetiredPreset(key: string): boolean {
  return RETIRED_PRESETS.has(key);
}

/** Sichtbarkeit eines Presets im aktuell gewählten Format und Detailgrad. */
export function isPresetVisible(
  key: string,
  activeProductType: ProductType,
  complexity: Complexity,
): boolean {
  if (isRetiredPreset(key)) return false;
  const owner = presetProductType(key);
  if (owner && owner !== activeProductType) return false;
  const minimum = presetFieldMinComplexity(key);
  return !minimum || COMPLEXITY_RANK[complexity] >= COMPLEXITY_RANK[minimum];
}

/**
 * Zählt gegen MAX_CUSTOM_FIELDS und gilt bei Label-Dubletten: Nutzerfelder und
 * Presets des aktiven Formats. Ausgeblendete Presets (anderes Format, retired)
 * bleiben als Daten erhalten, belegen aber weder Platz noch Labelnamen.
 */
export function isActiveField(key: string, activeProductType: ProductType): boolean {
  if (isRetiredPreset(key)) return false;
  const owner = presetProductType(key);
  return !owner || owner === activeProductType;
}

export function countActiveFields(
  definitions: CustomFieldDefinition[],
  activeProductType: ProductType,
): number {
  return definitions.filter((definition) => isActiveField(definition.key, activeProductType))
    .length;
}

function normalizedLabel(label: string): string {
  return label.trim().toLocaleLowerCase('de');
}

export function getFormatPreset(productType: ProductType): CustomFieldDefinition[] {
  const presets = FORMAT_SPECS[productType].presets.filter((definition) => !definition.retired);
  return presets.map((definition) => {
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
  productType: MetaData['productType'],
): { definitions: CustomFieldDefinition[]; added: number } {
  const preset = getFormatPreset(productType);
  const active = definitions.filter((definition) => isActiveField(definition.key, productType));
  const knownKeys = new Set(definitions.map((definition) => definition.key));
  const knownLabels = new Set(active.map((definition) => normalizedLabel(definition.label)));
  const missing = preset.filter(
    (definition) =>
      !knownKeys.has(definition.key) && !knownLabels.has(normalizedLabel(definition.label)),
  );
  const available = Math.max(0, MAX_CUSTOM_FIELDS - active.length);
  const additions = missing.slice(0, available);
  return {
    definitions: [...definitions, ...additions],
    added: additions.length,
  };
}

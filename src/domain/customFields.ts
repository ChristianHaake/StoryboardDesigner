import type {
  Complexity,
  CustomFieldDefinition,
  CustomFieldType,
  MetaData,
  ProductType,
} from './types';
import { generateId } from '../shared/utils/idGenerator';
import i18n from '../shared/i18n';

export const MAX_CUSTOM_FIELDS = 20;
export const MAX_CUSTOM_FIELD_LABEL_LENGTH = 60;
export const MAX_SELECT_OPTIONS = 20;
export const MAX_SELECT_OPTION_LENGTH = 40;

// Rangfolge der Detailstufen; höher = mehr Felder sichtbar.
export const COMPLEXITY_RANK: Record<Complexity, number> = {
  simple: 0,
  standard: 1,
  advanced: 2,
};

interface PresetField {
  key: string;
  labelKey: string;
  type?: CustomFieldType;
  optionKeys?: string[]; // i18n-Keys der Auswahloptionen (nur bei type 'select')
  descriptionKey?: string; // i18n-Key für den Hilfstext
  // Ab welcher Detailstufe das Feld im Editor erscheint. Ohne Angabe: immer.
  // Verhindert, dass Format-Presets die „Einfach"-Stufe überfrachten (#UIX).
  minComplexity?: Complexity;
}

const SHOT_SIZE_OPTION_KEYS = [
  'presets.shotWide',
  'presets.shotFull',
  'presets.shotMedium',
  'presets.shotCloseUp',
  'presets.shotDetail',
  'presets.shotAmerican',
  'presets.shotBird',
  'presets.shotWorm',
];

// Stabile Keys; Labels und Optionen werden zur Aufruf-Zeit übersetzt. Bereits in
// eine .storyboard gespeicherte Werte bleiben unverändert (Projektinhalt).
// Kamera-Presets ersetzen die generischen Einbau-Kamerafelder (FORMAT_FEATURES)
// für diese Formate, damit kein Feld doppelt erscheint.
const FORMAT_FIELD_PRESETS: Partial<Record<ProductType, PresetField[]>> = {
  shortFilm: [
    {
      key: 'preset:shortFilm:shot-size',
      labelKey: 'presets.filmShotSize',
      descriptionKey: 'presets.filmShotSizeDesc',
      type: 'select',
      optionKeys: SHOT_SIZE_OPTION_KEYS,
      minComplexity: 'advanced',
    },
    {
      key: 'preset:shortFilm:camera-movement',
      labelKey: 'presets.filmCameraMovement',
      minComplexity: 'advanced',
    },
    { key: 'preset:shortFilm:caption', labelKey: 'presets.caption', minComplexity: 'standard' },
  ],
  fotostory: [
    {
      key: 'preset:fotostory:framing',
      labelKey: 'presets.fotostoryFraming',
      minComplexity: 'standard',
    },
    {
      key: 'preset:fotostory:caption',
      labelKey: 'presets.fotostoryCaption',
      minComplexity: 'standard',
    },
  ],
  comic: [
    { key: 'preset:comic:framing', labelKey: 'presets.fotostoryFraming', minComplexity: 'standard' },
    { key: 'preset:comic:caption', labelKey: 'presets.fotostoryCaption', minComplexity: 'standard' },
  ],
  stopMotion: [
    {
      key: 'preset:stopMotion:frames',
      labelKey: 'presets.stopMotionFrames',
      descriptionKey: 'presets.stopMotionFramesDesc',
      minComplexity: 'standard',
    },
    {
      key: 'preset:stopMotion:shot-size',
      labelKey: 'presets.filmShotSize',
      descriptionKey: 'presets.filmShotSizeDesc',
      type: 'select',
      optionKeys: SHOT_SIZE_OPTION_KEYS,
      minComplexity: 'advanced',
    },
  ],
  socialMediaClip: [
    {
      key: 'preset:socialMediaClip:hook',
      labelKey: 'presets.socialHook',
      descriptionKey: 'presets.socialHookDesc',
      minComplexity: 'standard',
    },
    {
      key: 'preset:socialMediaClip:format',
      labelKey: 'presets.socialFormat',
      type: 'select',
      optionKeys: [
        'presets.socialFormatPortrait',
        'presets.socialFormatLandscape',
        'presets.socialFormatSquare',
      ],
      minComplexity: 'standard',
    },
    { key: 'preset:socialMediaClip:caption', labelKey: 'presets.caption', minComplexity: 'standard' },
  ],
  custom: [],
};

// Render-Zeit-Lookup: Key → Mindeststufe. Wird nicht persistiert (Codec verwirft
// Zusatzfelder ohnehin), daher pro Render aus den Preset-Definitionen abgeleitet.
const PRESET_MIN_COMPLEXITY: Record<string, Complexity> = {};
for (const preset of Object.values(FORMAT_FIELD_PRESETS)) {
  for (const field of preset ?? []) {
    if (field.minComplexity) PRESET_MIN_COMPLEXITY[field.key] = field.minComplexity;
  }
}

/** Mindest-Detailstufe eines Preset-Feldes; undefined für Nutzerfelder (immer sichtbar). */
export function presetFieldMinComplexity(key: string): Complexity | undefined {
  return PRESET_MIN_COMPLEXITY[key];
}

function normalizedLabel(label: string): string {
  return label.trim().toLocaleLowerCase('de');
}

export function getFormatPreset(productType: ProductType): CustomFieldDefinition[] {
  const presets = FORMAT_FIELD_PRESETS[productType] || [];
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

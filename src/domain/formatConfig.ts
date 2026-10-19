import type { Complexity, CustomFieldType, ProductType } from './types';
import type de from '../shared/i18n/de';

// Einzige Quelle der Wahrheit für die Feld-Zuordnung pro Format: Bildfeld,
// Beschriftungen der Kernfelder, eingebaute Detailfelder (mit Mindeststufe) und
// Format-Presets. Editor, Präsentation, Prüfung und Vorlagen lesen nur hier.

export type SceneDetailField =
  | 'soundEffects'
  | 'location'
  | 'cameraSize'
  | 'cameraMovement'
  | 'materials';

type SceneKey = keyof typeof de.scene;

export interface PresetField {
  key: string;
  labelKey: string;
  type?: CustomFieldType;
  optionKeys?: string[]; // i18n-Keys der Auswahloptionen (nur bei type 'select')
  descriptionKey?: string; // i18n-Key für den Hilfstext
  retired?: boolean; // Legacy-Feld: Daten bleiben erhalten, UI bietet es nicht mehr an.
  // Ab welcher Detailstufe das Feld im Editor erscheint. Ohne Angabe: immer.
  // Verhindert, dass Format-Presets die „Einfach"-Stufe überfrachten (#UIX).
  minComplexity?: Complexity;
}

export interface FormatSpec {
  hasImage: boolean; // false = reine Audioformate (kein Bild/Szene-Bezug)
  actionLabel: SceneKey;
  actionPlaceholder: SceneKey;
  textLabel: SceneKey;
  detailFields: Partial<Record<SceneDetailField, Complexity>>;
  // Stabile Keys; Labels und Optionen werden zur Aufruf-Zeit übersetzt. Bereits in
  // eine .storyboard gespeicherte Werte bleiben unverändert (Projektinhalt).
  // Kamera-Presets ersetzen die generischen Einbau-Kamerafelder für diese Formate,
  // damit kein Feld doppelt erscheint.
  presets: PresetField[];
}

const VISUAL = {
  hasImage: true,
  actionLabel: 'actionLabelVisual',
  actionPlaceholder: 'actionPlaceholderVisual',
} as const;

const AUDIO = {
  hasImage: false,
  actionLabel: 'actionLabel',
  actionPlaceholder: 'actionPlaceholder',
} as const;

const SHOT_SIZE_OPTION_KEYS = [
  'presets.shotWide',
  'presets.shotFull',
  'presets.shotMedium',
  'presets.shotCloseUp',
  'presets.shotDetail',
  'presets.shotAmerican',
];

export const FORMAT_SPECS: Record<ProductType, FormatSpec> = {
  shortFilm: {
    ...VISUAL,
    textLabel: 'speechLabel',
    detailFields: {
      soundEffects: 'standard',
      location: 'standard',
      materials: 'advanced',
    },
    presets: [
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
        descriptionKey: 'presets.filmCameraMovementDesc',
        minComplexity: 'advanced',
      },
      {
        key: 'preset:shortFilm:caption',
        labelKey: 'presets.caption',
        descriptionKey: 'presets.captionDesc',
        minComplexity: 'standard',
        retired: true,
      },
    ],
  },
  explainerVideo: {
    ...VISUAL,
    textLabel: 'voiceoverLabel',
    detailFields: {
      soundEffects: 'standard',
      materials: 'advanced',
    },
    presets: [],
  },
  socialMediaClip: {
    ...VISUAL,
    textLabel: 'socialTextLabel',
    detailFields: {
      soundEffects: 'standard',
      location: 'advanced',
      cameraSize: 'advanced',
      cameraMovement: 'advanced',
      materials: 'advanced',
    },
    presets: [
      {
        key: 'preset:socialMediaClip:hook',
        labelKey: 'presets.socialHook',
        descriptionKey: 'presets.socialHookDesc',
        minComplexity: 'standard',
      },
      {
        key: 'preset:socialMediaClip:format',
        labelKey: 'presets.socialFormat',
        descriptionKey: 'presets.socialFormatDesc',
        type: 'select',
        optionKeys: [
          'presets.socialFormatPortrait',
          'presets.socialFormatLandscape',
          'presets.socialFormatSquare',
        ],
        minComplexity: 'standard',
      },
      {
        key: 'preset:socialMediaClip:caption',
        labelKey: 'presets.caption',
        descriptionKey: 'presets.captionDesc',
        minComplexity: 'standard',
        retired: true,
      },
    ],
  },
  stopMotion: {
    ...VISUAL,
    textLabel: 'optionalAudioTextLabel',
    detailFields: {
      soundEffects: 'standard',
      location: 'advanced',
      materials: 'advanced',
    },
    presets: [
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
  },
  custom: {
    ...VISUAL,
    textLabel: 'speechLabel',
    detailFields: {
      soundEffects: 'standard',
      location: 'advanced',
      cameraSize: 'advanced',
      cameraMovement: 'advanced',
      materials: 'advanced',
    },
    presets: [],
  },
  fotostory: {
    ...VISUAL,
    textLabel: 'bubbleTextLabel',
    detailFields: {
      location: 'standard',
      materials: 'advanced',
    },
    presets: [
      {
        key: 'preset:fotostory:framing',
        labelKey: 'presets.fotostoryFraming',
        descriptionKey: 'presets.fotostoryFramingDesc',
        minComplexity: 'standard',
      },
      {
        key: 'preset:fotostory:caption',
        labelKey: 'presets.fotostoryCaption',
        descriptionKey: 'presets.fotostoryCaptionDesc',
        minComplexity: 'standard',
        retired: true,
      },
    ],
  },
  comic: {
    ...VISUAL,
    textLabel: 'bubbleTextLabel',
    detailFields: {
      location: 'standard',
      materials: 'advanced',
    },
    presets: [
      {
        key: 'preset:comic:framing',
        labelKey: 'presets.fotostoryFraming',
        descriptionKey: 'presets.fotostoryFramingDesc',
        minComplexity: 'standard',
      },
      {
        key: 'preset:comic:caption',
        labelKey: 'presets.fotostoryCaption',
        descriptionKey: 'presets.fotostoryCaptionDesc',
        minComplexity: 'standard',
        retired: true,
      },
    ],
  },
  podcast: {
    ...AUDIO,
    actionLabel: 'actionLabelTopic',
    actionPlaceholder: 'actionPlaceholderTopic',
    textLabel: 'podcastTextLabel',
    detailFields: {
      soundEffects: 'standard',
      materials: 'advanced',
    },
    presets: [],
  },
  audioPlay: {
    ...AUDIO,
    textLabel: 'spokenDialogueLabel',
    detailFields: {
      soundEffects: 'simple',
      materials: 'advanced',
    },
    presets: [],
  },
  roleplay: {
    ...VISUAL,
    textLabel: 'spokenDialogueLabel',
    detailFields: {
      soundEffects: 'standard',
      location: 'standard',
      materials: 'standard',
    },
    presets: [],
  },
};

export const PRODUCT_TYPES = Object.keys(FORMAT_SPECS) as ProductType[];

// Rangfolge der Detailstufen; höher = mehr Felder sichtbar.
export const COMPLEXITY_RANK: Record<Complexity, number> = {
  simple: 0,
  standard: 1,
  advanced: 2,
};

export function isSceneDetailFieldVisible(
  productType: ProductType,
  complexity: Complexity,
  field: SceneDetailField,
): boolean {
  const minimum = FORMAT_SPECS[productType].detailFields[field];
  return minimum !== undefined && COMPLEXITY_RANK[complexity] >= COMPLEXITY_RANK[minimum];
}

export function getVisibleSceneDetailFields(
  productType: ProductType,
  complexity: Complexity,
): SceneDetailField[] {
  return (Object.keys(FORMAT_SPECS[productType].detailFields) as SceneDetailField[]).filter(
    (field) => isSceneDetailFieldVisible(productType, complexity, field),
  );
}

/** Sichtbarkeit aller eingebauten Detailfelder auf einmal (Editor, Präsentation, Prüfung). */
export function getSceneDetailVisibility(
  productType: ProductType,
  complexity: Complexity,
): Record<SceneDetailField, boolean> {
  const visible = new Set(getVisibleSceneDetailFields(productType, complexity));
  return {
    soundEffects: visible.has('soundEffects'),
    location: visible.has('location'),
    cameraSize: visible.has('cameraSize'),
    cameraMovement: visible.has('cameraMovement'),
    materials: visible.has('materials'),
  };
}

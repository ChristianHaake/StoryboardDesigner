import type { Complexity, ProductType } from './types';

export type SceneDetailField =
  | 'soundEffects'
  | 'location'
  | 'cameraSize'
  | 'cameraMovement'
  | 'materials';

export interface FormatFeatures {
  hasImage: boolean;
  detailFields: Partial<Record<SceneDetailField, Complexity>>;
}

export const FORMAT_FEATURES: Record<ProductType, FormatFeatures> = {
  shortFilm: {
    hasImage: true,
    detailFields: {
      soundEffects: 'standard',
      location: 'standard',
      materials: 'advanced',
    },
  },
  explainerVideo: {
    hasImage: true,
    detailFields: {
      soundEffects: 'standard',
      materials: 'advanced',
    },
  },
  socialMediaClip: {
    hasImage: true,
    detailFields: {
      soundEffects: 'standard',
      location: 'advanced',
      cameraSize: 'advanced',
      cameraMovement: 'advanced',
      materials: 'advanced',
    },
  },
  stopMotion: {
    hasImage: true,
    detailFields: {
      soundEffects: 'standard',
      location: 'advanced',
      materials: 'advanced',
    },
  },
  custom: {
    hasImage: true,
    detailFields: {
      soundEffects: 'standard',
      location: 'advanced',
      cameraSize: 'advanced',
      cameraMovement: 'advanced',
      materials: 'advanced',
    },
  },

  fotostory: {
    hasImage: true,
    detailFields: {
      location: 'standard',
      materials: 'advanced',
    },
  },
  comic: {
    hasImage: true,
    detailFields: {
      location: 'standard',
      materials: 'advanced',
    },
  },

  podcast: {
    hasImage: false,
    detailFields: {
      soundEffects: 'standard',
      materials: 'advanced',
    },
  },
  audioPlay: {
    hasImage: false,
    detailFields: {
      soundEffects: 'simple',
      materials: 'advanced',
    },
  },

  roleplay: {
    hasImage: true,
    detailFields: {
      soundEffects: 'standard',
      location: 'standard',
      materials: 'standard',
    },
  },
};

const COMPLEXITY_RANK: Record<Complexity, number> = {
  simple: 0,
  standard: 1,
  advanced: 2,
};

export function isSceneDetailFieldVisible(
  productType: ProductType,
  complexity: Complexity,
  field: SceneDetailField,
): boolean {
  const minimum = FORMAT_FEATURES[productType].detailFields[field];
  return minimum !== undefined && COMPLEXITY_RANK[complexity] >= COMPLEXITY_RANK[minimum];
}

export function getVisibleSceneDetailFields(
  productType: ProductType,
  complexity: Complexity,
): SceneDetailField[] {
  return (Object.keys(FORMAT_FEATURES[productType].detailFields) as SceneDetailField[]).filter(
    (field) => isSceneDetailFieldVisible(productType, complexity, field),
  );
}

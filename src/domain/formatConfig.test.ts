import { describe, expect, it } from 'vitest';
import type { Complexity, ProductType } from './types';
import {
  FORMAT_SPECS,
  PRODUCT_TYPES,
  getSceneDetailVisibility,
  getVisibleSceneDetailFields,
} from './formatConfig';
import { getFormatPreset, isPresetVisible } from './customFields';

const TYPES: ProductType[] = [
  'shortFilm',
  'explainerVideo',
  'fotostory',
  'audioPlay',
  'podcast',
  'stopMotion',
  'comic',
  'socialMediaClip',
  'roleplay',
  'custom',
];

const EXPECTED = {
  simple: {
    shortFilm: [],
    explainerVideo: [],
    fotostory: [],
    audioPlay: ['soundEffects'],
    podcast: [],
    stopMotion: [],
    comic: [],
    socialMediaClip: [],
    roleplay: [],
    custom: [],
  },
  standard: {
    shortFilm: ['soundEffects', 'location'],
    explainerVideo: ['soundEffects'],
    fotostory: ['location'],
    audioPlay: ['soundEffects'],
    podcast: ['soundEffects'],
    stopMotion: ['soundEffects'],
    comic: ['location'],
    socialMediaClip: ['soundEffects'],
    roleplay: ['soundEffects', 'location', 'materials'],
    custom: ['soundEffects'],
  },
  advanced: {
    shortFilm: ['soundEffects', 'location', 'materials'],
    explainerVideo: ['soundEffects', 'materials'],
    fotostory: ['location', 'materials'],
    audioPlay: ['soundEffects', 'materials'],
    podcast: ['soundEffects', 'materials'],
    stopMotion: ['soundEffects', 'location', 'materials'],
    comic: ['location', 'materials'],
    socialMediaClip: ['soundEffects', 'location', 'cameraSize', 'cameraMovement', 'materials'],
    roleplay: ['soundEffects', 'location', 'materials'],
    custom: ['soundEffects', 'location', 'cameraSize', 'cameraMovement', 'materials'],
  },
} as const satisfies Record<Complexity, Record<ProductType, readonly string[]>>;

const EXPECTED_VISIBLE_FIELD_COUNTS = {
  simple: {
    shortFilm: 0,
    explainerVideo: 0,
    fotostory: 0,
    audioPlay: 1,
    podcast: 0,
    stopMotion: 0,
    comic: 0,
    socialMediaClip: 0,
    roleplay: 0,
    custom: 0,
  },
  standard: {
    shortFilm: 2,
    explainerVideo: 1,
    fotostory: 2,
    audioPlay: 1,
    podcast: 1,
    stopMotion: 2,
    comic: 2,
    socialMediaClip: 3,
    roleplay: 3,
    custom: 1,
  },
  advanced: {
    shortFilm: 5,
    explainerVideo: 2,
    fotostory: 3,
    audioPlay: 2,
    podcast: 2,
    stopMotion: 5,
    comic: 3,
    socialMediaClip: 7,
    roleplay: 3,
    custom: 5,
  },
} as const satisfies Record<Complexity, Record<ProductType, number>>;

describe('formatConfig', () => {
  for (const complexity of ['simple', 'standard', 'advanced'] as const) {
    it(`defines the exact ${complexity} detail-field matrix for every format`, () => {
      for (const productType of TYPES) {
        expect(getVisibleSceneDetailFields(productType, complexity)).toEqual(
          EXPECTED[complexity][productType],
        );
      }
    });

    it(`keeps the combined ${complexity} core and preset field count bounded`, () => {
      for (const productType of TYPES) {
        const visiblePresetCount = getFormatPreset(productType).filter((definition) =>
          isPresetVisible(definition.key, productType, complexity),
        ).length;
        expect(
          getVisibleSceneDetailFields(productType, complexity).length + visiblePresetCount,
        ).toBe(EXPECTED_VISIBLE_FIELD_COUNTS[complexity][productType]);
      }
    });
  }

  it('covers exactly the known product types', () => {
    expect([...PRODUCT_TYPES].sort()).toEqual([...TYPES].sort());
  });

  it('namespaces preset keys by owner format and keeps them unique', () => {
    const seen = new Set<string>();
    for (const productType of PRODUCT_TYPES) {
      for (const preset of FORMAT_SPECS[productType].presets) {
        expect(preset.key.startsWith(`preset:${productType}:`), preset.key).toBe(true);
        expect(seen.has(preset.key), preset.key).toBe(false);
        seen.add(preset.key);
      }
    }
  });

  it('derives the detail visibility map from the same rules as the visible list', () => {
    for (const complexity of ['simple', 'standard', 'advanced'] as const) {
      for (const productType of PRODUCT_TYPES) {
        const visible = getVisibleSceneDetailFields(productType, complexity);
        const map = getSceneDetailVisibility(productType, complexity);
        expect(
          Object.keys(map)
            .filter((key) => map[key as keyof typeof map])
            .sort(),
        ).toEqual([...visible].sort());
      }
    }
  });
});

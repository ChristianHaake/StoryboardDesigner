import { describe, expect, it } from 'vitest';
import { getSceneStatus, hasNoEmptyScenes } from './sceneStatus';
import type { Scene } from './types';

function scene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 's1',
    orderIndex: 0,
    imageFileName: null,
    title: '',
    action: '',
    text: '',
    audio: { dialogue: '', soundEffects: '', music: '' },
    camera: { shotSize: '', angle: '', movement: '' },
    location: '',
    materials: [],
    ...overrides,
  };
}

const film = { productType: 'shortFilm', complexity: 'simple' } as const;
const podcast = { productType: 'podcast', complexity: 'simple' } as const;

describe('getSceneStatus', () => {
  it('is empty without content and image', () => {
    expect(getSceneStatus(scene(), false, film)).toBe('empty');
  });

  it('needs text and image for complete in image formats', () => {
    expect(getSceneStatus(scene({ action: 'Auftritt' }), false, film)).toBe('partial');
    expect(getSceneStatus(scene(), true, film)).toBe('partial');
    expect(getSceneStatus(scene({ action: 'Auftritt' }), true, film)).toBe('complete');
  });

  it('does not require an image in audio formats', () => {
    expect(getSceneStatus(scene({ text: 'Hallo' }), false, podcast)).toBe('complete');
  });

  it('ignores fields hidden at the current detail level', () => {
    expect(getSceneStatus(scene({ location: 'Park' }), false, film)).toBe('empty');
    expect(
      getSceneStatus(scene({ location: 'Park' }), false, { ...film, complexity: 'standard' }),
    ).toBe('partial');
  });

  it('counts visible custom field values', () => {
    const fieldDefinitions = [{ key: 'custom:a', label: 'A' }];
    expect(
      getSceneStatus(scene({ customFields: { 'custom:a': 'x' } }), false, {
        ...film,
        fieldDefinitions,
      }),
    ).toBe('partial');
  });
});

describe('hasNoEmptyScenes', () => {
  it('is false for no scenes and for any empty scene', () => {
    expect(hasNoEmptyScenes([], {}, film)).toBe(false);
    const filled = scene({ id: 'a', action: 'x' });
    const empty = scene({ id: 'b' });
    expect(hasNoEmptyScenes([filled, empty], {}, film)).toBe(false);
    expect(hasNoEmptyScenes([filled], {}, film)).toBe(true);
  });
});

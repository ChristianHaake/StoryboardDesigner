import { strToU8, zipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';
import type { StoryboardProject } from '../../domain/types';
import { exportProject, importProject } from './zipHandler';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const TINY_PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z8BQDwAFgwJ/lwHkJQAAAABJRU5ErkJggg==',
  ),
  (char) => char.charCodeAt(0),
);

function patchCentralUncompressedSizes(
  archive: Uint8Array,
  sizes: Record<string, number>,
): Uint8Array {
  const patched = new Uint8Array(archive);
  const view = new DataView(patched.buffer, patched.byteOffset, patched.byteLength);
  const decoder = new TextDecoder();
  const minimumEocdSize = 22;
  const start = Math.max(0, patched.length - 65_557);
  let eocd = -1;

  for (let offset = patched.length - minimumEocdSize; offset >= start; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error('EOCD not found');

  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);

  for (let index = 0; index < entryCount; index++) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('central directory entry not found');
    }

    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const name = decoder.decode(patched.subarray(offset + 46, offset + 46 + nameLength));
    if (name in sizes) {
      view.setUint32(offset + 24, sizes[name], true);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return patched;
}

function project(): StoryboardProject {
  return {
    version: '1.1',
    metaData: {
      id: 'project-1',
      projectName: 'Test',
      groupMembers: [],
      topic: '',
      complexity: 'standard',
      subject: '',
      productType: 'shortFilm',
      date: '2026-06-12',
    },
    prePlanning: { logline: '', objective: '', roles: '', resources: '' },
    scenes: [],
  };
}

function sceneWithImage(id: string, imageFileName: string) {
  return {
    id,
    orderIndex: 0,
    imageFileName,

    title: '',
    action: '',
    text: '',
    audio: { dialogue: '', soundEffects: '', music: '' },
    camera: { shotSize: '', angle: '', movement: '' },
    location: '',
    materials: [],
  };
}

describe('zipHandler', () => {
  it('rejects oversized images before export', async () => {
    const scene = {
      id: 'scene-1',
      orderIndex: 0,
      imageFileName: null,

      title: '',
      action: '',
      text: '',
      audio: { dialogue: '', soundEffects: '', music: '' },
      camera: { shotSize: '', angle: '', movement: '' },
      location: '',
      materials: [],
    };
    const data = project();
    data.scenes = [scene];

    await expect(
      exportProject(data, { [scene.id]: new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]) }),
    ).rejects.toThrow('Ein Bild ist zu groß');
  });

  it('rejects oversized project data before export', async () => {
    const data = project();
    data.metaData.projectName = 'x'.repeat(5 * 1024 * 1024);

    await expect(exportProject(data, {})).rejects.toThrow('Projektdaten sind zu groß');
  });

  it('loads a shared image path once and assigns the blob to both scenes', async () => {
    const data = project();
    data.scenes = ['scene-1', 'scene-2'].map((id, orderIndex) => ({
      id,
      orderIndex,
      imageFileName: 'images/shared.png',

      title: '',
      action: '',
      text: '',
      audio: { dialogue: '', soundEffects: '', music: '' },
      camera: { shotSize: '', angle: '', movement: '' },
      location: '',
      materials: [],
    }));

    const archive = zipSync({
      'data.json': strToU8(JSON.stringify(data)),
      'images/shared.png': TINY_PNG,
    });

    const imported = await importProject(new Blob([archive]));
    expect(imported.images['scene-1']).toBe(imported.images['scene-2']);
    expect(imported.images['scene-1']?.size).toBe(TINY_PNG.byteLength);
  });

  it('round-trips v1.1 field definitions and dynamic values', async () => {
    const data = project();
    data.fieldDefinitions = [{ key: 'custom:light', label: 'Licht' }];
    data.scenes = [
      {
        id: 'scene-1',
        orderIndex: 0,
        imageFileName: null,

        title: '',
        action: '',
        text: '',
        audio: { dialogue: '', soundEffects: '', music: '' },
        camera: { shotSize: '', angle: '', movement: '' },
        location: '',
        materials: [],

        customFields: { 'custom:light': 'Warm' },
      },
    ];

    const archive = zipSync({
      'data.json': strToU8(JSON.stringify(data)),
    });

    const imported = await importProject(new Blob([archive]));
    expect(imported.project.version).toBe('1.5');
    expect(imported.project.fieldDefinitions).toEqual(data.fieldDefinitions);
    expect(imported.project.scenes[0]?.customFields).toEqual({ 'custom:light': 'Warm' });
  });

  it('rejects oversized images during import', async () => {
    const data = project();
    data.scenes = [
      {
        id: 'scene-1',
        orderIndex: 0,
        imageFileName: 'images/large.jpg',

        title: '',
        action: '',
        text: '',
        audio: { dialogue: '', soundEffects: '', music: '' },
        camera: { shotSize: '', angle: '', movement: '' },
        location: '',
        materials: [],
      },
    ];

    const archive = zipSync(
      {
        'data.json': strToU8(JSON.stringify(data)),
        'images/large.jpg': new Uint8Array(10 * 1024 * 1024 + 1),
      },
      { level: 0 },
    ); // level 0 for speed in tests when using large files

    await expect(importProject(new Blob([archive]))).rejects.toThrow(
      'Bilder überschreiten das erlaubte Limit',
    );
  });

  it('rejects aggregate inflated image size before unzipping', async () => {
    const data = project();
    const imageNames = Array.from({ length: 11 }, (_, index) => `images/${index}.png`);
    data.scenes = imageNames.map((imageFileName, orderIndex) => ({
      id: `scene-${orderIndex}`,
      orderIndex,
      imageFileName,

      title: '',
      action: '',
      text: '',
      audio: { dialogue: '', soundEffects: '', music: '' },
      camera: { shotSize: '', angle: '', movement: '' },
      location: '',
      materials: [],
    }));

    const archive = zipSync(
      Object.fromEntries([
        ['data.json', strToU8(JSON.stringify(data))],
        ...imageNames.map((name) => [name, TINY_PNG] as const),
      ]),
    );
    const patchedArchive = patchCentralUncompressedSizes(
      archive,
      Object.fromEntries(imageNames.map((name) => [name, 10 * 1024 * 1024])),
    );

    const patchedBuffer = new ArrayBuffer(patchedArchive.byteLength);
    new Uint8Array(patchedBuffer).set(patchedArchive);

    await expect(importProject(new Blob([patchedBuffer]))).rejects.toThrow(
      'Bilder überschreiten das erlaubte Limit',
    );
  });

  it('rejects unsafe archive entry names', async () => {
    const data = project();
    const archive = zipSync({
      'data.json': strToU8(JSON.stringify(data)),
      'images/../evil.png': TINY_PNG,
    });

    await expect(importProject(new Blob([archive]))).rejects.toThrow(
      'Das ist keine gültige .storyboard-Datei',
    );
  });

  it('rejects invalid image signatures during import', async () => {
    const data = project();
    data.scenes = [sceneWithImage('scene-1', 'images/invalid.png')];
    const archive = zipSync({
      'data.json': strToU8(JSON.stringify(data)),
      'images/invalid.png': strToU8('not an image'),
    });

    await expect(importProject(new Blob([archive]))).rejects.toThrow(
      'Bilddatei ist ungültig oder nicht lesbar',
    );
  });

  it('rejects decoded image pixel dimensions above the import limit', async () => {
    const data = project();
    data.scenes = [sceneWithImage('scene-1', 'images/huge.png')];
    const hugePng = new Uint8Array(TINY_PNG);
    const view = new DataView(hugePng.buffer, hugePng.byteOffset, hugePng.byteLength);
    view.setUint32(16, 100_000, false);
    view.setUint32(20, 100_000, false);
    const archive = zipSync({
      'data.json': strToU8(JSON.stringify(data)),
      'images/huge.png': hugePng,
    });

    await expect(importProject(new Blob([archive]))).rejects.toThrow(
      'Bild ist zu groß in Pixeln',
    );
  });
});

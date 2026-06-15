import { strToU8, zipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';
import type { StoryboardProject } from '../../domain/types';
import { exportProject, importProject } from './zipHandler';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

function project(): StoryboardProject {
  return {
    version: '1.1',
    metaData: {
      id: 'project-1',
      projectName: 'Test',
      participants: '',
      subject: '',
      formatType: 'film',
      date: '2026-06-12',
    },
    prePlanning: { logline: '', objective: '', roles: '', resources: '' },
    scenes: [],
  };
}

describe('zipHandler', () => {
  it('rejects oversized images before export', async () => {
    const scene = {
      id: 'scene-1',
      orderIndex: 0,
      imageFileName: null,
      visualDescription: '',
      audioText: '',
      directorNotes: '',
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
      imageFileName: 'images/shared.jpg',
      visualDescription: '',
      audioText: '',
      directorNotes: '',
    }));

    const archive = zipSync({
      'data.json': strToU8(JSON.stringify(data)),
      'images/shared.jpg': new Uint8Array([1, 2, 3]),
    });

    const imported = await importProject(new Blob([archive]));
    expect(imported.images['scene-1']).toBe(imported.images['scene-2']);
    expect(imported.images['scene-1']?.size).toBe(3);
  });

  it('round-trips v1.1 field definitions and dynamic values', async () => {
    const data = project();
    data.fieldDefinitions = [{ key: 'custom:light', label: 'Licht' }];
    data.scenes = [
      {
        id: 'scene-1',
        orderIndex: 0,
        imageFileName: null,
        visualDescription: '',
        audioText: '',
        directorNotes: '',
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
        visualDescription: '',
        audioText: '',
        directorNotes: '',
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
});

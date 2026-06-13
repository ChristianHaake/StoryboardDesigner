import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';
import type { StoryboardProject } from '../types';
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
    const zip = new JSZip();
    zip.file('data.json', JSON.stringify(data));
    zip.file('images/shared.jpg', new Uint8Array([1, 2, 3]));

    const archive = await zip.generateAsync({ type: 'uint8array' });
    const imported = await importProject(archive as unknown as Blob);
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
    const zip = new JSZip();
    zip.file('data.json', JSON.stringify(data));
    const archive = await zip.generateAsync({ type: 'uint8array' });

    const imported = await importProject(archive as unknown as Blob);
    expect(imported.project.version).toBe('1.3');
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
    const zip = new JSZip();
    zip.file('data.json', JSON.stringify(data));
    zip.file('images/large.jpg', new Uint8Array(10 * 1024 * 1024 + 1));
    const archive = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

    await expect(importProject(archive as unknown as Blob)).rejects.toThrow(
      'Bilder überschreiten das erlaubte Limit',
    );
  });
});

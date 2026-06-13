import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoryboardProject } from '../types';

const getMock = vi.hoisted(() => vi.fn());
vi.mock('idb-keyval', () => ({
  get: getMock,
  set: vi.fn(),
}));

import { loadAutosave } from './persistence';

function project(): StoryboardProject {
  return {
    version: '1.0',
    metaData: {
      id: 'project-1',
      projectName: 'Test',
      participants: '',
      subject: '',
      formatType: 'film',
      date: '2026-06-12',
    },
    prePlanning: { logline: '', objective: '', roles: '', resources: '' },
    scenes: [
      {
        id: 'scene-1',
        orderIndex: 0,
        imageFileName: null,
        visualDescription: '',
        audioText: '',
        directorNotes: '',
      },
    ],
  };
}

beforeEach(() => getMock.mockReset());

describe('loadAutosave', () => {
  it('validates legacy project payloads', async () => {
    getMock.mockResolvedValue(project());
    await expect(loadAutosave()).resolves.toMatchObject({
      project: { version: '1.4' },
      images: {},
    });
  });

  it('drops blobs that do not belong to a scene', async () => {
    const valid = new Blob(['valid']);
    getMock.mockResolvedValue({
      project: project(),
      images: {
        'scene-1': valid,
        orphan: new Blob(['orphan']),
        invalid: 'not-a-blob',
      },
    });

    const restored = await loadAutosave();
    expect(restored?.images).toEqual({ 'scene-1': valid });
  });

  it('restores v1.1 definitions and dynamic values', async () => {
    const data = project();
    data.version = '1.1';
    Object.assign(data, {
      fieldDefinitions: [{ key: 'custom:light', label: 'Licht' }],
    });
    data.scenes[0]!.customFields = { 'custom:light': 'Warm' };
    getMock.mockResolvedValue({ project: data, images: {} });

    const restored = await loadAutosave();
    expect(restored?.project.fieldDefinitions).toEqual([{ key: 'custom:light', label: 'Licht' }]);
    expect(restored?.project.scenes[0]?.customFields).toEqual({ 'custom:light': 'Warm' });
  });

  it('ignores malformed autosaves', async () => {
    getMock.mockResolvedValue({ version: '2.0' });
    await expect(loadAutosave()).resolves.toBeUndefined();
  });
});

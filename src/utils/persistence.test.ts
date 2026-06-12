import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.hoisted(() => vi.fn());
vi.mock('idb-keyval', () => ({
  get: getMock,
  set: vi.fn(),
}));

import { loadAutosave } from './persistence';

function project() {
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
      project: { version: '1.0' },
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

  it('ignores malformed autosaves', async () => {
    getMock.mockResolvedValue({ version: '2.0' });
    await expect(loadAutosave()).resolves.toBeUndefined();
  });
});

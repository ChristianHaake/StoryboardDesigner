import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoryboardProject } from '../../domain/types';

const getMock = vi.hoisted(() => vi.fn());
const setMock = vi.hoisted(() => vi.fn());
const delMock = vi.hoisted(() => vi.fn());
vi.mock('idb-keyval', () => ({
  get: getMock,
  set: setMock,
  del: delMock,
}));

import { clearAutosave, loadAutosave, scheduleAutosave } from './persistence';

function project(): StoryboardProject {
  return {
    version: '1.0',
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
    scenes: [
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
      },
    ],
  };
}

beforeEach(() => {
  getMock.mockReset();
  setMock.mockReset();
  delMock.mockReset();
  setMock.mockResolvedValue(undefined);
  delMock.mockResolvedValue(undefined);
  vi.useFakeTimers();
  vi.stubGlobal('window', {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  });
});

afterEach(async () => {
  await clearAutosave();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('loadAutosave', () => {
  it('validates legacy project payloads', async () => {
    getMock.mockResolvedValue(project());
    await expect(loadAutosave()).resolves.toMatchObject({
      project: { version: '1.5' },
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

describe('scheduleAutosave', () => {
  it('serializes writes so stale autosaves cannot overwrite newer payloads', async () => {
    const first = project();
    first.metaData.projectName = 'Alt';
    const second = project();
    second.metaData.projectName = 'Neu';

    let releaseFirst!: () => void;
    setMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseFirst = resolve;
        }),
    );
    setMock.mockResolvedValue(undefined);

    scheduleAutosave({ project: first, images: {} });
    await vi.advanceTimersByTimeAsync(1000);
    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock.mock.calls[0]?.[1].project.metaData.projectName).toBe('Alt');

    scheduleAutosave({ project: second, images: {} });
    await vi.advanceTimersByTimeAsync(1000);
    expect(setMock).toHaveBeenCalledTimes(1);

    releaseFirst();
    await vi.runAllTimersAsync();

    expect(setMock).toHaveBeenCalledTimes(2);
    expect(setMock.mock.calls[1]?.[1].project.metaData.projectName).toBe('Neu');
  });

  it('does not repopulate autosave after reset while a write is pending', async () => {
    let releaseWrite!: () => void;
    setMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseWrite = resolve;
        }),
    );

    scheduleAutosave({ project: project(), images: {} });
    await vi.advanceTimersByTimeAsync(1000);
    expect(setMock).toHaveBeenCalledTimes(1);

    const clearPromise = clearAutosave();
    releaseWrite();
    await clearPromise;

    expect(delMock).toHaveBeenCalledWith('storyboard-creator:v1:currentProject');
    expect(delMock).toHaveBeenCalledWith('currentProject');
    expect(setMock).toHaveBeenCalledTimes(1);
  });
});

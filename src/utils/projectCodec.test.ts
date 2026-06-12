import { describe, expect, it } from 'vitest';
import { decodeProject, MAX_SCENES, ProjectValidationError } from './projectCodec';

function project(overrides: Record<string, unknown> = {}) {
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
    prePlanning: {
      logline: '',
      objective: '',
      roles: '',
      resources: '',
    },
    scenes: [],
    ...overrides,
  };
}

describe('decodeProject', () => {
  it('preserves v1.1-compatible custom fields and field definitions', () => {
    const decoded = decodeProject(
      project({
        version: '1.7',
        fieldDefinitions: [{ key: 'camera', label: 'Kamera' }],
        scenes: [
          {
            id: 'scene-1',
            orderIndex: 0,
            imageFileName: null,
            visualDescription: '',
            audioText: '',
            directorNotes: '',
            customFields: { camera: 'Totale' },
          },
        ],
      }),
    );

    expect(decoded.version).toBe('1.0');
    expect(decoded.fieldDefinitions).toEqual([{ key: 'camera', label: 'Kamera' }]);
    expect(decoded.scenes[0]?.customFields).toEqual({ camera: 'Totale' });
  });

  it('rejects unsupported future major versions', () => {
    expect(() => decodeProject(project({ version: '2.0' }))).toThrow(ProjectValidationError);
  });

  it('replaces duplicate scene ids', () => {
    const scene = {
      id: 'duplicate',
      orderIndex: 0,
      imageFileName: null,
      visualDescription: '',
      audioText: '',
      directorNotes: '',
    };
    const decoded = decodeProject(project({ scenes: [scene, { ...scene, orderIndex: 1 }] }));

    expect(decoded.scenes[0]?.id).toBe('duplicate');
    expect(decoded.scenes[1]?.id).not.toBe('duplicate');
  });

  it('rejects projects above scene limit', () => {
    const scenes = Array.from({ length: MAX_SCENES + 1 }, (_, index) => ({
      id: `scene-${index}`,
      orderIndex: index,
      imageFileName: null,
      visualDescription: '',
      audioText: '',
      directorNotes: '',
    }));

    expect(() => decodeProject(project({ scenes }))).toThrow(
      `Zu viele Szenen (max. ${MAX_SCENES}).`,
    );
  });
});

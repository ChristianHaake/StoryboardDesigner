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
  it('migrates v1 data and preserves custom fields and field definitions', () => {
    const decoded = decodeProject(
      project({
        version: '1.0',
        fieldDefinitions: [{ key: 'camera', label: 'Kamera' }],
        scenes: [
          {
            id: 'scene-1',
            orderIndex: 0,
            imageFileName: null,
            
            title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' },  location: '', materials: [],    
            
            customFields: { camera: 'Totale' },
          },
        ],
      }),
    );

    expect(decoded.version).toBe('1.5');
    expect(decoded.fieldDefinitions).toEqual([{ key: 'camera', label: 'Kamera' }]);
    expect(decoded.scenes[0]?.customFields).toEqual({ camera: 'Totale' });
  });

  it('preserves select field type with options and downgrades invalid selects', () => {
    const decoded = decodeProject(
      project({
        version: '1.3',
        fieldDefinitions: [
          { key: 'shot', label: 'Einstellung', type: 'select', options: ['Totale', 'Nah', 'Nah'] },
          { key: 'empty', label: 'Leer', type: 'select', options: [] },
          { key: 'free', label: 'Frei', type: 'text' },
        ],
      }),
    );

    expect(decoded.fieldDefinitions?.[0]).toEqual({
      key: 'shot',
      label: 'Einstellung',
      type: 'select',
      options: ['Totale', 'Nah'], // dedupliziert
    });
    // Select ohne Optionen fällt auf Freitext zurück (kein type-Feld).
    expect(decoded.fieldDefinitions?.[1]).toEqual({ key: 'empty', label: 'Leer' });
    expect(decoded.fieldDefinitions?.[2]).toEqual({ key: 'free', label: 'Frei' });
  });

  it('preserves alt text and drops empty alt text', () => {
    const decoded = decodeProject(
      project({
        version: '1.4',
        scenes: [
          {
            id: 'scene-1',
            orderIndex: 0,
            imageFileName: 'img-1.jpg',
            
            title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' },  location: '', materials: [],    
            
            altText: 'Nahaufnahme einer Pflanze',
          },
          {
            id: 'scene-2',
            orderIndex: 1,
            imageFileName: null,
            
            title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' },  location: '', materials: [],    
            
            altText: '',
          },
        ],
      }),
    );

    expect(decoded.scenes[0]?.altText).toBe('Nahaufnahme einer Pflanze');
    expect(decoded.scenes[1]).not.toHaveProperty('altText');
  });

  it('preserves and normalizes scene comments', () => {
    const decoded = decodeProject(
      project({
        version: '1.4',
        scenes: [
          {
            id: 'scene-1',
            orderIndex: 0,
            imageFileName: null,
            
            title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' },  location: '', materials: [],    
            
            comments: [
              { id: 'c1', text: 'Gut!', done: true, createdAt: '2026-06-13T10:00:00Z' },
              { id: 'c2', text: '   ', done: false }, // leer → verworfen
              { text: 'Ohne ID', done: 'nope' }, // ID generiert, done → false
            ],
          },
        ],
      }),
    );

    const comments = decoded.scenes[0]?.comments ?? [];
    expect(comments).toHaveLength(2);
    expect(comments[0]).toEqual({
      id: 'c1',
      text: 'Gut!',
      done: true,
      createdAt: '2026-06-13T10:00:00Z',
    });
    expect(comments[1]?.text).toBe('Ohne ID');
    expect(comments[1]?.done).toBe(false);
    expect(comments[1]?.id).toBeTruthy();
  });

  it('preserves v1.5 fields (imageFit, duration) and defaults them', () => {
    const decoded = decodeProject(
      project({
        version: '1.5',
        scenes: [
          {
            id: 'scene-1',
            orderIndex: 0,
            imageFileName: null,
            
            title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' }, location: '', materials: [],    
            imageFit: 'contain',
          },
          {
            id: 'scene-2',
            orderIndex: 1,
            imageFileName: null,
            
            title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' }, location: '', materials: [],    
            
            // missing v1.5 fields should fallback to defaults
          },
        ],
      }),
    );

    expect(decoded.scenes[0]?.imageFit).toBe('contain');

    expect(decoded.scenes[1]?.imageFit).toBe('cover'); // default
  });

  it('normalizes duplicate labels and excessive field definitions', () => {
    const fieldDefinitions = Array.from({ length: 25 }, (_, index) => ({
      key: `field-${index}`,
      label: index === 1 ? 'FELD 0' : `Feld ${index}`,
    }));
    const decoded = decodeProject(project({ version: '1.1', fieldDefinitions }));

    expect(decoded.fieldDefinitions).toHaveLength(20);
    expect(
      decoded.fieldDefinitions?.filter((field) => field.label.toLowerCase() === 'feld 0'),
    ).toHaveLength(1);
  });

  it('rejects unsupported future major versions', () => {
    expect(() => decodeProject(project({ version: '2.0' }))).toThrow(ProjectValidationError);
  });

  it('replaces duplicate scene ids', () => {
    const scene = {
      id: 'duplicate',
      orderIndex: 0,
      imageFileName: null,
      
      title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' },  location: '', materials: [],    
      
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
      
      title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' },  location: '', materials: [],    
      
    }));

    expect(() => decodeProject(project({ scenes }))).toThrow(
      `Zu viele Szenen (max. ${MAX_SCENES}).`,
    );
  });
});

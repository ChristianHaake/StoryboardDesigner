import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_SCENES } from '../../domain/projectCodec';
import { selectProject, useStoryboardStore } from './useStoryboardStore';

beforeEach(() => {
  useStoryboardStore.setState({
    metaData: {
      id: 'project-1',
      projectName: '',
      groupMembers: [], topic: '', complexity: 'standard',
      subject: '',
      productType: 'shortFilm',
      date: '2026-06-12',
    },
    prePlanning: { logline: '', objective: '', roles: '', resources: '' },
    fieldDefinitions: undefined,
    scenes: [],
    images: {},
    imageUrls: {},
    touched: false,
    hasContent: false,
    lastDeleted: null,
    errorMessage: null,
  });
});

describe('useStoryboardStore', () => {
  it('adds, moves, deletes and restores scenes with stable ordering', () => {
    const state = useStoryboardStore.getState();
    state.addScene();
    useStoryboardStore.getState().addScene();
    useStoryboardStore.getState().addScene();
    const [first, second, third] = useStoryboardStore.getState().scenes;

    useStoryboardStore.getState().moveScene(third!.id, first!.id);
    expect(useStoryboardStore.getState().scenes.map((scene) => scene.id)).toEqual([
      third!.id,
      first!.id,
      second!.id,
    ]);

    useStoryboardStore.getState().deleteScene(first!.id);
    useStoryboardStore.getState().undoDelete();
    expect(useStoryboardStore.getState().scenes.map((scene) => scene.orderIndex)).toEqual([
      0, 1, 2,
    ]);
  });

  it('stops adding and duplicating at scene limit', () => {
    const scene = {
      id: 'scene',
      orderIndex: 0,
      imageFileName: null,
      visualDescription: '',
      title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' }, duration: 0, location: '', materials: [], roles: [], transition: '', sources: [], reflection: '',
      
    };
    useStoryboardStore.setState({
      scenes: Array.from({ length: MAX_SCENES }, (_, index) => ({
        ...scene,
        id: `scene-${index}`,
        orderIndex: index,
      })),
    });

    useStoryboardStore.getState().addScene();
    useStoryboardStore.getState().duplicateScene('scene-0');
    expect(useStoryboardStore.getState().scenes).toHaveLength(MAX_SCENES);
  });

  it('does not exceed scene limit when undoing a deletion', () => {
    const deleted = {
      id: 'deleted',
      orderIndex: 0,
      imageFileName: null,
      visualDescription: '',
      title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' }, duration: 0, location: '', materials: [], roles: [], transition: '', sources: [], reflection: '',
      
    };
    useStoryboardStore.setState({
      scenes: Array.from({ length: MAX_SCENES }, (_, index) => ({
        ...deleted,
        id: `scene-${index}`,
        orderIndex: index,
      })),
      lastDeleted: { scene: deleted, index: 0, image: null },
    });

    useStoryboardStore.getState().undoDelete();
    expect(useStoryboardStore.getState().scenes).toHaveLength(MAX_SCENES);
    expect(useStoryboardStore.getState().lastDeleted).toBeNull();
    expect(useStoryboardStore.getState().errorMessage).toContain('maximal 200');
  });

  it('marks loaded projects as content and preserves field definitions on serialization', () => {
    useStoryboardStore.getState().loadProject({
      version: '1.0',
      metaData: useStoryboardStore.getState().metaData,
      prePlanning: useStoryboardStore.getState().prePlanning,
      fieldDefinitions: [{ key: 'camera', label: 'Kamera' }],
      scenes: [],
    });

    const state = useStoryboardStore.getState();
    expect(state.hasContent).toBe(true);
    expect(state.touched).toBe(false);
    expect(selectProject(state).fieldDefinitions).toEqual([{ key: 'camera', label: 'Kamera' }]);
  });

  it('distinguishes autosave restore from user-initiated import', () => {
    const project = {
      version: '1.0',
      metaData: useStoryboardStore.getState().metaData,
      prePlanning: useStoryboardStore.getState().prePlanning,
      scenes: [],
    };

    useStoryboardStore.getState().loadProject(project);
    expect(useStoryboardStore.getState().touched).toBe(false);

    useStoryboardStore.getState().loadProject(project, {}, true);
    expect(useStoryboardStore.getState().touched).toBe(true);
  });

  it('adds format presets without removing custom fields or values', () => {
    useStoryboardStore.setState({
      fieldDefinitions: [{ key: 'custom:light', label: 'Licht' }],
      scenes: [
        {
          id: 'scene-1',
          orderIndex: 0,
          imageFileName: null,
          visualDescription: '',
          title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' }, duration: 0, location: '', materials: [], roles: [], transition: '', sources: [], reflection: '',
          
          customFields: { 'custom:light': 'Warm' },
        },
      ],
    });

    expect(useStoryboardStore.getState().setFormatType('shortFilm')).toBe(3);
    const state = useStoryboardStore.getState();
    expect(state.metaData.productType).toBe('shortFilm');
    expect(state.fieldDefinitions?.map((field) => field.label)).toEqual([
      'Licht',
      'Kameraeinstellung',
      'Kamerabewegung',
      'Bildunterschrift',
    ]);
    expect(state.scenes[0]?.customFields?.['custom:light']).toBe('Warm');
    expect(useStoryboardStore.getState().setFormatType('shortFilm')).toBe(0);
  });

  it('validates adding and renaming custom fields', () => {
    expect(useStoryboardStore.getState().addCustomField('')).toContain('eingeben');
    expect(useStoryboardStore.getState().addCustomField('Licht')).toBeNull();
    expect(useStoryboardStore.getState().addCustomField('licht')).toContain('bereits');

    const key = useStoryboardStore.getState().fieldDefinitions?.[0]?.key;
    expect(key).toBeTruthy();
    expect(useStoryboardStore.getState().renameCustomField(key!, 'Kamera')).toBeNull();
    expect(useStoryboardStore.getState().fieldDefinitions?.[0]?.label).toBe('Kamera');
  });

  it('preserves and updates the field description when renaming', () => {
    useStoryboardStore.setState({
      fieldDefinitions: [{ key: 'custom:shot', label: 'Einstellung', description: 'Wie nah?' }],
    });
    const key = 'custom:shot';

    // Rename mit Beschreibung → bleibt erhalten/aktualisiert.
    expect(useStoryboardStore.getState().renameCustomField(key, 'Kamera', 'Wie nah dran?')).toBeNull();
    expect(useStoryboardStore.getState().fieldDefinitions?.[0]?.description).toBe('Wie nah dran?');
  });

  it('deletes a field definition and all scene values', () => {
    useStoryboardStore.setState({
      fieldDefinitions: [{ key: 'custom:light', label: 'Licht' }],
      scenes: [
        {
          id: 'scene-1',
          orderIndex: 0,
          imageFileName: null,
          visualDescription: '',
          title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' }, duration: 0, location: '', materials: [], roles: [], transition: '', sources: [], reflection: '',
          
          customFields: { 'custom:light': 'Warm', keep: 'Ja' },
        },
      ],
    });

    useStoryboardStore.getState().deleteCustomField('custom:light');
    expect(useStoryboardStore.getState().fieldDefinitions).toEqual([]);
    expect(useStoryboardStore.getState().scenes[0]?.customFields).toEqual({ keep: 'Ja' });
  });

  it('updates and independently duplicates dynamic scene values', () => {
    useStoryboardStore.getState().addScene();
    const sceneId = useStoryboardStore.getState().scenes[0]!.id;
    useStoryboardStore.getState().updateCustomField(sceneId, 'custom:light', 'Warm');
    useStoryboardStore.getState().duplicateScene(sceneId);
    const [original, duplicate] = useStoryboardStore.getState().scenes;

    useStoryboardStore.getState().updateCustomField(duplicate!.id, 'custom:light', 'Kalt');
    expect(original!.customFields?.['custom:light']).toBe('Warm');
    expect(useStoryboardStore.getState().scenes[1]?.customFields?.['custom:light']).toBe('Kalt');
  });
});

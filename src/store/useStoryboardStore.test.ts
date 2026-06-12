import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_SCENES } from '../utils/projectCodec';
import { selectProject, useStoryboardStore } from './useStoryboardStore';

beforeEach(() => {
  useStoryboardStore.setState({
    metaData: {
      id: 'project-1',
      projectName: '',
      participants: '',
      subject: '',
      formatType: 'film',
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
      audioText: '',
      directorNotes: '',
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
      audioText: '',
      directorNotes: '',
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
});

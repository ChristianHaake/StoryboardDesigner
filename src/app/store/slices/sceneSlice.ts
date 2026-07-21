import type { StoryboardCreator, SceneSlice } from '../types';
import type { Scene, SceneComment } from '../../../domain/types';
import { generateId } from '../../../shared/utils/idGenerator';
import {
  MAX_COMMENT_LENGTH,
  MAX_COMMENTS_PER_SCENE,
  MAX_SCENES,
} from '../../../domain/projectCodec';

export function createEmptyScene(orderIndex: number): Scene {
  return {
    id: generateId(),
    orderIndex,
    imageFileName: null,
    title: '',
    action: '',
    text: '',
    audio: { dialogue: '', soundEffects: '', music: '' },
    camera: { shotSize: '', angle: '', movement: '' },
    location: '',
    materials: [],
    imageFit: 'cover',
  };
}

export function renumber(scenes: Scene[]): Scene[] {
  return scenes.map((scene, index) =>
    scene.orderIndex === index ? scene : { ...scene, orderIndex: index },
  );
}

export const createSceneSlice: StoryboardCreator<SceneSlice> = (set) => ({
  scenes: [],
  images: {},
  imageUrls: {},

  updateScene: (id, patch) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      scenes: state.scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)),
    })),

  updateCustomField: (sceneId, fieldKey, value) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      scenes: state.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              customFields: {
                ...(scene.customFields ?? {}),
                [fieldKey]: value,
              },
            }
          : scene,
      ),
    })),

  addComment: (sceneId, text) =>
    set((state) => {
      const trimmed = text.trim().slice(0, MAX_COMMENT_LENGTH);
      if (!trimmed) return state;
      const target = state.scenes.find((scene) => scene.id === sceneId);
      if ((target?.comments?.length ?? 0) >= MAX_COMMENTS_PER_SCENE) return state;
      const comment: SceneComment = {
        id: generateId(),
        text: trimmed,
        done: false,
        createdAt: new Date().toISOString(),
      };
      return {
        touched: true,
        hasContent: true,
        scenes: state.scenes.map((scene) =>
          scene.id === sceneId
            ? { ...scene, comments: [...(scene.comments ?? []), comment] }
            : scene,
        ),
      };
    }),

  toggleCommentDone: (sceneId, commentId) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      scenes: state.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              comments: (scene.comments ?? []).map((comment) =>
                comment.id === commentId ? { ...comment, done: !comment.done } : comment,
              ),
            }
          : scene,
      ),
    })),

  deleteComment: (sceneId, commentId) =>
    set((state) => ({
      touched: true,
      hasContent: true,
      scenes: state.scenes.map((scene) => {
        if (scene.id !== sceneId) return scene;
        const comments = (scene.comments ?? []).filter((comment) => comment.id !== commentId);
        return comments.length > 0 ? { ...scene, comments } : { ...scene, comments: undefined };
      }),
    })),

  setSceneImage: (id, blob) =>
    set((state) => {
      if (state.imageUrls[id]) URL.revokeObjectURL(state.imageUrls[id]);
      return {
        touched: true,
        hasContent: true,
        images: { ...state.images, [id]: blob },
        imageUrls: { ...state.imageUrls, [id]: URL.createObjectURL(blob) },
      };
    }),

  removeSceneImage: (id) =>
    set((state) => {
      if (!(id in state.images)) return state;
      if (state.imageUrls[id]) URL.revokeObjectURL(state.imageUrls[id]);
      const images = { ...state.images };
      const imageUrls = { ...state.imageUrls };
      delete images[id];
      delete imageUrls[id];
      return {
        touched: true,
        hasContent: true,
        images,
        imageUrls,
        scenes: state.scenes.map((scene) =>
          scene.id === id ? { ...scene, imageFileName: null } : scene,
        ),
      };
    }),

  addScene: () =>
    set((state) =>
      state.scenes.length >= MAX_SCENES
        ? state
        : {
            touched: true,
            hasContent: true,
            scenes: [...state.scenes, createEmptyScene(state.scenes.length)],
          },
    ),

  duplicateScene: (id) =>
    set((state) => {
      if (state.scenes.length >= MAX_SCENES) return state;
      const index = state.scenes.findIndex((scene) => scene.id === id);
      if (index === -1) return state;
      const original = state.scenes[index];
      const copy: Scene = {
        ...original,
        id: generateId(),
        ...(original.customFields ? { customFields: { ...original.customFields } } : {}),
        ...(original.comments
          ? { comments: original.comments.map((comment) => ({ ...comment })) }
          : {}),
      };
      const scenes = [...state.scenes];
      scenes.splice(index + 1, 0, copy);
      const originalImage = state.images[id];
      return {
        touched: true,
        hasContent: true,
        scenes: renumber(scenes),
        ...(originalImage
          ? {
              images: { ...state.images, [copy.id]: originalImage },
              imageUrls: { ...state.imageUrls, [copy.id]: URL.createObjectURL(originalImage) },
            }
          : {}),
      };
    }),

  deleteScene: (id) =>
    set((state) => {
      const index = state.scenes.findIndex((scene) => scene.id === id);
      if (index === -1) return state;
      if (state.imageUrls[id]) URL.revokeObjectURL(state.imageUrls[id]);
      const images = { ...state.images };
      const imageUrls = { ...state.imageUrls };
      delete images[id];
      delete imageUrls[id];
      return {
        touched: true,
        hasContent: true,
        lastDeleted: { scene: state.scenes[index], index, image: state.images[id] ?? null },
        scenes: renumber(state.scenes.filter((scene) => scene.id !== id)),
        images,
        imageUrls,
      };
    }),

  moveScene: (activeId, overId) =>
    set((state) => {
      const from = state.scenes.findIndex((scene) => scene.id === activeId);
      const to = state.scenes.findIndex((scene) => scene.id === overId);
      if (from === -1 || to === -1 || from === to) return state;
      const scenes = [...state.scenes];
      const [moved] = scenes.splice(from, 1);
      scenes.splice(to, 0, moved);
      return { touched: true, hasContent: true, scenes: renumber(scenes) };
    }),
});

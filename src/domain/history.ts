import type { CustomFieldDefinition, MetaData, PrePlanning, Scene } from './types';

// Generelles Undo/Redo (#6b). Hält Schnappschüsse des Projektinhalts
// (metaData, prePlanning, fieldDefinitions, scenes) plus image references, so
// scene delete/restore and content snapshots can keep image previews consistent.
// Direct image add/remove still has its own UI flow.
//
// Gespeist vom inhaltsgefilterten Store-Subscribe in App.tsx: recordChange(prev,
// next) entscheidet, ob ein Schnappschuss auf den Past-Stack kommt. Aufeinander-
// folgende Texteingaben (gleiche Struktur, kurzer Abstand) werden zusammengefasst,
// damit ein Undo eine ganze Tippsequenz zurücknimmt statt einzelner Zeichen.

export interface ContentSnapshot {
  metaData: MetaData;
  prePlanning: PrePlanning;
  fieldDefinitions?: CustomFieldDefinition[];
  scenes: Scene[];
  images: Record<string, Blob>;
}

const LIMIT = 50;
const COALESCE_MS = 700;

let past: ContentSnapshot[] = [];
let future: ContentSnapshot[] = [];
let suspended = false;
let lastAt = 0;
let lastStructural = true;

let onFlags: ((canUndo: boolean, canRedo: boolean) => void) | null = null;
let getCurrent: (() => ContentSnapshot) | null = null;
let restore: ((snapshot: ContentSnapshot) => void) | null = null;

function snapshot(state: ContentSnapshot): ContentSnapshot {
  return {
    metaData: state.metaData,
    prePlanning: state.prePlanning,
    fieldDefinitions: state.fieldDefinitions,
    scenes: state.scenes,
    images: state.images,
  };
}

function emit(): void {
  onFlags?.(past.length > 0, future.length > 0);
}

export function setHistoryHooks(hooks: {
  getCurrent: () => ContentSnapshot;
  restore: (snapshot: ContentSnapshot) => void;
  onFlags: (canUndo: boolean, canRedo: boolean) => void;
}): void {
  getCurrent = hooks.getCurrent;
  restore = hooks.restore;
  onFlags = hooks.onFlags;
}

// Wird mit jeder echten Inhaltsänderung aufgerufen (prev = Stand davor).
export function recordChange(prev: ContentSnapshot, next: ContentSnapshot): void {
  if (suspended) return;
  const now = Date.now();
  const sameShape =
    prev.scenes.length === next.scenes.length &&
    (prev.fieldDefinitions?.length ?? 0) === (next.fieldDefinitions?.length ?? 0);
  // Tippsequenz zusammenfassen: gleiche Struktur, letzter Eintrag ebenfalls
  // „weich", kurzer Abstand → keinen weiteren Schnappschuss ablegen.
  const coalesce = past.length > 0 && sameShape && !lastStructural && now - lastAt < COALESCE_MS;
  if (!coalesce) {
    past.push(snapshot(prev));
    if (past.length > LIMIT) past.shift();
  }
  future = [];
  lastAt = now;
  lastStructural = !sameShape;
  emit();
}

export function undo(): void {
  if (!past.length || !getCurrent || !restore) return;
  const target = past.pop()!;
  future.push(getCurrent());
  suspended = true;
  restore(target);
  suspended = false;
  lastStructural = true;
  emit();
}

export function redo(): void {
  if (!future.length || !getCurrent || !restore) return;
  const target = future.pop()!;
  past.push(getCurrent());
  suspended = true;
  restore(target);
  suspended = false;
  lastStructural = true;
  emit();
}

// Nach dem initialen Autosave-Restore: History leeren, damit der Restore selbst
// nicht rückgängig gemacht werden kann.
export function resetHistory(): void {
  past = [];
  future = [];
  lastStructural = true;
  emit();
}

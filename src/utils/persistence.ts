import { get, set } from 'idb-keyval';
import type { StoryboardProject } from '../types';
import { decodeProject } from './projectCodec';

// IndexedDB statt localStorage: Bild-Blobs hängen am Projekt und werden
// per Structured Clone nativ mitgespeichert.
const AUTOSAVE_KEY = 'currentProject';
const DEBOUNCE_MS = 1000;

export interface AutosavePayload {
  project: StoryboardProject;
  images: Record<string, Blob>;
}

let timer: number | undefined;
let pending = false;
let saveSeq = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasPendingAutosave(): boolean {
  return pending;
}

export function scheduleAutosave(payload: AutosavePayload): void {
  pending = true;
  // Sequenznummer: ein noch laufender älterer Save darf pending nicht
  // zurücksetzen, wenn inzwischen neuere Änderungen anstehen.
  const seq = ++saveSeq;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    void set(AUTOSAVE_KEY, payload)
      .then(() => {
        if (seq === saveSeq) pending = false;
      })
      .catch((error: unknown) => {
        // Autosave ist Sicherheitsnetz, kein Speichern — Fehler nicht eskalieren,
        // aber pending lassen, damit die beforeunload-Warnung greift.
        console.warn('Autosave fehlgeschlagen:', error);
      });
  }, DEBOUNCE_MS);
}

export async function loadAutosave(): Promise<AutosavePayload | undefined> {
  try {
    const stored = await get<unknown>(AUTOSAVE_KEY);
    if (!stored) return undefined;
    // Legacy-Format (vor Sprint 3): nacktes StoryboardProject ohne Bilder.
    if (!isRecord(stored) || !('project' in stored)) {
      return { project: decodeProject(stored), images: {} };
    }
    const project = decodeProject(stored.project);
    const sceneIds = new Set(project.scenes.map((scene) => scene.id));
    const images: Record<string, Blob> = {};
    if (typeof stored.images === 'object' && stored.images !== null) {
      for (const [id, image] of Object.entries(stored.images)) {
        if (sceneIds.has(id) && image instanceof Blob) images[id] = image;
      }
    }
    return { project, images };
  } catch (error: unknown) {
    console.warn('Autosave konnte nicht geladen werden:', error);
    return undefined;
  }
}

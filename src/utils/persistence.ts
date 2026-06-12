import { get, set } from 'idb-keyval';
import type { StoryboardProject } from '../types';

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
    const stored = await get<AutosavePayload | StoryboardProject>(AUTOSAVE_KEY);
    if (!stored) return undefined;
    // Legacy-Format (vor Sprint 3): nacktes StoryboardProject ohne Bilder.
    if (!('project' in stored)) {
      return { project: stored, images: {} };
    }
    return stored;
  } catch (error: unknown) {
    console.warn('Autosave konnte nicht geladen werden:', error);
    return undefined;
  }
}

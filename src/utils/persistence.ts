import { get, set } from 'idb-keyval';
import type { StoryboardProject } from '../types';

// IndexedDB statt localStorage: ab Sprint 3 hängen Bild-Blobs am Projekt.
const AUTOSAVE_KEY = 'currentProject';
const DEBOUNCE_MS = 1000;

let timer: number | undefined;
let pending = false;
let saveSeq = 0;

export function hasPendingAutosave(): boolean {
  return pending;
}

export function scheduleAutosave(project: StoryboardProject): void {
  pending = true;
  // Sequenznummer: ein noch laufender älterer Save darf pending nicht
  // zurücksetzen, wenn inzwischen neuere Änderungen anstehen.
  const seq = ++saveSeq;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    void set(AUTOSAVE_KEY, project)
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

export async function loadAutosave(): Promise<StoryboardProject | undefined> {
  try {
    return await get<StoryboardProject>(AUTOSAVE_KEY);
  } catch (error: unknown) {
    console.warn('Autosave konnte nicht geladen werden:', error);
    return undefined;
  }
}

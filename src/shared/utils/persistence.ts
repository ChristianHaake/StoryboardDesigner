import { del, get, set } from 'idb-keyval';
import type { StoryboardProject } from '../../domain/types';
import { decodeProject } from '../../domain/projectCodec';

// IndexedDB statt localStorage: Bild-Blobs hängen am Projekt und werden
// per Structured Clone nativ mitgespeichert.
const AUTOSAVE_KEY = 'storyboard-creator:v1:currentProject';
const LEGACY_AUTOSAVE_KEY = 'currentProject';
const DEBOUNCE_MS = 1000;

export interface AutosavePayload {
  project: StoryboardProject;
  images: Record<string, Blob>;
}

let timer: number | undefined;
let pending = false;
let saveSeq = 0;
let latestPayload: AutosavePayload | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export type SaveStatus = 'saving' | 'saved' | 'error';
let statusListener: ((status: SaveStatus) => void) | null = null;

// Erlaubt der UI, den Autosave-Fortschritt anzuzeigen (#6a). Nur ein Listener
// (App-Singleton); null hebt die Registrierung wieder auf.
export function setAutosaveStatusListener(fn: ((status: SaveStatus) => void) | null): void {
  statusListener = fn;
}

function emitStatus(status: SaveStatus): void {
  statusListener?.(status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasPendingAutosave(): boolean {
  return pending;
}

export function scheduleAutosave(payload: AutosavePayload): void {
  pending = true;
  latestPayload = payload;
  // Sequenznummer: ein noch laufender älterer Save darf pending nicht
  // zurücksetzen, wenn inzwischen neuere Änderungen anstehen. Die Schreibkette
  // verhindert zusätzlich, dass alte IndexedDB-Writes neuere Daten überschreiben.
  const seq = ++saveSeq;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    emitStatus('saving');
    writeQueue = writeQueue
      .catch(() => undefined)
      .then(() => {
        if (!latestPayload) {
          return Promise.all([del(AUTOSAVE_KEY), del(LEGACY_AUTOSAVE_KEY)]).then(() => undefined);
        }
        return set(AUTOSAVE_KEY, latestPayload);
      })
      .then(() => {
        if (seq !== saveSeq) return;
        pending = false;
        emitStatus('saved');
      })
      .catch((error: unknown) => {
        // Autosave ist Sicherheitsnetz, kein Speichern — Fehler nicht eskalieren,
        // aber pending lassen, damit die beforeunload-Warnung greift.
        console.warn('Autosave fehlgeschlagen:', error);
        emitStatus('error');
      });
  }, DEBOUNCE_MS);
}

// Löscht den Autosave-Stand und stoppt einen anstehenden Debounce-Write,
// damit „Daten zurücksetzen" nicht direkt wieder überschrieben wird (#12).
export async function clearAutosave(): Promise<void> {
  window.clearTimeout(timer);
  pending = false;
  latestPayload = null;
  saveSeq++;
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => Promise.all([del(AUTOSAVE_KEY), del(LEGACY_AUTOSAVE_KEY)]).then(() => undefined));
  await writeQueue;
}

export async function loadAutosave(): Promise<AutosavePayload | undefined> {
  try {
    const stored = (await get<unknown>(AUTOSAVE_KEY)) ?? (await get<unknown>(LEGACY_AUTOSAVE_KEY));
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

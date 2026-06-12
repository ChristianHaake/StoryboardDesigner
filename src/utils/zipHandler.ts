import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { MetaData, Scene, StoryboardProject } from '../types';
import { generateId } from './idGenerator';

const MAX_SCENES = 200;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB pro Bild
const MAX_DATA_JSON_BYTES = 5 * 1024 * 1024; // 5 MB Projektdaten
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB Gesamtdatei

/** Import-Fehler mit nutzerfreundlicher deutscher Meldung. */
export class ImportError extends Error {}

// internalStream ist dokumentierte JSZip-API (StreamHelper), fehlt aber in den
// mitgelieferten Typdefinitionen — minimales Interface + Cast.
interface JSZipStreamHelper {
  on(event: 'data', callback: (chunk: Uint8Array<ArrayBuffer>) => void): this;
  on(event: 'error', callback: (error: Error) => void): this;
  on(event: 'end', callback: () => void): this;
  pause(): this;
  resume(): this;
}

/**
 * Entpackt einen ZIP-Eintrag mit Byte-Cap WÄHREND der Dekompression —
 * Zip-Bomb-Schutz: ein nachträglicher Größencheck käme zu spät, der
 * dekomprimierte Inhalt läge dann bereits komplett im Speicher.
 */
function entryToBytesLimited(
  entry: JSZip.JSZipObject,
  maxBytes: number,
  errorMessage: string,
): Promise<Uint8Array<ArrayBuffer>[]> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let total = 0;
    let failed = false;
    const stream = (
      entry as unknown as { internalStream(type: 'uint8array'): JSZipStreamHelper }
    ).internalStream('uint8array');
    stream.on('data', (chunk) => {
      if (failed) return;
      total += chunk.length;
      if (total > maxBytes) {
        failed = true;
        stream.pause();
        reject(new ImportError(errorMessage));
        return;
      }
      chunks.push(chunk);
    });
    stream.on('error', () => {
      if (!failed) reject(new ImportError('Die Datei ist beschädigt.'));
    });
    stream.on('end', () => {
      if (!failed) resolve(chunks);
    });
    stream.resume();
  });
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .slice(0, 80);
  return cleaned || 'storyboard';
}

export async function exportProject(
  project: StoryboardProject,
  images: Record<string, Blob>,
): Promise<void> {
  const zip = new JSZip();
  // imageFileName erst beim Export vergeben — im Store ist `images` die Wahrheit.
  const scenes = project.scenes.map((scene) => ({
    ...scene,
    imageFileName: images[scene.id] ? `images/${scene.id}.jpg` : null,
  }));
  zip.file('data.json', JSON.stringify({ ...project, scenes }, null, 2));
  for (const scene of scenes) {
    if (scene.imageFileName) zip.file(scene.imageFileName, images[scene.id]);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${sanitizeFileName(project.metaData.projectName)}.storyboard`);
}

export async function importProject(
  file: Blob,
): Promise<{ project: StoryboardProject; images: Record<string, Blob> }> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError('Datei ist zu groß (max. 100 MB).');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ImportError('Das ist keine gültige .storyboard-Datei.');
  }

  const dataEntry = zip.file('data.json');
  if (!dataEntry) throw new ImportError('Die Datei enthält keine data.json.');

  const dataChunks = await entryToBytesLimited(
    dataEntry,
    MAX_DATA_JSON_BYTES,
    'Die Projektdaten sind zu groß (max. 5 MB).',
  );
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(await new Blob(dataChunks).arrayBuffer()));
  } catch {
    throw new ImportError('Die Projektdaten (data.json) sind beschädigt.');
  }

  const project = validateProject(raw);

  // Nur Bilder laden, die von Szenen referenziert werden — fremde ZIP-Einträge ignorieren.
  const images: Record<string, Blob> = {};
  for (const scene of project.scenes) {
    if (!scene.imageFileName) continue;
    const entry = zip.file(scene.imageFileName);
    if (!entry) continue; // fehlendes Bild tolerieren statt Abbruch
    const chunks = await entryToBytesLimited(
      entry,
      MAX_IMAGE_BYTES,
      `Ein Bild ist zu groß (max. 10 MB): ${scene.imageFileName}`,
    );
    images[scene.id] = new Blob(chunks);
  }

  return { project, images };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

const FORMAT_TYPES: MetaData['formatType'][] = ['film', 'fotostory', 'rede', 'custom'];

/**
 * Defensiv: Pflichtstruktur erzwingen, fehlende Strings auf '' setzen,
 * unbekannte Werte tolerieren (Forward-Kompatibilität zu v1.1-Dateien).
 */
function validateProject(raw: unknown): StoryboardProject {
  if (!isRecord(raw)) throw new ImportError('Ungültiges Projektformat.');
  if (typeof raw.version !== 'string') throw new ImportError('Versionsangabe fehlt.');
  if (!isRecord(raw.metaData) || !Array.isArray(raw.scenes)) {
    throw new ImportError('Projektstruktur unvollständig.');
  }
  if (raw.scenes.length > MAX_SCENES) {
    throw new ImportError(`Zu viele Szenen (max. ${MAX_SCENES}).`);
  }

  const md = raw.metaData;
  const formatType = FORMAT_TYPES.includes(md.formatType as MetaData['formatType'])
    ? (md.formatType as MetaData['formatType'])
    : 'custom';
  const pp = isRecord(raw.prePlanning) ? raw.prePlanning : {};

  // Doppelte IDs neu vergeben — sonst kollidieren React-Keys, dnd-kit und updateScene.
  const seenIds = new Set<string>();
  const scenes: Scene[] = raw.scenes.map((scene, index) => {
    if (!isRecord(scene)) throw new ImportError(`Szene ${index + 1} ist beschädigt.`);
    const customFields = isRecord(scene.customFields)
      ? (Object.fromEntries(
          Object.entries(scene.customFields).filter(([, v]) => typeof v === 'string'),
        ) as Record<string, string>)
      : undefined;
    const id =
      typeof scene.id === 'string' && scene.id && !seenIds.has(scene.id)
        ? scene.id
        : generateId();
    seenIds.add(id);
    return {
      id,
      orderIndex: typeof scene.orderIndex === 'number' ? scene.orderIndex : index,
      imageFileName: typeof scene.imageFileName === 'string' ? scene.imageFileName : null,
      visualDescription: str(scene.visualDescription),
      audioText: str(scene.audioText),
      directorNotes: str(scene.directorNotes),
      ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
    };
  });

  return {
    version: raw.version,
    metaData: {
      id: str(md.id) || generateId(),
      projectName: str(md.projectName),
      participants: str(md.participants),
      subject: str(md.subject),
      formatType,
      date: str(md.date),
    },
    prePlanning: {
      logline: str(pp.logline),
      objective: str(pp.objective),
      roles: str(pp.roles),
      resources: str(pp.resources),
    },
    scenes,
  };
}

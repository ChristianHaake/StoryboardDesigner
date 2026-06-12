import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { StoryboardProject } from '../types';
import { decodeProject, MAX_SCENES, ProjectValidationError } from './projectCodec';
import i18n from '../i18n';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB pro Bild
const MAX_TOTAL_IMAGE_BYTES = 100 * 1024 * 1024; // 100 MB dekomprimierte Bilder
const MAX_DATA_JSON_BYTES = 5 * 1024 * 1024; // 5 MB Projektdaten
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB Gesamtdatei

/** Import-Fehler mit nutzerfreundlicher, übersetzter Meldung. */
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
  totalBudget?: { remaining: number },
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
      if (total > maxBytes || (totalBudget && chunk.length > totalBudget.remaining)) {
        failed = true;
        stream.pause();
        reject(new ImportError(errorMessage));
        return;
      }
      if (totalBudget) totalBudget.remaining -= chunk.length;
      chunks.push(chunk);
    });
    stream.on('error', () => {
      if (!failed) reject(new ImportError(i18n.t('errors.fileCorrupt')));
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
  if (project.scenes.length > MAX_SCENES) {
    throw new Error(i18n.t('errors.exportTooManyScenes', { max: MAX_SCENES }));
  }
  let totalImageBytes = 0;
  for (const image of Object.values(images)) {
    if (image.size > MAX_IMAGE_BYTES) {
      throw new Error(i18n.t('errors.exportImageTooLarge'));
    }
    totalImageBytes += image.size;
    if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
      throw new Error(i18n.t('errors.exportImagesTooLarge'));
    }
  }

  const zip = new JSZip();
  // imageFileName erst beim Export vergeben — im Store ist `images` die Wahrheit.
  const scenes = project.scenes.map((scene) => ({
    ...scene,
    imageFileName: images[scene.id] ? `images/${scene.id}.jpg` : null,
  }));
  const dataJson = JSON.stringify({ ...project, scenes }, null, 2);
  if (new TextEncoder().encode(dataJson).byteLength > MAX_DATA_JSON_BYTES) {
    throw new Error(i18n.t('errors.exportDataTooLarge'));
  }
  zip.file('data.json', dataJson);
  for (const scene of scenes) {
    if (scene.imageFileName) zip.file(scene.imageFileName, images[scene.id]);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  if (blob.size > MAX_FILE_BYTES) {
    throw new Error(i18n.t('errors.exportFileTooLarge'));
  }
  saveAs(blob, `${sanitizeFileName(project.metaData.projectName)}.storyboard`);
}

export async function importProject(
  file: Blob,
): Promise<{ project: StoryboardProject; images: Record<string, Blob> }> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError(i18n.t('errors.fileTooLargeImport'));
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ImportError(i18n.t('errors.notStoryboard'));
  }

  const dataEntry = zip.file('data.json');
  if (!dataEntry) throw new ImportError(i18n.t('errors.noDataJson'));

  const dataChunks = await entryToBytesLimited(
    dataEntry,
    MAX_DATA_JSON_BYTES,
    i18n.t('errors.importDataTooLarge'),
  );
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(await new Blob(dataChunks).arrayBuffer()));
  } catch {
    throw new ImportError(i18n.t('errors.dataCorrupt'));
  }

  let project: StoryboardProject;
  try {
    project = decodeProject(raw);
  } catch (error: unknown) {
    throw new ImportError(
      error instanceof ProjectValidationError ? error.message : i18n.t('errors.invalidFormat'),
    );
  }

  // Nur Bilder laden, die von Szenen referenziert werden — fremde ZIP-Einträge ignorieren.
  const images: Record<string, Blob> = {};
  const imageBudget = { remaining: MAX_TOTAL_IMAGE_BYTES };
  const loadedImages = new Map<string, Blob>();
  for (const scene of project.scenes) {
    if (!scene.imageFileName) continue;
    const loaded = loadedImages.get(scene.imageFileName);
    if (loaded) {
      images[scene.id] = loaded;
      continue;
    }
    const entry = zip.file(scene.imageFileName);
    if (!entry) continue; // fehlendes Bild tolerieren statt Abbruch
    const chunks = await entryToBytesLimited(
      entry,
      MAX_IMAGE_BYTES,
      i18n.t('errors.imagesTooLargeImport', { file: scene.imageFileName }),
      imageBudget,
    );
    const blob = new Blob(chunks);
    loadedImages.set(scene.imageFileName, blob);
    images[scene.id] = blob;
  }

  return { project, images };
}

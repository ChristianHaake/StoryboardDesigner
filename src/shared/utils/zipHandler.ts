import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { saveAs } from 'file-saver';
import type { StoryboardProject } from '../../domain/types';
import { decodeProject, MAX_SCENES, ProjectValidationError } from '../../domain/projectCodec';
import i18n from '../i18n';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB pro Bild
const MAX_TOTAL_IMAGE_BYTES = 100 * 1024 * 1024; // 100 MB dekomprimierte Bilder
const MAX_DATA_JSON_BYTES = 5 * 1024 * 1024; // 5 MB Projektdaten
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB Gesamtdatei

/** Import-Fehler mit nutzerfreundlicher, übersetzter Meldung. */
export class ImportError extends Error {}

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

  const entries: Zippable = {};
  const scenes = project.scenes.map((scene) => ({
    ...scene,
    imageFileName: images[scene.id] ? `images/${scene.id}.jpg` : null,
  }));
  const dataJson = JSON.stringify({ ...project, scenes }, null, 2);
  const dataJsonBytes = strToU8(dataJson);
  if (dataJsonBytes.byteLength > MAX_DATA_JSON_BYTES) {
    throw new Error(i18n.t('errors.exportDataTooLarge'));
  }

  entries['data.json'] = [dataJsonBytes, { level: 6 }];
  for (const scene of scenes) {
    if (scene.imageFileName && images[scene.id]) {
      const buffer = await images[scene.id].arrayBuffer();
      entries[scene.imageFileName] = [new Uint8Array(buffer), { level: 0 }];
    }
  }

  const zipped = zipSync(entries);
  const blob = new Blob([zipped], { type: 'application/zip' });
  if (blob.size > MAX_FILE_BYTES) {
    throw new Error(i18n.t('errors.exportFileTooLarge'));
  }
  saveAs(blob, `${sanitizeFileName(project.metaData.projectName)}.storyboard`);
}

type CentralEntry = {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
};

function readCentralDirectory(bytes: Uint8Array): CentralEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimumEocdSize = 22;
  const start = Math.max(0, bytes.length - 65_557);
  let eocd = -1;
  for (let offset = bytes.length - minimumEocdSize; offset >= start; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new ImportError(i18n.t('errors.notStoryboard'));

  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff ||
    centralOffset + centralSize > eocd
  ) {
    throw new ImportError(i18n.t('errors.notStoryboard'));
  }

  const decoder = new TextDecoder();
  const entries: CentralEntry[] = [];
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) {
      throw new ImportError(i18n.t('errors.notStoryboard'));
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const nextOffset = offset + 46 + nameLength + extraLength + commentLength;
    if (nextOffset > bytes.length || (flags & 1) !== 0 || (method !== 0 && method !== 8)) {
      throw new ImportError(i18n.t('errors.notStoryboard'));
    }
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.push({ name, compressedSize, uncompressedSize });
    offset = nextOffset;
  }
  if (offset !== centralOffset + centralSize) {
    throw new ImportError(i18n.t('errors.notStoryboard'));
  }
  return entries;
}

export async function importProject(
  file: Blob,
): Promise<{ project: StoryboardProject; images: Record<string, Blob> }> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError(i18n.t('errors.fileTooLargeImport'));
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const centralEntries = readCentralDirectory(bytes);
  let totalImagesSize = 0;

  for (const entry of centralEntries) {
    if (entry.name === 'data.json') {
      if (entry.uncompressedSize > MAX_DATA_JSON_BYTES) {
        throw new ImportError(i18n.t('errors.importDataTooLarge'));
      }
    } else if (entry.name.startsWith('images/')) {
      if (entry.uncompressedSize > MAX_IMAGE_BYTES) {
        throw new ImportError(i18n.t('errors.imagesTooLargeImport', { file: entry.name }));
      }
      totalImagesSize += entry.uncompressedSize;
    }
  }

  let extracted: Record<string, Uint8Array>;
  try {
    extracted = unzipSync(bytes, {
      filter: (file) => {
        if (file.name === 'data.json') {
          if (file.originalSize > MAX_DATA_JSON_BYTES) {
            throw new ImportError(i18n.t('errors.importDataTooLarge'));
          }
        } else if (file.name.startsWith('images/')) {
          if (file.originalSize > MAX_IMAGE_BYTES) {
            throw new ImportError(i18n.t('errors.imagesTooLargeImport', { file: file.name }));
          }
        }
        return true;
      },
    });
  } catch (e: any) {
    if (e instanceof ImportError) throw e;
    throw new ImportError(i18n.t('errors.notStoryboard'));
  }

  let totalInflated = 0;
  for (const [name, content] of Object.entries(extracted)) {
    if (name === 'data.json') {
      if (content.byteLength > MAX_DATA_JSON_BYTES) {
        throw new ImportError(i18n.t('errors.importDataTooLarge'));
      }
    } else if (name.startsWith('images/')) {
      if (content.byteLength > MAX_IMAGE_BYTES) {
        throw new ImportError(i18n.t('errors.imagesTooLargeImport', { file: name }));
      }
      totalInflated += content.byteLength;
    }
  }
  if (totalInflated > MAX_TOTAL_IMAGE_BYTES) {
    throw new ImportError(i18n.t('errors.imagesTooLargeImport', { file: 'total' }));
  }

  const dataJsonBytes = extracted['data.json'];
  if (!dataJsonBytes) throw new ImportError(i18n.t('errors.noDataJson'));

  let raw: unknown;
  try {
    raw = JSON.parse(strFromU8(dataJsonBytes));
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

  const images: Record<string, Blob> = {};
  const loadedImages = new Map<string, Blob>();
  for (const scene of project.scenes) {
    if (!scene.imageFileName) continue;
    const loaded = loadedImages.get(scene.imageFileName);
    if (loaded) {
      images[scene.id] = loaded;
      continue;
    }
    const mediaBytes = extracted[scene.imageFileName];
    if (!mediaBytes) continue; // missing image tolerated
    const blob = new Blob([new Uint8Array(mediaBytes)]);
    loadedImages.set(scene.imageFileName, blob);
    images[scene.id] = blob;
  }

  return { project, images };
}

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

/**
 * Verkleinert ein Bild clientseitig auf max. 1600 px Kantenlänge (JPEG).
 * Schülerfotos mit 12 MP würden sonst ZIP-Größe und Tablet-RAM sprengen.
 * EXIF-Orientierung wenden moderne Engines bereits beim Decoden an.
 */
export async function resizeImage(file: Blob, maxEdge: number = MAX_EDGE): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas-Kontext nicht verfügbar');
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht kodiert werden'))),
        'image/jpeg',
        JPEG_QUALITY,
      );
    });
  } finally {
    bitmap.close();
  }
}

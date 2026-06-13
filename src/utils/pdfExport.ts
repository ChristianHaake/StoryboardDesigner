// Echter PDF-Download nach SMC-Muster: DOM → PNG (html-to-image) → in A4-Seiten
// schneiden → jsPDF. jspdf und html-to-image werden dynamisch importiert, damit
// sie als eigener Chunk laden und das Editor-Bundle nicht belasten.

const RENDER_SCALE = 2; // Auflösung der Zwischengrafik
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Berechnet Seitenhöhen so, dass möglichst an sicheren Kanten (Szenengrenzen)
 * umgebrochen wird und keine Karte mittendurch geschnitten wird.
 */
function paginate(totalHeight: number, pageHeight: number, safeBreaks: number[]): number[] {
  const breaks = safeBreaks.filter((y) => y > 0 && y < totalHeight).sort((a, b) => a - b);
  const pages: { y: number; height: number }[] = [];
  let cursor = 0;
  while (cursor < totalHeight) {
    const maxBottom = Math.min(cursor + pageHeight, totalHeight);
    // höchste sichere Kante, die noch auf die Seite passt; sonst hart umbrechen.
    const safe =
      maxBottom === totalHeight
        ? maxBottom
        : (breaks.filter((y) => y > cursor + 1 && y <= maxBottom).at(-1) ?? maxBottom);
    pages.push({ y: cursor, height: safe - cursor });
    cursor = safe;
  }
  return pages.map((p) => p.height);
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  safeBreakSelector?: string,
): Promise<void> {
  const [{ jsPDF }, { toPng }] = await Promise.all([import('jspdf'), import('html-to-image')]);

  const pixelRatio = RENDER_SCALE;
  const dataUrl = await toPng(element, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  // Sichere Umbruchkanten (Unterkanten der Szenenkarten) auf Bildpixel skalieren.
  const elementTop = element.getBoundingClientRect().top;
  const safeBreaks = safeBreakSelector
    ? Array.from(element.querySelectorAll(safeBreakSelector)).map(
        (node) => (node.getBoundingClientRect().bottom - elementTop) * pixelRatio,
      )
    : [];

  const pdf = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' });
  // Seitenhöhe in Bildpixeln, die einer vollen A4-Seite (gleiche Breite) entspricht.
  const pageHeightPx = Math.floor(image.width * (A4_HEIGHT_MM / A4_WIDTH_MM));
  const heights = paginate(image.height, pageHeightPx, safeBreaks);

  let y = 0;
  heights.forEach((height, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('pdf-canvas');
    ctx.drawImage(image, 0, y, image.width, height, 0, 0, image.width, height);
    if (index > 0) pdf.addPage();
    const renderHeightMm = A4_WIDTH_MM * (height / image.width);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, A4_WIDTH_MM, renderHeightMm);
    y += height;
  });

  pdf.save(filename);
}

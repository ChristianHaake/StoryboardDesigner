// Echter PDF-Download nach SMC-Muster: DOM → PNG (html-to-image) → in A4-Seiten
// schneiden → jsPDF. jspdf und html-to-image werden dynamisch importiert, damit
// sie als eigener Chunk laden und das Editor-Bundle nicht belasten.

const RENDER_SCALE = 2; // Auflösung der Zwischengrafik
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
// Browser-Canvas haben ein Höhenlimit (~32 k px). Bei sehr vielen Szenen die
// Auflösung reduzieren, statt eine leere/abgeschnittene Grafik zu erzeugen.
const MAX_CANVAS_PX = 30000;

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

  // html-to-image rastert die Bildschirmansicht; `print:hidden` greift nur unter
  // @media print. Diese Knoten daher vorübergehend hart ausblenden, damit das
  // Layout neu umbricht (lückenlos) und Platzhalter, Aktions-Buttons sowie
  // Feedback-Threads nicht ins PDF geraten. Im finally-Block wiederhergestellt.
  const hiddenEls = Array.from(element.querySelectorAll<HTMLElement>('.print\\:hidden'));
  const prevDisplay = hiddenEls.map((el) => el.style.display);
  hiddenEls.forEach((el) => {
    el.style.display = 'none';
  });

  let dataUrl: string;
  let safeBreaks: number[];
  let pixelRatio: number;
  try {
    // Nach dem Ausblenden messen — Layout ist jetzt reduziert.
    const rawHeight = element.scrollHeight || 1;
    pixelRatio =
      rawHeight * RENDER_SCALE > MAX_CANVAS_PX
        ? Math.max(1, MAX_CANVAS_PX / rawHeight)
        : RENDER_SCALE;
    const ratio = pixelRatio;
    const elementTop = element.getBoundingClientRect().top;
    safeBreaks = safeBreakSelector
      ? Array.from(element.querySelectorAll(safeBreakSelector)).map(
          (node) => (node.getBoundingClientRect().bottom - elementTop) * ratio,
        )
      : [];
    dataUrl = await toPng(element, {
      pixelRatio,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
  } finally {
    hiddenEls.forEach((el, index) => {
      el.style.display = prevDisplay[index];
    });
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  if (image.width <= 0 || image.height <= 0) throw new Error('pdf-empty-render');

  const pdf = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' });
  // Seitenhöhe in Bildpixeln, die einer vollen A4-Seite (gleiche Breite) entspricht.
  const pageHeightPx = Math.floor(image.width * (A4_HEIGHT_MM / A4_WIDTH_MM));
  const heights = paginate(image.height, pageHeightPx, safeBreaks);

  let y = 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('pdf-canvas');

  heights.forEach((height, index) => {
    canvas.width = image.width;
    canvas.height = height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, y, image.width, height, 0, 0, image.width, height);
    if (index > 0) pdf.addPage();
    const renderHeightMm = A4_WIDTH_MM * (height / image.width);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, A4_WIDTH_MM, renderHeightMm);
    y += height;
  });

  pdf.save(filename);
}

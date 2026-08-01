// Echter PDF-Download nach SMC-Muster: DOM → Canvas (html-to-image) → A4-Seiten
// als JPEG → jsPDF. jspdf und html-to-image werden dynamisch importiert, damit
// sie als eigener Chunk laden und das Editor-Bundle nicht belasten.

const RENDER_SCALE = 2; // Auflösung der Zwischengrafik
const A4_WIDTH_MM = 297;
const A4_HEIGHT_MM = 210;
const PAGE_JPEG_QUALITY = 0.92;
// html-to-image begrenzt Canvas-Kanten intern auf 16.384 px. Knapp darunter
// bleiben, damit sichere Seitenkanten und die tatsächliche Rastergröße nicht
// durch eine zweite, versteckte Skalierung auseinanderlaufen.
const MAX_CANVAS_HEIGHT_PX = 16000;
let activeExport: Promise<void> | null = null;

export function calculatePdfPixelRatio(rawHeight: number): number {
  return Math.min(RENDER_SCALE, MAX_CANVAS_HEIGHT_PX / Math.max(1, rawHeight));
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('pdf-canvas-encode'))),
      'image/jpeg',
      PAGE_JPEG_QUALITY,
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Berechnet Seitenhöhen so, dass möglichst an sicheren Kanten (Szenengrenzen)
 * umgebrochen wird und keine Karte mittendurch geschnitten wird.
 */
export function paginate(totalHeight: number, pageHeight: number, safeBreaks: number[]): number[] {
  if (!Number.isFinite(totalHeight) || totalHeight <= 0) return [];
  const boundedPageHeight = Number.isFinite(pageHeight) && pageHeight > 0 ? pageHeight : 1;
  const breaks = safeBreaks
    .filter((y) => Number.isFinite(y) && y > 0 && y < totalHeight)
    .sort((a, b) => a - b);
  const pages: { y: number; height: number }[] = [];
  let cursor = 0;
  while (cursor < totalHeight) {
    const maxBottom = Math.min(cursor + boundedPageHeight, totalHeight);
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

export function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  safeBreakSelector?: string,
): Promise<void> {
  if (activeExport) return activeExport;

  const task = performExport(element, filename, safeBreakSelector);
  activeExport = task;
  return task.finally(() => {
    if (activeExport === task) activeExport = null;
  });
}

async function performExport(
  element: HTMLElement,
  filename: string,
  safeBreakSelector?: string,
): Promise<void> {
  const [{ jsPDF }, { toCanvas }] = await Promise.all([import('jspdf'), import('html-to-image')]);

  // html-to-image rastert die Bildschirmansicht; `print:hidden` greift nur unter
  // @media print. Diese Knoten daher vorübergehend hart ausblenden, damit das
  // Layout neu umbricht (lückenlos) und Platzhalter, Aktions-Buttons sowie
  // Feedback-Threads nicht ins PDF geraten. Im finally-Block wiederhergestellt.
  const hiddenEls = Array.from(element.querySelectorAll<HTMLElement>('.print\\:hidden'));
  const prevDisplay = hiddenEls.map((el) => el.style.display);
  const formControls = Array.from(element.querySelectorAll<HTMLElement>('input, textarea, select'));
  const previousTransitions = formControls.map((control) => control.style.transition);
  const activeElement =
    document.activeElement instanceof HTMLElement && element.contains(document.activeElement)
      ? document.activeElement
      : null;
  formControls.forEach((control) => {
    control.style.transition = 'none';
  });
  activeElement?.blur();
  hiddenEls.forEach((el) => {
    el.style.display = 'none';
  });

  let sourceCanvas: HTMLCanvasElement;
  let safeBreaks: number[];
  try {
    // Nach dem Ausblenden messen — Layout ist jetzt reduziert.
    const rawHeight = element.scrollHeight || 1;
    const pixelRatio = calculatePdfPixelRatio(rawHeight);
    const ratio = pixelRatio;
    const elementTop = element.getBoundingClientRect().top;
    safeBreaks = safeBreakSelector
      ? Array.from(element.querySelectorAll(safeBreakSelector)).map(
          (node) => (node.getBoundingClientRect().bottom - elementTop) * ratio,
        )
      : [];
    sourceCanvas = await toCanvas(element, {
      pixelRatio,
      backgroundColor: '#ffffff',
      // Diese Knoten weder rendern noch traversieren. Nur `display:none` am
      // Original spart html-to-image die teure Klon-/Style-Arbeit nicht.
      filter: (node) => !node.classList?.contains('print:hidden'),
    });
  } finally {
    hiddenEls.forEach((el, index) => {
      el.style.display = prevDisplay[index];
    });
    formControls.forEach((control, index) => {
      control.style.transition = previousTransitions[index];
    });
    if (
      activeElement?.isConnected &&
      (document.activeElement === document.body || document.activeElement === null)
    ) {
      activeElement.focus({ preventScroll: true });
    }
  }

  let pageCanvas: HTMLCanvasElement | null = null;

  try {
    if (
      !Number.isFinite(sourceCanvas.width) ||
      !Number.isFinite(sourceCanvas.height) ||
      sourceCanvas.width <= 0 ||
      sourceCanvas.height <= 0
    ) {
      throw new Error('pdf-empty-render');
    }

    const pdf = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
    // Seitenhöhe in Bildpixeln, die einer vollen A4-Seite (gleiche Breite) entspricht.
    const pageHeightPx = Math.max(1, Math.floor(sourceCanvas.width * (A4_HEIGHT_MM / A4_WIDTH_MM)));
    const heights = paginate(sourceCanvas.height, pageHeightPx, safeBreaks);
    let y = 0;
    pageCanvas = document.createElement('canvas');
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) throw new Error('pdf-canvas');

    for (const [index, height] of heights.entries()) {
      pageCanvas.width = sourceCanvas.width;
      pageCanvas.height = height;
      ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        sourceCanvas,
        0,
        y,
        sourceCanvas.width,
        height,
        0,
        0,
        sourceCanvas.width,
        height,
      );
      if (index > 0) pdf.addPage();
      const renderHeightMm = A4_WIDTH_MM * (height / sourceCanvas.width);
      pdf.addImage(
        await canvasToJpegBytes(pageCanvas),
        'JPEG',
        0,
        0,
        A4_WIDTH_MM,
        renderHeightMm,
        undefined,
        'FAST',
      );
      y += height;
    }

    pdf.save(filename);
  } finally {
    if (pageCanvas) {
      pageCanvas.width = 1;
      pageCanvas.height = 1;
    }
    sourceCanvas.width = 1;
    sourceCanvas.height = 1;
  }
}

import { describe, expect, it } from 'vitest';
import { calculatePdfPixelRatio, paginate } from './pdfExport';

describe('calculatePdfPixelRatio', () => {
  it('keeps 2x output while the rendered document stays below the canvas limit', () => {
    expect(calculatePdfPixelRatio(1)).toBe(2);
    expect(calculatePdfPixelRatio(8000)).toBe(2);
  });

  it('scales tall documents to the configured canvas height', () => {
    expect(calculatePdfPixelRatio(16000)).toBe(1);
    expect(calculatePdfPixelRatio(32000)).toBe(0.5);
  });
});

describe('paginate', () => {
  it('prefers safe scene boundaries that fit on the current page', () => {
    expect(paginate(1000, 400, [350, 700])).toEqual([350, 350, 300]);
  });

  it('falls back to hard page boundaries for oversized scenes', () => {
    expect(paginate(1000, 400, [])).toEqual([400, 400, 200]);
  });

  it('always makes progress for invalid page heights', () => {
    expect(paginate(3, 0, [])).toEqual([1, 1, 1]);
    expect(paginate(0, 400, [])).toEqual([]);
  });
});

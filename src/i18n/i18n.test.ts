import { describe, it, expect } from 'vitest';
import de from './de';
import en from './en';

// Rekursiv alle Keys als Pfade sammeln (a.b.c) — fängt fehlende Übersetzungen.
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? collectKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

function collectValues(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((value) =>
    typeof value === 'object' && value !== null
      ? collectValues(value as Record<string, unknown>)
      : [String(value)],
  );
}

describe('i18n resources', () => {
  it('have identical key sets in de and en', () => {
    expect(collectKeys(en).sort()).toEqual(collectKeys(de).sort());
  });

  it('have no empty strings', () => {
    expect(collectValues(de).filter((v) => v.trim() === '')).toEqual([]);
    expect(collectValues(en).filter((v) => v.trim() === '')).toEqual([]);
  });

  it('keep interpolation placeholders consistent across languages', () => {
    const placeholders = (value: string) => (value.match(/{{\s*\w+\s*}}/g) ?? []).sort();
    function walk(d: Record<string, unknown>, e: Record<string, unknown>) {
      for (const [key, dv] of Object.entries(d)) {
        const ev = e[key];
        if (typeof dv === 'object' && dv !== null) {
          walk(dv as Record<string, unknown>, ev as Record<string, unknown>);
        } else if (typeof dv === 'string' && typeof ev === 'string') {
          expect(placeholders(ev), `placeholders for "${key}"`).toEqual(placeholders(dv));
        }
      }
    }
    walk(de, en);
  });
});

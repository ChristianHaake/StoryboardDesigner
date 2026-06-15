import { describe, it, expect } from 'vitest';
import de from './de';
import en from './en';
import es from './es';
import fr from './fr';

const TRANSLATIONS = { en, es, fr } as const;

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
  const deKeys = collectKeys(de).sort();

  it.each(Object.keys(TRANSLATIONS))('has identical key set in de and %s', (lang) => {
    expect(collectKeys(TRANSLATIONS[lang as keyof typeof TRANSLATIONS]).sort()).toEqual(deKeys);
  });

  it('have no empty strings', () => {
    for (const resource of [de, ...Object.values(TRANSLATIONS)]) {
      expect(collectValues(resource).filter((v) => v.trim() === '')).toEqual([]);
    }
  });

  it.each(Object.keys(TRANSLATIONS))(
    'keeps interpolation placeholders consistent in %s',
    (lang) => {
      const placeholders = (value: string) => (value.match(/{{\s*\w+\s*}}/g) ?? []).sort();
      function walk(d: Record<string, unknown>, e: Record<string, unknown>) {
        for (const [key, dv] of Object.entries(d)) {
          const ev = e[key];
          if (typeof dv === 'object' && dv !== null) {
            walk(dv as Record<string, unknown>, ev as Record<string, unknown>);
          } else if (typeof dv === 'string' && typeof ev === 'string') {
            expect(placeholders(ev), `placeholders for "${key}" in ${lang}`).toEqual(
              placeholders(dv),
            );
          }
        }
      }
      walk(de, TRANSLATIONS[lang as keyof typeof TRANSLATIONS]);
    },
  );
});

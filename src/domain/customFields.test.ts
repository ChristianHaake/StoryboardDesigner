import { describe, expect, it } from 'vitest';
import {
  MAX_CUSTOM_FIELDS,
  createCustomFieldDefinition,
  getFormatPreset,
  mergeFormatPreset,
  normalizeSelectOptions,
  validateCustomFieldLabel,
  validateSelectOptions,
} from './customFields';

describe('customFields', () => {
  it('provides stable format presets with a select shot-size', () => {
    const film = getFormatPreset('film');
    expect(film.map((definition) => definition.key)).toEqual([
      'preset:film:shot-size',
      'preset:film:camera-movement',
      'preset:film:caption',
    ]);
    const shotSize = film[0];
    expect(shotSize.type).toBe('select');
    expect(shotSize.options).toContain('Totale');
    expect(shotSize.options).toContain('Nahaufnahme');
    expect(getFormatPreset('custom')).toEqual([]);
  });

  it('merges missing presets without duplicate keys or labels', () => {
    const existing = [{ key: 'custom:camera', label: 'Kameraeinstellung' }];
    const merged = mergeFormatPreset(existing, 'film');

    // shot-size wird wegen Label-Dublette übersprungen; Bewegung + Bildunterschrift kommen dazu.
    expect(merged.added).toBe(2);
    expect(merged.definitions.map((definition) => definition.label)).toEqual([
      'Kameraeinstellung',
      'Kamerabewegung',
      'Bildunterschrift',
    ]);
  });

  it('validates labels independently of casing', () => {
    const definitions = [{ key: 'one', label: 'Kernaussage' }];
    expect(validateCustomFieldLabel('  ', definitions)).toContain('eingeben');
    expect(validateCustomFieldLabel('kernaussage', definitions)).toContain('bereits');
    expect(validateCustomFieldLabel('Visualisierung', definitions)).toBeNull();
  });

  it('normalizes and validates select options', () => {
    expect(normalizeSelectOptions([' Totale ', 'Nah', 'nah', ''])).toEqual(['Totale', 'Nah']);
    expect(validateSelectOptions([' ', ''])).toContain('Auswahloption');
    expect(validateSelectOptions(['Totale'])).toBeNull();
  });

  it('creates select field definitions with cleaned options', () => {
    const field = createCustomFieldDefinition('Einstellung', 'select', ['A', 'A', ' B ']);
    expect(field.type).toBe('select');
    expect(field.options).toEqual(['A', 'B']);
    expect(field.key.startsWith('custom:')).toBe(true);
  });

  it('respects the maximum field count when merging presets', () => {
    const definitions = Array.from({ length: MAX_CUSTOM_FIELDS }, (_, index) => ({
      key: `custom:${index}`,
      label: `Feld ${index}`,
    }));

    expect(mergeFormatPreset(definitions, 'film')).toEqual({
      definitions,
      added: 0,
    });
  });
});

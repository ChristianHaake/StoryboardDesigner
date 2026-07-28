import { describe, expect, it } from 'vitest';
import {
  MAX_CUSTOM_FIELDS,
  createCustomFieldDefinition,
  getFormatPreset,
  isPresetVisible,
  isRetiredPreset,
  mergeFormatPreset,
  normalizeSelectOptions,
  presetProductType,
  validateCustomFieldLabel,
  validateSelectOptions,
} from './customFields';

describe('customFields', () => {
  it('provides stable format presets with a select shot-size', () => {
    const film = getFormatPreset('shortFilm');
    expect(film.map((definition) => definition.key)).toEqual([
      'preset:shortFilm:shot-size',
      'preset:shortFilm:camera-movement',
    ]);
    const shotSize = film[0];
    expect(shotSize.type).toBe('select');
    expect(shotSize.options).toContain('Totale');
    expect(shotSize.options).toContain('Nahaufnahme');
    expect(shotSize.options).not.toContain('Vogelperspektive');
    expect(shotSize.options).not.toContain('Froschperspektive');
    expect(shotSize.options).toContain('Amerikanische Einstellung');
    expect(film.every((definition) => definition.description)).toBe(true);
    expect(getFormatPreset('custom')).toEqual([]);
  });

  it('shows known presets only for their owner format and minimum detail level', () => {
    expect(presetProductType('preset:shortFilm:caption')).toBe('shortFilm');
    expect(isRetiredPreset('preset:shortFilm:caption')).toBe(true);
    expect(isPresetVisible('preset:shortFilm:caption', 'shortFilm', 'simple')).toBe(false);
    expect(isPresetVisible('preset:shortFilm:caption', 'shortFilm', 'standard')).toBe(false);
    expect(isPresetVisible('preset:shortFilm:caption', 'fotostory', 'advanced')).toBe(false);
    expect(isPresetVisible('custom:teacher-note', 'fotostory', 'simple')).toBe(true);
  });

  it('merges missing presets without duplicate keys or labels', () => {
    const existing = [{ key: 'custom:camera', label: 'Kameraeinstellung' }];
    const merged = mergeFormatPreset(existing, 'shortFilm');

    // shot-size wird wegen Label-Dublette übersprungen; nur Bewegung kommt dazu.
    expect(merged.added).toBe(1);
    expect(merged.definitions.map((definition) => definition.label)).toEqual([
      'Kameraeinstellung',
      'Kamerabewegung',
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

    expect(mergeFormatPreset(definitions, 'shortFilm')).toEqual({
      definitions,
      added: 0,
    });
  });
});

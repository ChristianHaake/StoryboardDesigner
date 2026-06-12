import { describe, expect, it } from 'vitest';
import {
  MAX_CUSTOM_FIELDS,
  getFormatPreset,
  mergeFormatPreset,
  validateCustomFieldLabel,
} from './customFields';

describe('customFields', () => {
  it('provides stable format presets', () => {
    expect(getFormatPreset('film')).toEqual([
      { key: 'preset:film:shot-size', label: 'Kameraeinstellung' },
      { key: 'preset:film:camera-movement', label: 'Kamerabewegung' },
    ]);
    expect(getFormatPreset('custom')).toEqual([]);
  });

  it('merges missing presets without duplicate keys or labels', () => {
    const existing = [{ key: 'custom:camera', label: 'Kameraeinstellung' }];
    const merged = mergeFormatPreset(existing, 'film');

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

  it('respects the maximum field count when merging presets', () => {
    const definitions = Array.from({ length: MAX_CUSTOM_FIELDS }, (_, index) => ({
      key: `custom:${index}`,
      label: `Feld ${index}`,
    }));

    expect(mergeFormatPreset(definitions, 'rede')).toEqual({
      definitions,
      added: 0,
    });
  });
});

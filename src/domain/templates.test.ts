import { describe, expect, it } from 'vitest';
import { buildStarterProject, STARTER_FORMATS } from './templates';

describe('starter projects', () => {
  it('starts every example in the reduced detail level with matching presets', () => {
    for (const format of STARTER_FORMATS) {
      const project = buildStarterProject(format);
      expect(project.metaData.complexity).toBe('simple');
      expect(project.metaData.productType).toBe(format);
      expect(project.scenes).toHaveLength(2);
      expect(project.scenes.every((scene) => !scene.customFields)).toBe(true);
      expect(
        project.fieldDefinitions?.every((definition) =>
          definition.key.startsWith(`preset:${format}:`),
        ) ?? true,
      ).toBe(true);
    }
  });
});

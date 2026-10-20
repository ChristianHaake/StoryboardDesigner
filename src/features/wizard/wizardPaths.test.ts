import { describe, expect, it } from 'vitest';
import { PATH_BY_STEP, STEP_BY_PATH, WIZARD_PATHS, clampStep } from './wizardPaths';

describe('wizard paths', () => {
  it('maps every step to a unique path and back', () => {
    expect(new Set(WIZARD_PATHS).size).toBe(WIZARD_PATHS.length);
    for (const [step, path] of Object.entries(PATH_BY_STEP)) {
      expect(STEP_BY_PATH[path]).toBe(step);
    }
  });

  it('limits steps to what the project state allows', () => {
    const none = { hasContent: false, projectName: '' };
    const noName = { hasContent: true, projectName: '  ' };
    const named = { hasContent: true, projectName: 'Film' };

    expect(clampStep('export', none)).toBe('start');
    expect(clampStep('setup', none)).toBe('start');
    expect(clampStep('editor', noName)).toBe('setup');
    expect(clampStep('review', noName)).toBe('setup');
    expect(clampStep('setup', noName)).toBe('setup');
    for (const step of ['start', 'setup', 'editor', 'review', 'export'] as const) {
      expect(clampStep(step, named)).toBe(step);
    }
  });
});

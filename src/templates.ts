import type { MetaData, Scene, StoryboardProject } from './types';
import { generateId } from './utils/idGenerator';
import { getFormatPreset } from './utils/customFields';
import { PROJECT_VERSION } from './utils/projectCodec';
import i18n from './i18n';

// Beispielvorlagen (#10): pro Format ein Starter-Projekt mit vorkonfigurierten
// Feldern (Format-Preset) und lokalisierten Beispielinhalten. Texte kommen aus
// i18n, damit die Vorlage in der aktiven Sprache erscheint.

export type StarterFormat = Exclude<MetaData['formatType'], 'custom'>;
export const STARTER_FORMATS: StarterFormat[] = ['film', 'fotostory', 'rede'];

// Welche Text-Preset-Felder je Format mit Beispielwerten befüllt werden, plus
// der zugehörige (flache) i18n-Key-Teil. Select-Felder bleiben leer — ihre
// Optionen sind sprachabhängig und sollen vom Nutzer gewählt werden.
// i18n ist auf zwei Ebenen begrenzt (namespace.key), daher flache Keys.
const TEXT_FIELDS: Record<StarterFormat, { key: string; part: string }[]> = {
  film: [
    { key: 'preset:film:camera-movement', part: 'CameraMovement' },
    { key: 'preset:film:caption', part: 'Caption' },
  ],
  fotostory: [
    { key: 'preset:fotostory:framing', part: 'Framing' },
    { key: 'preset:fotostory:caption', part: 'Caption' },
  ],
  rede: [
    { key: 'preset:rede:key-message', part: 'KeyMessage' },
    { key: 'preset:rede:visualization', part: 'Visualization' },
    { key: 'preset:rede:caption', part: 'Caption' },
  ],
};

function makeScene(format: StarterFormat, index: number): Scene {
  const t = i18n.t;
  const n = index + 1;
  const prefix = `templates.${format}S${n}`;
  const customFields: Record<string, string> = {};
  for (const { key, part } of TEXT_FIELDS[format]) {
    const value = t(`${prefix}${part}`, { defaultValue: '' });
    if (value) customFields[key] = value;
  }
  return {
    id: generateId(),
    orderIndex: index,
    imageFileName: null,
    visualDescription: t(`${prefix}Visual`, { defaultValue: '' }),
    audioText: t(`${prefix}Audio`, { defaultValue: '' }),
    directorNotes: t(`${prefix}Notes`, { defaultValue: '' }),
    ...(Object.keys(customFields).length > 0 ? { customFields } : {}),
  };
}

export function buildStarterProject(format: StarterFormat): StoryboardProject {
  const t = i18n.t;
  const metaData: MetaData = {
    id: generateId(),
    projectName: t(`templates.${format}Name`),
    participants: '',
    subject: t(`templates.${format}Subject`, { defaultValue: '' }),
    formatType: format,
    date: '',
  };
  return {
    version: PROJECT_VERSION,
    metaData,
    prePlanning: {
      logline: t(`templates.${format}Logline`, { defaultValue: '' }),
      objective: t(`templates.${format}Objective`, { defaultValue: '' }),
      roles: t(`templates.${format}Roles`, { defaultValue: '' }),
      resources: t(`templates.${format}Resources`, { defaultValue: '' }),
    },
    fieldDefinitions: getFormatPreset(format),
    scenes: [makeScene(format, 0), makeScene(format, 1)],
  };
}

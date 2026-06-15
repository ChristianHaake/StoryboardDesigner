import type { MetaData, Scene, StoryboardProject } from './types';
import { generateId } from '../shared/utils/idGenerator';
import { getFormatPreset } from './customFields';
import { PROJECT_VERSION } from './projectCodec';
import i18n from '../shared/i18n';

// Beispielvorlagen (#10): pro Format ein Starter-Projekt mit vorkonfigurierten
// Feldern (Format-Preset) und lokalisierten Beispielinhalten. Texte kommen aus
// i18n, damit die Vorlage in der aktiven Sprache erscheint.

export type StarterFormat = Exclude<MetaData['productType'], 'custom'>;
export const STARTER_FORMATS: StarterFormat[] = ['shortFilm', 'fotostory'];

// Welche Text-Preset-Felder je Format mit Beispielwerten befüllt werden, plus
// der zugehörige (flache) i18n-Key-Teil. Select-Felder bleiben leer — ihre
// Optionen sind sprachabhängig und sollen vom Nutzer gewählt werden.
// i18n ist auf zwei Ebenen begrenzt (namespace.key), daher flache Keys.
const TEXT_FIELDS: Partial<Record<StarterFormat, { key: string; part: string }[]>> = {
  shortFilm: [
    { key: 'preset:shortFilm:camera-movement', part: 'CameraMovement' },
    { key: 'preset:shortFilm:caption', part: 'Caption' },
  ],
  fotostory: [
    { key: 'preset:fotostory:framing', part: 'Framing' },
    { key: 'preset:fotostory:caption', part: 'Caption' },
  ],
};

function makeScene(format: StarterFormat, index: number): Scene {
  const t = i18n.t;
  const n = index + 1;
  const prefix = `templates.${format}S${n}`;
  const customFields: Record<string, string> = {};
  const fields = TEXT_FIELDS[format] || [];
  for (const { key, part } of fields) {
    const value = t(`${prefix}${part}`, { defaultValue: '' });
    if (value) customFields[key] = value;
  }
  return {
    id: generateId(),
    orderIndex: index,
    imageFileName: null,
    title: '',
    action: t(`${prefix}Notes`, { defaultValue: '' }),
    text: t(`${prefix}Audio`, { defaultValue: '' }),
    audio: { dialogue: '', soundEffects: '', music: '' },
    camera: { shotSize: '', angle: '', movement: '' },
    location: '',
    materials: [],
    imageFit: 'cover',
    ...(Object.keys(customFields).length > 0 ? { customFields } : {}),
  };
}

export function buildStarterProject(format: StarterFormat): StoryboardProject {
  const t = i18n.t;
  const metaData: MetaData = {
    id: generateId(),
    projectName: t(`templates.${format}Name`),
    groupMembers: [],
    topic: '',
    complexity: 'standard',
    subject: t(`templates.${format}Subject`, { defaultValue: '' }),
    productType: format,
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

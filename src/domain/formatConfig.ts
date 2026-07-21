import type { ProductType } from './types';

export interface FormatFeatures {
  hasImage: boolean;
  hasCameraSize: boolean;
  hasCameraMovement: boolean;
  hasAudioEffects: boolean; // Musik & Sound
  hasLocation: boolean;
}

export const FORMAT_FEATURES: Record<ProductType, FormatFeatures> = {
  // Video-based formats
  // shortFilm: Kameraeinstellung/-bewegung kommen aus den Format-Presets
  // (Dropdown mit Fachbegriffen), daher hier die generischen Einbaufelder aus,
  // sonst erscheint jedes Feld doppelt.
  shortFilm: {
    hasImage: true,
    hasCameraSize: false,
    hasCameraMovement: false,
    hasAudioEffects: true,
    hasLocation: true,
  },
  explainerVideo: {
    hasImage: true,
    hasCameraSize: true,
    hasCameraMovement: true,
    hasAudioEffects: true,
    hasLocation: true,
  },
  socialMediaClip: {
    hasImage: true,
    hasCameraSize: true,
    hasCameraMovement: true,
    hasAudioEffects: true,
    hasLocation: true,
  },
  // stopMotion: Kamera steht fest, Objekte bewegen sich. Statt „Kamerabewegung"
  // liefert das Preset ein Einzelbilder-Feld; Einstellungsgröße kommt als Preset.
  stopMotion: {
    hasImage: true,
    hasCameraSize: false,
    hasCameraMovement: false,
    hasAudioEffects: true,
    hasLocation: true,
  },
  custom: {
    hasImage: true,
    hasCameraSize: true,
    hasCameraMovement: true,
    hasAudioEffects: true,
    hasLocation: true,
  },

  // Static visual formats: Bildausschnitt/Sprechblase kommen als Presets,
  // daher generisches Einstellungsgrößen-Einbaufeld aus (sonst Dopplung).
  fotostory: {
    hasImage: true,
    hasCameraSize: false,
    hasCameraMovement: false,
    hasAudioEffects: false,
    hasLocation: true,
  },
  comic: {
    hasImage: true,
    hasCameraSize: false,
    hasCameraMovement: false,
    hasAudioEffects: false,
    hasLocation: true,
  },

  // Audio-only formats
  podcast: {
    hasImage: false,
    hasCameraSize: false,
    hasCameraMovement: false,
    hasAudioEffects: true,
    hasLocation: false,
  },
  audioPlay: {
    hasImage: false,
    hasCameraSize: false,
    hasCameraMovement: false,
    hasAudioEffects: true,
    hasLocation: false,
  },

  // Stage formats
  roleplay: {
    hasImage: true,
    hasCameraSize: false,
    hasCameraMovement: false,
    hasAudioEffects: true,
    hasLocation: true,
  },
};

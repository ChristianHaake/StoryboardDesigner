// Zentrale Datenstrukturen der .storyboard-Datei (data.json), siehe Codingplan Abschnitt 2.

export type Complexity = 'simple' | 'standard' | 'advanced';
export type ProductType = 'shortFilm' | 'explainerVideo' | 'fotostory' | 'audioPlay' | 'podcast' | 'stopMotion' | 'comic' | 'socialMediaClip' | 'roleplay' | 'custom';

export interface MetaData {
  id: string;
  projectName: string;
  topic: string;
  subject: string;
  groupMembers: string[];
  productType: ProductType;
  complexity: Complexity;
  date: string;
}

export interface PrePlanning {
  logline: string;
  objective: string;
  roles: string;
  resources: string;
}

// Ab v1.4: szenenbezogenes Feedback (Lehrkraft kommentiert die .storyboard-Datei).
export interface SceneComment {
  id: string;
  text: string;
  done: boolean;
  createdAt: string; // ISO-Zeitstempel
}

export interface SceneAudio {
  dialogue: string;
  soundEffects: string;
  music: string;
}

export interface SceneCamera {
  shotSize: string;
  angle: string;
  movement: string;
}

export interface Scene {
  id: string;
  orderIndex: number;
  imageFileName: string | null;
  title: string;
  action: string;
  text: string;
  audio: SceneAudio;
  camera: SceneCamera;
  location: string;
  materials: string[];
  altText?: string;
  customFields?: Record<string, string>;
  comments?: SceneComment[];
  imageFit?: 'cover' | 'contain';
}

// Ab v1.1: projektweite Definition dynamischer Felder (Konfigurations-Modal).
// Ab v1.3: optionaler Feldtyp. Fehlt `type`, gilt 'text' (rückwärtskompatibel).
export type CustomFieldType = 'text' | 'select';

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type?: CustomFieldType; // default 'text'
  options?: string[]; // nur bei type 'select'
  description?: string; // ab v1.4: Hilfstext für das Feld
}

export interface StoryboardProject {
  version: string; // Für zukünftige Migrationen
  metaData: MetaData;
  prePlanning: PrePlanning;
  fieldDefinitions?: CustomFieldDefinition[]; // optional, wird erst ab v1.1 genutzt
  scenes: Scene[];
}

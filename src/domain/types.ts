// Zentrale Datenstrukturen der .storyboard-Datei (data.json), siehe Codingplan Abschnitt 2.

export interface MetaData {
  id: string;
  projectName: string;
  participants: string;
  subject: string;
  formatType: 'film' | 'fotostory' | 'custom';
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

export interface Scene {
  id: string;
  orderIndex: number;
  imageFileName: string | null; // Referenz auf die Bilddatei im ZIP
  visualDescription: string;
  audioText: string;
  directorNotes: string;
  altText?: string; // ab v1.4: barrierefreie Bildbeschreibung (Alt-Text)
  customFields?: Record<string, string>; // ab v1.1
  comments?: SceneComment[]; // ab v1.4
  imageFit?: 'cover' | 'contain'; // ab v1.5: Bildausrichtung
  duration?: number; // ab v1.5: Dauer in Sekunden (für Präsentationsmodus)
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

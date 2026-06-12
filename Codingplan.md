Hier ist der technische Umsetzungsplan für die Architektur und Entwicklung der Storyboard-App. Die Konzeption ist auf Skalierbarkeit, Wartbarkeit und den reinen Client-Betrieb mit Cloudflare Workers Static Assets ausgelegt.

### 1. Tech-Stack

- **Build-Tool & Framework:** Vite mit React und TypeScript. TypeScript sorgt für Typsicherheit beim Datenmodell, was bei zukünftigen Erweiterungen der JSON-Struktur Fehler verhindert.
- **State Management:** Zustand. Ein leichtgewichtiger Store, ideal für die Verwaltung lokaler App-Zustände ohne den Boilerplate-Code von Redux.
- **Styling:** Tailwind CSS für schnelles, komponentenbezogenes Styling.
- **Drag & Drop:** `@dnd-kit/core` und `@dnd-kit/sortable`. Barrierefrei, touch-kompatibel und performant.
- **ZIP-Verarbeitung:** `jszip` und `file-saver`. Zum Packen und Entpacken der `.storyboard`-Dateien direkt im Browser-Speicher.
- **Autosave:** `idb-keyval`. Debounced-Speicherung des Projektzustands inklusive Bild-Blobs in IndexedDB (localStorage ist für Bilder zu klein), damit bei Reload, Tab-Schließung oder Tablet-Sperre keine Arbeit verloren geht.
- **Markdown-Rendering:** `react-markdown`. Zum Parsen der `.md`-Dateien (Impressum, Datenschutz, Hilfetexte).
- **Routing:** `react-router-dom`. Für die Navigation zwischen Editor, Impressum und anderen statischen Seiten.

---

### 2. Datenmodell (TypeScript Interfaces)

Das Datenmodell definiert die Struktur der `data.json`, die im ZIP-Archiv gespeichert wird.

```typescript
// types.ts
export interface MetaData {
  id: string;
  projectName: string;
  participants: string;
  subject: string;
  formatType: 'film' | 'fotostory' | 'rede' | 'custom';
  date: string;
}

export interface PrePlanning {
  logline: string;
  objective: string;
  roles: string;
  resources: string;
}

export interface Scene {
  id: string;
  orderIndex: number;
  imageFileName: string | null; // Referenz auf die Bilddatei im ZIP
  visualDescription: string;
  audioText: string;
  directorNotes: string;
  customFields?: Record<string, string>; // Für dynamisch hinzugefügte Felder
}

// Ab v1.1: projektweite Definition dynamischer Felder (Konfigurations-Modal)
export interface CustomFieldDefinition {
  key: string;
  label: string;
}

export interface StoryboardProject {
  version: string; // Für zukünftige Migrationen
  metaData: MetaData;
  prePlanning: PrePlanning;
  fieldDefinitions?: CustomFieldDefinition[]; // optional, wird erst ab v1.1 genutzt
  scenes: Scene[];
}
```

---

### 3. Ordner- und Architekturstruktur

Die App folgt einem modularen Aufbau. Gemäß UIX-Plan gibt es keine Sidebar und keine separate Preview-View: Die Editor-Ansicht ist zugleich die druckoptimierte Ansicht — das Print-CSS blendet lediglich UI-Elemente (Top-Bar, Hover-Buttons, Platzhalter) aus.

```text
src/
├── assets/         // Statische Bilder, Icons
├── components/     // Wiederverwendbare UI-Elemente
│   ├── layout/     // TopBar, A4Page
│   ├── cards/      // SceneCard
│   └── forms/      // AutoResizeTextarea, Inputs
├── content/        // Markdown-Dateien (.md)
│   ├── impressum.md
│   └── hilfe.md
├── store/          // Zustand State Management
│   └── useStoryboardStore.ts
├── utils/          // Helfer-Funktionen
│   ├── zipHandler.ts    // JSZip Logik (Import/Export)
│   ├── imageResizer.ts  // Canvas-Downscaling beim Upload
│   ├── persistence.ts   // IndexedDB-Autosave (idb-keyval)
│   └── idGenerator.ts
├── views/          // Haupt-Routen
│   ├── EditorView.tsx   // WYSIWYG-A4-Arbeitsfläche (zugleich Druckansicht)
│   └── MarkdownView.tsx // Impressum, Datenschutz, Hilfe
└── App.tsx         // Routing-Setup

```

---

### 4. Implementierungsdetails der Kernfunktionen

#### A. Umgang mit Bildern und dem Speicher

Um den Arbeitsspeicher zu schonen, werden hochgeladene Bilder nicht als Base64-Strings im State gehalten.

1. **Upload:** Ein Bild wird über einen Datei-Input ausgewählt (auf Tablets inkl. Kamera/Fotos).
2. **Downscaling:** `imageResizer.ts` verkleinert das Bild clientseitig per Canvas auf max. 1600 px Kantenlänge (JPEG, Qualität ~0.85). Schülerfotos mit 12 MP würden sonst ZIP-Größe und Tablet-RAM sprengen.
3. **Blob/URL:** Die App generiert temporär eine `Object URL` (`URL.createObjectURL(blob)`) für die Vorschau. Der verkleinerte `Blob` wird im State gespeichert (nicht im JSON).
4. **Aufräumen:** Bei Bildtausch oder Szenen-Löschung wird die alte URL mit `URL.revokeObjectURL()` freigegeben, sonst entsteht ein Memory-Leak.
5. **Export:** `zipHandler.ts` iteriert über den State. Das JSON wird generiert. Alle Bild-Blobs werden in einen Unterordner `images/` im ZIP-Archiv geschrieben.
6. **Import:** Das ZIP wird entpackt. Die Bilder aus dem `images/`-Ordner werden als Blob extrahiert, mit neuen `Object URLs` versehen und in den State geladen.

#### A2. Autosave (IndexedDB)

Schul-Tablets werden ständig unterbrochen (Stundenwechsel, Gerätesperre, Tab-Schließung). Ohne Persistenz wäre die Arbeit weg.

1. **Speichern:** Jede Store-Änderung löst (debounced, ~1 s) ein Schreiben des kompletten `StoryboardProject` inklusive Bild-Blobs nach IndexedDB aus (`idb-keyval`, ein Key `currentProject`).
2. **Wiederherstellen:** Beim App-Start wird geprüft, ob ein Autosave existiert. Falls ja, wird er geladen und die Object URLs werden neu erzeugt.
3. **Sicherheitsnetz:** Eine `beforeunload`-Warnung erscheint nur, falls der letzte Autosave noch aussteht.
4. **Abgrenzung:** Autosave ersetzt nicht die `.storyboard`-Datei — er schützt nur die laufende Sitzung auf demselben Gerät/Browser.

#### B. Markdown-Dateien für statische Texte

Vite ermöglicht den direkten Import von Dateien als Raw-Text.

1. Die Dateien liegen unter `src/content/`.
2. Import in der Komponente: `import impressumText from '../content/impressum.md?raw'`.
3. Rendering in der Ansicht: `<ReactMarkdown>{impressumText}</ReactMarkdown>`.
4. Diese Lösung erfordert kein Backend und keine Fetch-Requests. Die Texte werden beim Build-Prozess direkt in das JavaScript-Bundle kompiliert.

#### C. Preview-Modus und PDF-Export

Der PDF-Export wird über die native Druckfunktion des Browsers (`window.print()`) gelöst. Dies erspart schwere PDF-Bibliotheken im Client.

**Wichtige Einordnung:** Die A4-Optik im Editor ist eine visuelle Orientierung, keine exakte Paginierung. Exakte Seitenumbrüche bestimmt der Browser-Druckdialog — mit auto-wachsenden Textareas und unterschiedlichen Print-Engines ist pixelgenaues WYSIWYG nicht einlösbar und wird nicht versprochen.

1. **Druckansicht = Editor-Ansicht:** Das Print-CSS blendet Top-Bar, Hover-Buttons und leere Platzhalter aus; eine separate Preview-View entfällt.
2. **CSS Print Media Queries:** `@page`-Regeln (Format A4, Ränder) plus `break-inside: avoid;` auf den Szenen-Karten, damit Karten nicht in der Mitte durchschnitten werden.
3. **Drucken:** Ein Button "PDF exportieren" ruft `window.print()` auf. Lernende nutzen den "Als PDF sichern"-Dialog des Betriebssystems.
4. **Frühe Verprobung:** Die Druckausgabe wird bereits ab Phase 3 auf Zielgeräten getestet — insbesondere iPad Safari (PDF-Erzeugung im Druckdialog ist dort umständlich, auf MDM-verwalteten Schulgeräten ggf. eingeschränkt).

#### D. Dynamische Felder und Formatvorlagen — umgesetzt in v1.1

Die Kernfelder Bildbeschreibung, Text/Ton und Regieanweisung bleiben immer
erhalten. Zusatzfelder werden projektweit in `fieldDefinitions` aus stabilem
`key` und editierbarem `label` definiert. Szenen speichern ihre Werte unter
`customFields[key]`.

Pro Projekt sind maximal 20 Zusatzfelder zulässig. Labels sind maximal 60
Zeichen lang, nicht leer und unabhängig von Großschreibung eindeutig. Der
Dialog „Felder konfigurieren“ unterstützt Hinzufügen, Umbenennen und Löschen.
Beim Löschen werden Definition und Werte nach Bestätigung aus allen Szenen
entfernt.

Formatvorlagen ergänzen nur fehlende Felder:

- Film: Kameraeinstellung, Kamerabewegung
- Fotostory: Bildausschnitt, Sprechblase / Text
- Rede: Kernaussage, Visualisierung
- Eigenes Format: keine automatischen Felder

Reservierte Schlüssel verhindern doppelte Vorlagenfelder. Formatwechsel
verändern weder eigene Felder noch vorhandene Werte. Dateien der Version 1.0
werden beim Import auf das 1.1-Modell normalisiert.

---

### 5. Entwicklungsphasen (Meilensteine)

- **Phase 1: Setup & State:** Initialisierung von Vite, Tailwind und Zustand. Definition des Store-Modells inklusive CRUD-Operationen für Szenen.
- **Phase 2: Layout & Markdown:** Aufbau der dokumentenzentrierten Ansicht ohne Sidebar. Implementierung des Routers und der Markdown-View für statische Inhalte.
- **Phase 3: Editor & Drag-and-Drop:** Entwicklung der Szenen-Karten mit Eingabefeldern und Bild-Upload (Downscaling, Object-URL-Handling inkl. Revocation). Integration von `dnd-kit` für die Sortierung. Print-CSS und erster Drucktest auf Zielgeräten.
- **Phase 4: Import / Export & Autosave:** Programmierung des `zipHandler.ts` (Generierung und fehlerfreies Einlesen der `.storyboard`-Dateien) sowie des IndexedDB-Autosaves (`persistence.ts`).
- **Phase 5: Feinschliff & Print:** Markdown-Seiten, responsives Design, finale Print-CSS-Abnahme auf iPad Safari.
- **Phase 6: Deployment:** Konfiguration des Repositories für das automatische Deployment über Cloudflare Workers Static Assets.
- **Phase 7: Version 1.1:** Rechtstexte, kompatibles Feldschema, Formatvorlagen, Konfigurationsdialog und Abnahme aller Datenwege.

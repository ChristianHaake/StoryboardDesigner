# Architektur

Technischer Überblick für Entwickler:innen. Ist-Zustand nach Sprint 2; geplante Teile sind markiert.
Detailplanung: [Codingplan.md](Codingplan.md) (Architektur-Soll), [UIX-Codingplan.md](UIX-Codingplan.md) (UI-Konzept), [Sprint-Planung.md](Sprint-Planung.md) (Roadmap).

## Kontext und Ziele

Storyboard-Editor für Lernende an Schulen. Harte Anforderungen:

- **Kein Backend** — DSGVO-unkritisch, keine Accounts, lauffähig als statisches Hosting (Cloudflare Pages).
- **Schul-Tablets** als primäre Zielgeräte (iPad Safari, Touch, geteilte Geräte, häufige Unterbrechungen).
- **Datei-basierter Austausch** — Projekte als portable `.storyboard`-Datei, PDF über den Browser.

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand 5 · @dnd-kit · idb-keyval · (Sprint 4: jszip + file-saver) · (Sprint 5: react-markdown, react-router-dom)

## Datenfluss

```text
        Eingabe (controlled inputs)
                 │
                 ▼
   useStoryboardStore (Zustand)          ← einzige Quelle der Wahrheit
   metaData · prePlanning · scenes[]
   touched · lastDeleted
                 │
    ┌────────────┼──────────────────────┐
    │ subscribe  │ selectProject()      │ (Sprint 4)
    ▼            ▼                      ▼
 React-UI   Autosave (debounced 1 s)  zipHandler
 (Editor =  → IndexedDB               → .storyboard (ZIP:
  Druck-      'currentProject'           data.json + images/)
  ansicht)       │
                 ▼ App-Start
            Restore (nur wenn !touched)
```

- **`selectProject(state)`** serialisiert den Store als `StoryboardProject` — dieselbe Struktur landet im Autosave und (Sprint 4) als `data.json` im ZIP. Schema-Versionierung über das `version`-Feld.
- **Autosave** ([src/utils/persistence.ts](src/utils/persistence.ts)): debounced, Sequenz-Guard verhindert, dass ein noch laufender älterer Save das `pending`-Flag löscht. `pending` speist die `beforeunload`-Warnung.
- **Restore-Guard:** `touched` wird von jeder mutierenden Store-Aktion gesetzt. Der asynchrone Restore beim App-Start schreibt nur in einen unberührten Store — verhindert Überschreiben frischer Eingaben.

## Komponenten

```text
App ─ Autosave-Wiring (Effect), beforeunload
├── TopBar            Sticky-Aktionen (Laden/Speichern/PDF — ab Sprint 3/4 verdrahtet)
├── EditorView        A4-Arbeitsfläche; DndContext + SortableContext
│   ├── A4Page        Weißes "Papier", Print-Reset
│   ├── (Metadaten + Planung: controlled inputs, AutoResizeTextarea)
│   └── SceneCard[]   useSortable; Bild-Platzhalter (Upload: Sprint 3),
│                     3 Textfelder, Hover-/Touch-Aktionen
└── UndoSnackbar      Rückgängig für Szenen-Löschung (6 s Fenster)
```

## Entscheidungen und Trade-offs

| Entscheidung | Begründung | Trade-off |
|---|---|---|
| Editor-Ansicht = Druckansicht (kein separater Preview) | Eine Wahrheit, WYSIWYG-Nähe; Print-CSS blendet nur UI aus | A4-Optik ist Orientierung, keine exakte Paginierung — Seitenumbrüche bestimmt der Druckdialog |
| `window.print()` statt PDF-Library | ~0 kB statt >500 kB Bundle; OS-Dialog vertraut | iPad-Bedienung umständlich; Layout-Hoheit beim Browser |
| IndexedDB-Autosave zusätzlich zur Datei | Geteilte Schulgeräte, ständige Unterbrechungen | Autosave ist gerätegebunden — Datei bleibt das echte Backup (so auch in der Hilfe kommuniziert) |
| ZIP (`.storyboard`) als Dateiformat | Bilder + JSON in einer Datei, portabel, inspizierbar | Import muss defensiv parsen (Sprint 4: Validierung gegen Schema, Größenlimits) |
| Object URLs statt Base64 im State | RAM-schonend auf Tablets | URL-Lifecycle managen (`revokeObjectURL` bei Tausch/Löschung — Sprint 3) |
| Undo-Puffer (`lastDeleted`) statt Lösch-Dialog | Touch-Fehltipps häufig; Dialog nervt bei absichtlichem Löschen | Nur einstufiges Undo, nur für Szenen-Löschung |

## Bekannte Grenzen / offene Punkte

- Drucktest auf echten Zielgeräten (iPad Safari, MDM) steht aus — Aufgabe in Sprint 3.
- ZIP-Import (Sprint 4) ist die sicherheitsrelevanteste Stelle: Eingaben validieren, Bildanzahl/-größe begrenzen, unbekannte Felder tolerieren (Forward-Kompatibilität).
- Keine automatisierten Tests; Store-Logik (renumber/duplicate/move) ist pure-function-testbar — Vitest-Setup vor Sprint 4 empfohlen.
- `customFields`/`formatType`-Differenzierung bewusst auf v1.1 verschoben ([Codingplan.md](Codingplan.md), Abschnitt D).

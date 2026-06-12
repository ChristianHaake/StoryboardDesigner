# Architektur

Technischer Überblick für Entwickler:innen. Ist-Zustand nach Sprint 6 (Release Hardening).
Detailplanung: [Codingplan.md](Codingplan.md) (Architektur-Soll), [UIX-Codingplan.md](UIX-Codingplan.md) (UI-Konzept), [Sprint-Planung.md](Sprint-Planung.md) (Roadmap).

## Kontext und Ziele

Storyboard-Editor für Lernende an Schulen. Harte Anforderungen:

- **Kein Backend** — keine Accounts oder Inhaltsübertragung, ausgeliefert über Cloudflare Workers Static Assets.
- **Schul-Tablets** als primäre Zielgeräte (iPad Safari, Touch, geteilte Geräte, häufige Unterbrechungen).
- **Datei-basierter Austausch** — Projekte als portable `.storyboard`-Datei, PDF über den Browser.

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand 5 · @dnd-kit · idb-keyval · jszip · file-saver · react-markdown · react-router-dom · Vitest

## Datenfluss

```text
        Eingabe (controlled inputs)
                 │
                 ▼
   useStoryboardStore (Zustand)          ← einzige Quelle der Wahrheit
   metaData · prePlanning · fieldDefinitions · scenes[]
   touched · hasContent · lastDeleted
                 │
    ┌────────────┼──────────────────────┐
    │ subscribe  │ selectProject()      │
    ▼            ▼                      ▼
 React-UI   Autosave (debounced 1 s)  zipHandler
 (Editor =  → IndexedDB               → .storyboard (ZIP:
  Druck-      'currentProject'           data.json + images/)
  ansicht)       │
                 ▼ App-Start
            Restore (nur wenn !touched)
```

- **`selectProject(state)`** serialisiert den Store als `StoryboardProject` — dieselbe Struktur landet im Autosave und als `data.json` im ZIP.
- **`decodeProject(raw)`** ist der gemeinsame Validierungs- und Migrationspfad für ZIP und IndexedDB. Neuere Major-Versionen werden abgewiesen; v1-Daten werden normalisiert.
- **Autosave** ([src/utils/persistence.ts](src/utils/persistence.ts)): debounced, Sequenz-Guard verhindert, dass ein noch laufender älterer Save das `pending`-Flag löscht. `pending` speist die `beforeunload`-Warnung.
- **Restore-Guard:** `touched` wird von jeder mutierenden Store-Aktion gesetzt. Der asynchrone Restore beim App-Start schreibt nur in einen unberührten Store — verhindert Überschreiben frischer Eingaben.

## Komponenten

```text
App ─ Autosave-Wiring (Effect), beforeunload
├── TopBar            Sticky-Aktionen für Laden, Speichern und PDF
├── EditorView        A4-Arbeitsfläche; DndContext + SortableContext
│   ├── A4Page        Weißes "Papier", Print-Reset
│   ├── (Metadaten + Planung: controlled inputs, AutoResizeTextarea)
│   └── SceneCard[]   useSortable; Bild-Upload,
│                     3 Textfelder, Hover-/Touch-Aktionen
└── Notifications     Importfehler und Rückgängig für Szenen-Löschung
```

## Entscheidungen und Trade-offs

| Entscheidung                                           | Begründung                                                     | Trade-off                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Editor-Ansicht = Druckansicht (kein separater Preview) | Eine Wahrheit, WYSIWYG-Nähe; Print-CSS blendet nur UI aus      | A4-Optik ist Orientierung, keine exakte Paginierung — Seitenumbrüche bestimmt der Druckdialog   |
| `window.print()` statt PDF-Library                     | ~0 kB statt >500 kB Bundle; OS-Dialog vertraut                 | iPad-Bedienung umständlich; Layout-Hoheit beim Browser                                          |
| IndexedDB-Autosave zusätzlich zur Datei                | Geteilte Schulgeräte, ständige Unterbrechungen                 | Autosave ist gerätegebunden — Datei bleibt das echte Backup (so auch in der Hilfe kommuniziert) |
| ZIP (`.storyboard`) als Dateiformat                    | Bilder + JSON in einer Datei, portabel, inspizierbar           | Import validiert Schema, Anzahl sowie Einzel- und Gesamtgröße                                   |
| Object URLs statt Base64 im State                      | RAM-schonend auf Tablets                                       | Store verwaltet `createObjectURL`/`revokeObjectURL`                                             |
| Undo-Puffer (`lastDeleted`) statt Lösch-Dialog         | Touch-Fehltipps häufig; Dialog nervt bei absichtlichem Löschen | Nur einstufiges Undo, nur für Szenen-Löschung                                                   |

## Bekannte Grenzen / offene Punkte

- Drucktest auf echten Zielgeräten (iPad Safari, MDM) steht aus — Aufgabe in Sprint 3.
- Impressum und Datenschutzerklärung enthalten bis zur Eintragung der verantwortlichen Person Platzhalter.
- ZIP-Import bleibt sicherheitsrelevant: Limits und Codec sind automatisiert getestet und müssen bei Schemaänderungen mitgepflegt werden.
- Vitest deckt Codec und zentrale Store-Übergänge ab; Browser-/Drucktests bleiben manuell.
- `customFields`/`formatType`-Differenzierung bewusst auf v1.1 verschoben ([Codingplan.md](Codingplan.md), Abschnitt D).

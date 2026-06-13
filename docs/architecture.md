# Architektur

Technischer Überblick für Entwickler:innen. Ist-Zustand nach Version 1.4.
Detailplanung: [Codingplan.md](planning/Codingplan.md) (Architektur-Soll), [UIX-Codingplan.md](planning/UIX-Codingplan.md) (UI-Konzept), [Sprint-Planung.md](planning/Sprint-Planung.md) (Roadmap).

## Kontext und Ziele

Storyboard-Editor für Lernende an Schulen. Harte Anforderungen:

- **Kein Backend** — keine Accounts oder Inhaltsübertragung, ausgeliefert über Cloudflare Workers Static Assets.
- **Schul-Tablets** als primäre Zielgeräte (iPad Safari, Touch, geteilte Geräte, häufige Unterbrechungen).
- **Datei-basierter Austausch** — Projekte als portable `.storyboard`-Datei, PDF über den Browser.

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand 5 · @dnd-kit · idb-keyval · jszip · file-saver · react-markdown · react-router-dom · i18next · react-i18next · i18next-browser-languagedetector · jspdf + html-to-image (lazy, PDF-Export) · Vitest

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
- **`decodeProject(raw)`** ist der gemeinsame Validierungs- und Migrationspfad für ZIP und IndexedDB. Neuere Major-Versionen werden abgewiesen; v1.0- und v1.1-Daten werden normalisiert.
- **Autosave** ([src/utils/persistence.ts](src/utils/persistence.ts)): debounced, Sequenz-Guard verhindert, dass ein noch laufender älterer Save das `pending`-Flag löscht. `pending` speist die `beforeunload`-Warnung.
- **Restore-Guard:** `touched` wird von jeder mutierenden Store-Aktion gesetzt. Der asynchrone Restore beim App-Start schreibt nur in einen unberührten Store.

## Mehrsprachigkeit

i18next-Singleton, Initialisierung synchron vor dem ersten React-Render (`src/main.tsx`). Browser-Sprache via `i18next-browser-languagedetector` (Reihenfolge: `localStorage` → `navigator`), Fallback Deutsch.

- Namespaces: `common`, `brand`, `hero`, `language`, `topbar`, `editor`, `format`, `presets`, `scene`, `dnd`, `fieldConfig`, `notifications`, `markdown`, `footer`, `fields`, `errors`
- Außerhalb von React-Komponenten: `i18n.t()` direkt (Store-Aktionen, Utils).
- Typsicherheit: Mapped-Type `Translations` in `src/i18n/en.ts` erzwingt Key-Parität mit DE-Referenz; `react-i18next.d.ts` bindet Typen für `useTranslation()`.
- Test: `src/i18n/i18n.test.ts` prüft Key-Parität, keine leeren Strings, konsistente Interpolations-Platzhalter.

## Komponenten

```text
App ─ Autosave-Wiring (Effect), beforeunload, html-lang + document.title (i18n)
├── TopBar            2-reihiger SMC-Header (sticky, print:hidden)
│   ├── BrandLogo     Marken-Logo mit Tagline
│   ├── StatusPill    „Inhalte bleiben lokal"-Pill
│   ├── LanguageToggle DE/EN-Segmentschalter
│   └── Aktionsbuttons  Laden / Speichern / PDF
├── InfoBanner        Amber-Bildungshinweis (print:hidden)
├── HeroIntro         Kicker + Headline + Subline (print:hidden)
├── EditorView        A4-Arbeitsfläche; DndContext + SortableContext
│   ├── A4Page        Weißes „Papier", Print-Reset
│   ├── (Metadaten + Planung: controlled inputs, AutoResizeTextarea)
│   ├── FieldConfigDialog Projektweite Zusatzfelder und Formatvorlagen
│   └── SceneCard[]   useSortable; Bild-Upload,
│                     3 Kernfelder, Zusatzfelder, Hover-/Touch-Aktionen
├── Notifications     Importfehler und Rückgängig für Szenen-Löschung
└── Footer            BrandLogo + Nav-Links + StatusPill (print:hidden)
```

## Design-System (SMC-Familie)

StoryboardDesigner folgt der visuellen Sprache von smc.haak3.de:

| Token         | Wert                                 |
| ------------- | ------------------------------------ |
| Akzent        | `blue-600` (#2563EB)                 |
| Hintergrund   | `slate-100` (#f1f5f9)                |
| Arbeitsfläche | Weiß, `rounded-xl`, weicher Schatten |
| Sekundär      | `emerald-*` (lokal), `amber-*` (Hinweis) |
| Chrome        | Vollständig `print:hidden`           |

## Entscheidungen und Trade-offs

| Entscheidung                                           | Begründung                                                     | Trade-off                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Editor-Ansicht = Druckansicht (kein separater Preview) | Eine Wahrheit, WYSIWYG-Nähe; Print-CSS blendet nur UI aus      | A4-Optik ist Orientierung, keine exakte Paginierung — Seitenumbrüche bestimmt der Druckdialog   |
| `window.print()` statt PDF-Library                     | ~0 kB statt >500 kB Bundle; OS-Dialog vertraut                 | iPad-Bedienung umständlich; Layout-Hoheit beim Browser                                          |
| IndexedDB-Autosave zusätzlich zur Datei                | Geteilte Schulgeräte, ständige Unterbrechungen                 | Autosave ist gerätegebunden — Datei bleibt das echte Backup (so auch in der Hilfe kommuniziert) |
| ZIP (`.storyboard`) als Dateiformat                    | Bilder + JSON in einer Datei, portabel, inspizierbar           | Import validiert Schema, Anzahl sowie Einzel- und Gesamtgröße                                   |
| Object URLs statt Base64 im State                      | RAM-schonend auf Tablets                                       | Store verwaltet `createObjectURL`/`revokeObjectURL`                                             |
| Undo-Puffer (`lastDeleted`) statt Lösch-Dialog         | Touch-Fehltipps häufig; Dialog nervt bei absichtlichem Löschen | Nur einstufiges Undo, nur für Szenen-Löschung                                                   |
| Formatvorlagen ergänzen nur fehlende Felder            | Formatwechsel bleibt nicht destruktiv                          | Nicht mehr benötigte Vorlagenfelder müssen bewusst gelöscht werden                              |
| Zusatzfelder besitzen stabile Schlüssel                | Umbenennen erhält alle Szenenwerte                             | Schlüssel sind technische, dauerhaft reservierte Projektbestandteile                            |
| i18next-Singleton statt React-Context                  | Nutzbar in Store-Aktionen und Utils ohne Komponenten-Kontext   | Sprache ändert sich global; kein selektives Übersetzen einzelner Teile                          |
| SMC-Chrome vollständig `print:hidden`                  | Druck zeigt nur A4-Inhalt, kein UI-Overhead                    | Markenelemente nicht im PDF sichtbar                                                            |
| Select-Feldtyp über `CustomFieldDefinition.type` (v1.3)| Dropdowns (z. B. Kameraeinstellung) ohne Kernfeld-Umbau        | Werte außerhalb der Optionen bleiben erhalten, sind aber nur als Altwert wählbar                |
| PDF-Export lazy (jspdf + html-to-image, eigener Chunk) | Echte .pdf-Datei (iPad-tauglich) ohne Main-Bundle-Bloat        | DOM→Bild→PDF ist Raster, kein selektierbarer Text; `window.print()` bleibt als Alternative      |
| Feedback dateibasiert in `Scene.comments` (v1.4)       | Kein Backend/Accounts — Lehrkraft kommentiert die `.storyboard` und gibt sie zurück | Kein Live-Austausch; Feedback-Modus ist reine Ansicht (nicht im Projekt persistiert)            |

## Bekannte Grenzen / offene Punkte

- Drucktest auf echten Zielgeräten (iPad Safari, MDM) steht aus.
- Rechtstexte (Impressum, Datenschutz) benötigen finale Prüfung durch den Betreiber.
- ZIP-Import bleibt sicherheitsrelevant: Limits und Codec sind automatisiert getestet und müssen bei Schemaänderungen mitgepflegt werden.
- Vitest deckt Codec, i18n-Parität und zentrale Store-Übergänge ab; Browser-/Drucktests bleiben manuell.

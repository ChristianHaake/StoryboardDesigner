# Accessibility & UX Backlog

Abgeleitet aus der Validierung der 12 Feature-Requests (2026-06-14) gegen den
[haak3-Standard](../standard-conformance.md) (`accessibility.md`,
`design-system.md`). Status zum Zeitpunkt der Validierung in Klammern.

Legende: ✅ erfüllt · 🟡 partiell · ❌ fehlt

## Priorisierung

Reihenfolge nach Aufwand/Nutzen. Querschnitt-Hinweis: #2 erzwingt die
Semantic-Token-Migration und schließt damit die größte Design-MUST-Lücke mit.

### P0 — Quick Wins ✅ ERLEDIGT (2026-06-14)

- [x] **#8 Datumsfeld ohne Vorbelegung** — `createInitialMetaData().date = ''`.
- [x] **#12 Reset-Funktion „Daten zurücksetzen"** — `clearAutosave()` (idb `del`),
  Store `resetProject()`, TopBar-Button mit `window.confirm`, Datenschutz-Doku.
- [x] **#6a Speicherhinweis** — `SaveIndicator` (`role=status` `aria-live=polite`)
  aus Autosave-Lifecycle; Autosave-Subscribe gegen UI-State-Loop abgesichert.
- [x] **#9b Tooltips für Icon-Buttons** — `title` zusätzlich zu `aria-label`.

### P1 — Token- & Theme-Paket ✅ ERLEDIGT (2026-06-14)

- [x] **Semantic Design Tokens** — Token-Block in `index.css`; Theming über
  Überschreiben der Tailwind-v4-`--color-*`-Variablen (keine className-Migration).
- [x] **#2 Dark-/High-Contrast-Modus** — Theme-Zyklus (light/dark/contrast),
  `localStorage`-Persistenz, No-Flash-Boot-Script, `color-scheme` dynamisch.
- [x] **#2 Einstellbare Schriftgröße** — `data-font` → 100/112,5/125 % (16/18/20px).
- [x] **`prefers-reduced-motion`** — globaler `@media`-Block in `index.css`.

### P2 — Editor-UX

- [x] **#5 Szenenübersicht / Sprung-Navigation** ✅ (2026-06-14)
  - `SceneNavigator`: nummerierte Chips ab 2 Szenen, Klick scrollt + fokussiert
    die Szene (`scene-<id>`, `scroll-mt`, `prefers-reduced-motion` beachtet).
    Drag-Reorder + Auto-Renummerierung bestanden bereits.
- [x] **#7 Bestätigungsdialog Szene-Löschen** ✅ entschieden (2026-06-14)
  - **Erfüllt via Undo-Snackbar** (6 s, stellt Szene + Bild wieder her). Standard
    verlangt Bestätigung nur bei nicht-trivial-reversiblem Verlust; Undo deckt das.
    Kein zusätzlicher Block-Dialog (vermiede Doppel-Reibung). Feld-Löschen behält
    `window.confirm` (nicht per Undo abgedeckt).
- [x] **#9a Onboarding-Overlay** ✅ (2026-06-14)
  - `OnboardingOverlay`: 3-Schritt-`<dialog>` (Fokus-Trap/Escape/Restore nativ),
    `localStorage`-Flag `onboardingSeen` → einmalig beim ersten Besuch.
- [x] **#10 Beispielvorlagen mit Inhalten** ✅ (2026-06-14)
  - `templates.ts` + `TemplatePicker` (im Leerzustand): Starter je Format mit
    Preset-Feldern + lokalisierten Beispiel-Szenen. Select-Felder bleiben leer
    (sprachabhängige Optionen). `loadProject`, Confirm bei vorhandenem Inhalt.
- [x] **#10 Gamification** ✅ (2026-06-14)
  - Fortschrittsbalken im `SceneNavigator` (`role=progressbar`): befüllte Szenen
    / gesamt.

### P3 — Größer / konzeptionell

- [x] **#4 Alt-Text pro Bild** ✅ (2026-06-14)
  - `Scene.altText` im Datenmodell + Codec-Round-Trip (Test), Eingabefeld bei
    vorhandenem Bild, treibt `<img alt>`. PDF-Raster trägt keinen Alt-Text →
    Limitation in `standard-conformance.md` dokumentiert (Editor/`.storyboard`
    sind die barrierefreien Pfade).
- [x] **#6b Generelles Undo/Redo** ✅ (2026-06-14)
  - `history.ts`-Manager (Snapshots von metaData/prePlanning/fieldDefinitions/
    scenes, Limit 50, Text-Burst-Coalescing). Buttons in TopBar (Flags
    `canUndo`/`canRedo`) + Shortcuts Ctrl/Cmd+Z / +Shift+Z / Ctrl+Y; in
    Textfeldern hat natives Undo Vorrang. Bilder nicht Teil der History.
- [x] **#11 Weitere Sprachen** ✅ (2026-06-14)
  - Spanisch (`es.ts`) + Französisch (`fr.ts`), `SUPPORTED_LANGUAGES`
    `['de','en','es','fr']`, `LanguageToggle` 4 Sprachen, Browser-Default über
    `LanguageDetector` (navigator). Paritäts-Test deckt jetzt ES/FR ab.

## Bereits erfüllt

- **#1 Sichtbare Labels** ✅ — `<label htmlFor>` an allen Inputs, SR-verknüpft.
- **#3 Tastatur-Navigation** ✅ (bis auf dokumentierte Shortcuts) — native
  Controls tabbar, Fokusring, DnD-Keyboard-Sensor + Announcements.
</content>

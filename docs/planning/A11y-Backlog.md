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
- [ ] **#10 Beispielvorlagen mit Inhalten** 🟡 (Format-Presets ✅)
  - Auswählbare Starter mit Beispiel-Szenen je Format.
- [ ] **#10 Gamification** ❌ (optional)
  - Fortschrittsbalken/Badges bei abgeschlossenen Szenen.

### P3 — Größer / konzeptionell

- [ ] **#4 Alt-Text pro Bild + accessible Export** ❌
  - `Scene.altText` im Datenmodell + Eingabefeld bei Bild-Upload.
  - PDF-Pipeline ist Raster (html-to-image → PNG) → trägt **keinen** Alt-Text.
    Optionen: tagged PDF, HTML-Export-Pfad, oder Limitation dokumentieren.
- [ ] **#6b Generelles Undo/Redo** ❌ (nur Szene-Löschen-Undo vorhanden)
  - History-Stack über Editor-Aktionen; Redo-Pfad.
- [ ] **#11 Weitere Sprachen** 🟡 (Infra DE/EN bereit)
  - Sprachpakete ergänzen; `SUPPORTED_LANGUAGES` erweitern.

## Bereits erfüllt

- **#1 Sichtbare Labels** ✅ — `<label htmlFor>` an allen Inputs, SR-verknüpft.
- **#3 Tastatur-Navigation** ✅ (bis auf dokumentierte Shortcuts) — native
  Controls tabbar, Fokusring, DnD-Keyboard-Sensor + Announcements.
</content>

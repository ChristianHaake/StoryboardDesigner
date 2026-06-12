Die technische Umsetzung wird in Sprints unterteilt. Der Entwickler übernimmt die volle Kontrolle über das Repository, die Commits und das Deployment.

### 1. Angepasste Entwicklungsvorgaben

- **Commits:** Werden ausschließlich manuell vom Entwickler durchgeführt. Die Struktur folgt zur besseren Lesbarkeit weiterhin den Conventional Commits (z.B. `feat: ...`, `fix: ...`).
- **Code-Qualität:** ESLint und Prettier laufen über npm-Skripte (`npm run lint`, `npm run format`). Auf Husky-Pre-Commit-Hooks wird verzichtet, da Commits manuell erfolgen; vor einem Push muss der Linter fehlerfrei durchlaufen.
- **Changelog:** Der Entwickler pflegt die `CHANGELOG.md` manuell am Ende eines Sprints oder nach relevanten Änderungen.
- **Deployment:** Der Entwickler pusht den Code manuell. Cloudflare (Workers-Flow) baut das Projekt auf Basis des konfigurierten Produktions-Branches. SPA-Fallback für `react-router-dom` über `wrangler.jsonc` (`assets.not_found_handling: single-page-application`) — kein `_redirects` (Pages-Feature, wird im Workers-Modus als Endlosschleife abgelehnt).

### 2. Sprint-Planung

Die Entwicklung wird in fünf aufeinander aufbauende Sprints gegliedert. Jeder Sprint liefert ein funktionierendes Inkrement.

**Sprint 1: Setup und statisches UI (Das A4-Dokument)**

- **Ziel:** Grundgerüst der App steht. Die A4-Optik ist sichtbar.
- **Aufgaben:**
- Projekt mit Vite, React, TypeScript und Tailwind CSS aufsetzen.
- Ordnerstruktur (`/components`, `/store`, `/utils`) anlegen.
- Sticky Top-Bar mit Dummy-Buttons integrieren.
- Das A4-Dokumenten-Layout (grauer Hintergrund, weiße Arbeitsfläche) umsetzen.
- Eingabebereiche für Metadaten und Pre-Planning statisch aufbauen (Auto-resize Textareas).

**Sprint 2: State Management und Szenen-Logik**

- **Ziel:** Die App ist interaktiv. Szenen können bearbeitet werden.
- **Aufgaben:**
- `useStoryboardStore` mit Zustand initialisieren.
- Datenmodell (`types.ts`) im Store hinterlegen.
- Szenen-Karten als Komponenten entwickeln (Bild-Platzhalter, Textfelder).
- CRUD-Funktionen für Szenen (Hinzufügen, Duplizieren, Löschen) mit dem Store verknüpfen.
- `dnd-kit` für das Sortieren (Drag-and-Drop) der Szenen-Karten einbauen.
- Autosave: Store-Änderungen debounced (~1 s) via `idb-keyval` in IndexedDB sichern; beim App-Start Autosave wiederherstellen; `beforeunload`-Warnung bei ausstehendem Autosave.

**Sprint 3: Medien-Handling und PDF-Druck**

- **Ziel:** Bilder können eingefügt werden und das Dokument lässt sich drucken.
- **Aufgaben:**
- Dateiauswahl für die Bild-Quadrate implementieren.
- Bilder beim Upload clientseitig per Canvas auf max. 1600 px verkleinern (`imageResizer.ts`).
- Erzeugung lokaler `Object URLs` für die direkte Anzeige; bei Bildtausch/Szenen-Löschung alte URLs mit `revokeObjectURL` freigeben.
- Print-CSS (`print.css`) schreiben: Top-Bar ausblenden, `@page`-Regeln (A4), Seitenumbrüche innerhalb von Karten verhindern.
- Druckfunktion (`window.print()`) an den Export-Button binden.
- Druck/PDF-Ausgabe auf Zielgeräten testen (insbesondere iPad Safari, MDM-verwaltete Schulgeräte) — nicht erst in Sprint 5.

**Sprint 4: Import / Export (.storyboard)**

- **Ziel:** Projekte lassen sich lokal sichern und wieder laden.
- **Aufgaben:**
- `jszip` und `file-saver` installieren.
- Export-Logik: Textdaten als `data.json` generieren, Bilder in einen `/images`-Ordner im ZIP ablegen. Archiv als `.storyboard`-Datei speichern.
- Import-Logik: ZIP entpacken, Bilder als Blobs extrahieren, neue `Object URLs` generieren und den Store mit den neuen Daten überschreiben.

**Sprint 5: Markdown und Feinschliff**

- **Ziel:** Die App ist vollständig und bereit für das Deployment.
- **Aufgaben:**
- `react-markdown` einbinden.
- Ansichten für statische Texte (Impressum, Datenschutz, Hilfe) aus `.md`-Dateien rendern.
- Responsives Design für kleine Bildschirme (Tablets/Smartphones) final prüfen.
- Finale Print-Abnahme auf iPad Safari (Folgetest zu Sprint 3).
- Linter-Fehler beheben und Code bereinigen.
- `CHANGELOG.md` für Version 1.0.0 abschließen.

---

**Hinweis Scope:** Dynamische Felder (`customFields`/`fieldDefinitions`, Konfigurations-Modal) und format-spezifische Feldsets (`formatType`) sind bewusst nicht Teil dieser Sprints — verschoben auf v1.1 (siehe Codingplan, Abschnitt D). Die Datenstruktur der `data.json` ist durch die TypeScript-Interfaces im Codingplan (Abschnitt 2) definiert.

### 3. Sprint 6: Release Hardening

- Gemeinsamen Projekt-Codec für Dateiimport und Autosave-Restore einführen.
- Neuere Major-Versionen ablehnen und v1.1-kompatible Felder erhalten.
- ZIP-Import durch Einzel- und Gesamtlimits sowie deduplizierte Bildpfade härten.
- Editor- und Importlimit auf maximal 200 Szenen angleichen.
- Bestehenden Projektinhalt getrennt vom Restore-Guard erfassen.
- Automatisierte Tests für Codec und zentrale Store-Operationen ergänzen.
- Print-Platzhalter und technische Dokumentation korrigieren.
- **Extern offen:** Rechtstexte mit echten Verantwortlichendaten vervollständigen.
- **Extern offen:** Druck/PDF auf Ziel-iPads und MDM-Konfiguration abnehmen.

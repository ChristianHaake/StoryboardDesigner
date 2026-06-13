# Feature-Backlog

Geplante Funktionsfeatures auf Basis der eingereichten User-Stories (Stand 2026-06-13), validiert gegen den Ist-Stand (Version 1.2) und die Schwester-Apps [SocialMediaCreator](https://github.com/ChristianHaake/SocialMediaCreator) und [Feedbackbogen-Generator](https://github.com/ChristianHaake/Feedbackbogen-Generator).

Reine UI-Verbesserungen siehe [UI-Backlog.md](UI-Backlog.md). UX-Konzept: [UIX-Codingplan.md](UIX-Codingplan.md). Architektur: [architecture.md](../architecture.md).

## Validierung gegen Ist-Stand

| # | Story | Status | Lücke |
| --- | ----- | ------ | ----- |
| 1 | Szenenstruktur | ~90 % | Add/DnD/Delete vorhanden. Statt Sicherheitsabfrage bewusst Undo-Snackbar (Touch-optimiert) |
| 2 | Bild-Upload | 100 % | Vollständig: JPG/PNG, Vorschau, Ersetzen/Löschen |
| 3 | Texteingabe | ~50 % | „Dialog/Text" ≈ Feld „Text/Ton". „Bildunterschrift" nur als Fotostory-Preset |
| 4 | Regieanweisung | ~60 % | Feld vorhanden. Kamera-**Dropdown** fehlt (bisher Freitext) |
| 5 | Soundplanung | ~80 % | Feld vorhanden, kollidiert namentlich mit Story 3 (beide nutzen `audioText`) |
| 7 | Export PDF | ~70 % | `window.print()` statt echter PDF-Datei |
| 8 | Feedback-Modul | 0 % | Neu |

## Entscheidungen (mit Betreiber abgestimmt)

1. **Felder 3+4 über Presets + neuen Select-Feldtyp** — kein Kernfeld-Umbau, keine Migration.
2. **Löschen behält Undo-Snackbar** — Sicherheitsabfrage formal über Undo erfüllt.
3. **PDF-Export als lazy jsPDF-Download** (eigener Chunk) wie SMC.
4. **Feedback-Modul als eigene v1.4** nach Abschluss der Must-haves.

## Leitprinzip

Das v1.1-System „projektweite Zusatzfelder + Formatvorlagen" wurde gebaut, um pro Format die passenden Felder bereitzustellen. Stories 3/4 werden darüber realisiert, **nicht** durch hartcodierte Kernfelder. Die einzige echte neue Datenfähigkeit ist der **Select-Feldtyp**.

---

# Release 1.3 — Must-haves vervollständigen ✅ umgesetzt (2026-06-13)

## F1 — Select-Feldtyp für Zusatzfelder (Story 4 Kamera-Dropdown)

Erweitert `CustomFieldDefinition` um optionalen Typ und Optionsliste. Rückwärtskompatibel (fehlender Typ = `text`).

**Datenmodell** ([src/types.ts](src/types.ts)):
```ts
export interface CustomFieldDefinition {
  key: string;
  label: string;
  type?: 'text' | 'select';   // default 'text'
  options?: string[];          // nur bei type 'select'
}
```

**Umsetzung:**
- [SceneCard.tsx](src/components/cards/SceneCard.tsx): rendert `<select>` (mit leerer Option) statt `AutoResizeTextarea`, wenn `type === 'select'`. Wert weiterhin in `customFields[key]`.
- [FieldConfigDialog.tsx](src/components/forms/FieldConfigDialog.tsx): beim Anlegen/Bearbeiten Typ wählbar; bei Select editierbare Optionsliste (eine pro Zeile).
- [customFields.ts](src/utils/customFields.ts): Validierung — Select braucht ≥1 nicht-leere, eindeutige Option.
- [projectCodec.ts](src/utils/projectCodec.ts): `validateFieldDefinitions` akzeptiert/normalisiert `type`/`options`; unbekannter Typ → `text`. Werte, die nicht mehr in `options` liegen, bleiben als Freitext erhalten (kein Datenverlust).

**Akzeptanzkriterien:** Select-Feld zeigt Dropdown in jeder Szene; Wert wird gespeichert, exportiert, importiert, gedruckt; Altprojekte (ohne `type`) laden unverändert; Tastaturbedienung.

## F2 — Kamera-Preset als Select (Story 4)

[customFields.ts](src/utils/customFields.ts) `FORMAT_FIELD_PRESETS`: Film-Preset „Kameraeinstellung" wird `type: 'select'` mit gängigen Einstellungen.

**Optionen (i18n in `presets.*`):** Totale · Halbtotale · Halbnah · Nahaufnahme · Detail · Amerikanische · Vogelperspektive · Froschperspektive.

**Akzeptanzkriterien:** „Film" wählen → Preset ergänzen → Kameraeinstellung erscheint als Dropdown mit den Standardwerten; weiterhin additiv (überschreibt keine vorhandenen Felder).

## F3 — Bildunterschrift verfügbar machen (Story 3)

„Bildunterschrift" als Preset-Feld, damit es per Klick in jede Szene kommt (statt Kernfeld-Umbau). Fotostory-Preset hat bereits „Sprechblase / Text"; ergänze ein generisches „Bildunterschrift" (Format-übergreifend oder im Custom-Preset).

**Akzeptanzkriterien:** Bildunterschrift in einem Schritt für alle Szenen aktivierbar; Inhalt gespeichert/exportiert/gedruckt.

## F4 — PDF-Download (Story 7)

Lazy-geladener echter PDF-Export nach SMC-Muster.

**Abhängigkeiten:** `jspdf`, `html-to-image` — **dynamisch importiert** (eigener Vite-Chunk, kein Main-Bundle-Bloat, analog `MarkdownView`).

**Umsetzung:**
- Neu `src/utils/pdfExport.ts`: A4-Element → `html-to-image` (pixelRatio) → in Seiten schneiden an `break-inside`-sicheren Kanten → `jsPDF.addImage` je Seite → `output('blob')` → Download via Object-URL.
- [TopBar.tsx](src/components/layout/TopBar.tsx): PDF-Button löst PDF-Download aus; bestehender `window.print()` bleibt als „Drucken" erhalten (zwei klar benannte Aktionen) — Anordnung im UI-Schliff.
- Fehlerpfad über bestehenden Fehler-Toast (`setErrorMessage`), neue i18n-Keys.
- Ladezustand am Button, da Chunk + Rendering kurz dauern.

**Akzeptanzkriterien:** Klick erzeugt `.pdf` mit allen Szenen chronologisch inkl. Bildern und Texten; mehrseitig ohne zerschnittene Karten; Main-Bundle wächst nicht messbar; iPad Safari getestet.

## Release 1.3 — Verifikation

- `npm run lint && npm run build && npm run test` grün; jsPDF/html-to-image als separate Chunks im Build-Output sichtbar.
- Preset-/Codec-/Select-Validierung als Vitest-Fälle; Roundtrip Select-Feld + PDF-Hilfsfunktionen.
- Preview: Kamera-Dropdown, Bildunterschrift, PDF-Download Desktop + iPad-Viewport; Print weiterhin sauber.
- Altprojekt (v1.0/v1.1/v1.2 ohne `type`) lädt fehlerfrei.

---

# Release 1.4 — Feedback-Modul (Story 8) ✅ umgesetzt (2026-06-13)

Dateibasiert nach Familienmuster: keine Accounts, kein Server. Die Lehrkraft öffnet die `.storyboard`-Datei der Lernenden, kommentiert Szenen, markiert erledigt, speichert die Datei zurück.

**Datenmodell** ([src/types.ts](src/types.ts)):
```ts
export interface SceneComment {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}
export interface Scene {
  // … bestehende Felder
  comments?: SceneComment[];   // optional, rückwärtskompatibel
}
```

**Umsetzung:**
- Store: `addComment` / `updateComment` / `toggleCommentDone` / `deleteComment`; setzen `touched`/`hasContent`.
- [SceneCard.tsx](src/components/cards/SceneCard.tsx): einklappbarer Kommentar-Thread pro Szene mit Badge (Anzahl offen). Eingabe + Liste; jeder Kommentar „erledigt"-Checkbox + löschen. 44-px-Ziele.
- Optional „Feedback-Modus" als Toggle, der die Kommentar-UI ein-/ausblendet (Lernende vs. Lehrkraft-Sicht).
- [projectCodec.ts](src/utils/projectCodec.ts): validiert/normalisiert `comments` (Limit pro Szene, Textlänge); fehlend = leer.
- ZIP-Export/-Import ([zipHandler.ts](src/utils/zipHandler.ts)) + Autosave tragen Kommentare automatisch (Teil von `StoryboardProject`).
- Druck: Kommentare standardmäßig `print:hidden`; optional eigener Feedback-Druck als Folge-Idee.
- i18n DE/EN; Versionsbump auf 1.4, Codec lehnt nur Major > 1 ab.

**Akzeptanzkriterien:** Jede Szene hat Kommentarfunktion; Kommentare als erledigt markierbar; überleben Export/Import/Autosave/Duplizieren; Altprojekte ohne `comments` laden unverändert.

## Release 1.4 — Verifikation

- Store-/Codec-Tests für Kommentar-CRUD und Roundtrip.
- Preview: Thread anlegen, erledigt markieren, löschen; Datei speichern → neu laden → Kommentare erhalten.
- Druckansicht ohne Kommentare.

---

## Story-Abdeckung

| Story | Abgedeckt durch |
| ----- | --------------- |
| 1 | Bereits umgesetzt (Undo statt Dialog) |
| 2 | Bereits umgesetzt |
| 3 | F3 (Bildunterschrift-Preset) |
| 4 | F1 + F2 (Select-Typ + Kamera-Preset) |
| 5 | Bereits umgesetzt (Feld „Text/Ton") |
| 7 | F4 (PDF-Download) |
| 8 | Release 1.4 (Feedback-Modul) |

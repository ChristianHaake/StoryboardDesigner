# UI-Backlog

User-Stories zur UI-Verbesserung. Grundlage: Code-Audit (Doppelungen, Stil-Inkonsistenzen) und Muster-Analyse der Schwester-App [smc.haak3.de](https://smc.haak3.de) vom 2026-06-13. Priorisierung: **Muss** (behebt sichtbare Mängel), **Soll** (wertet Einstieg auf), **Kann** (Feinschliff).

## Befunde der UI-Validierung

### Doppelungen

| # | Befund | Belege |
| --- | ------ | ------ |
| D1 | StatusPill „Inhalte bleiben lokal" erscheint 2× identisch: TopBar und Footer | [TopBar.tsx](src/components/layout/TopBar.tsx), [Footer.tsx](src/components/layout/Footer.tsx) |
| D2 | „Lokal / ohne Konto / Browser"-Botschaft 3×: Pill + InfoBanner („Diese App arbeitet vollständig in deinem Browser …") + Hero-Subtitle („… ohne Konto, direkt im Browser.") | [StatusPill.tsx](src/components/layout/StatusPill.tsx), [InfoBanner.tsx](src/components/layout/InfoBanner.tsx), [HeroIntro.tsx](src/components/layout/HeroIntro.tsx) |
| D3 | Mortarboard-Icon + Lehrkräfte-Bezug 2×: TopBar-Link „Für Lehrkräfte" und InfoBanner mit gleicher Ikone | [TopBar.tsx](src/components/layout/TopBar.tsx), [InfoBanner.tsx](src/components/layout/InfoBanner.tsx) |
| D4 | ~286 px Chrome vor dem Editor: TopBar (2 Zeilen) → InfoBanner → Hero → erst dann A4-Fläche | [App.tsx](src/App.tsx) |

### Stil-Inkonsistenzen

| # | Befund | Belege |
| --- | ------ | ------ |
| S1 | `gray-*` und `slate-*` gemischt, teils in derselben Datei | [SceneCard.tsx](src/components/cards/SceneCard.tsx), [FieldConfigDialog.tsx](src/components/forms/FieldConfigDialog.tsx) |
| S2 | Inputs ≠ Textareas: `border-slate-200 bg-slate-50` vs. `border-transparent bg-gray-50` — sichtbarer Bruch in jeder Szenenkarte | [fieldStyles.ts](src/components/forms/fieldStyles.ts), [AutoResizeTextarea.tsx](src/components/forms/AutoResizeTextarea.tsx) |
| S3 | Keine zentrale Button-Hierarchie; primär/sekundär/ghost ad hoc pro Komponente gestylt | TopBar, EditorView, SceneCard, FieldConfigDialog |
| S4 | Heading-Skala uneinheitlich (xs-Kicker vs. text-lg-Dialogtitel vs. 3xl/4xl-Hero) | [EditorView.tsx](src/views/EditorView.tsx), [FieldConfigDialog.tsx](src/components/forms/FieldConfigDialog.tsx) |
| S5 | Abstände ohne Raster: `mt-6` / `mt-7` / `mt-9` nebeneinander | [EditorView.tsx](src/views/EditorView.tsx) |

### SMC-Muster (Referenz)

1. **Jede Botschaft genau 1×** — Pill nur im Header; Footer nutzt eine Wortvariante („SocialMediaCreator · Inhalte bleiben auf deinem Gerät"), kein identisches Element doppelt.
2. **Hero = knapper Dreiklang** („Fiktiv. Lokal. Exportierbar.") plus ein Satz — kein zusätzlicher Banner davor.
3. **Formatwahl prominent als Modul-Tabs** direkt im Einstieg — im StoryboardDesigner versteckt als Select in der Metadatenzeile.
4. **Edu-Hinweis ist ein Satz** mit einem Link — nicht Banner und Header-Link parallel.

---

## Epic A — Doppelungen entfernen (Muss)

### A1 — Eine Lokal-Botschaft pro Ort

**Story:** Als Lernende:r möchte ich die Datenschutz-Botschaft nur einmal pro Bildschirmbereich sehen, damit die Oberfläche ruhig wirkt und die Botschaft nicht an Gewicht verliert.

**Akzeptanzkriterien:**
- StatusPill „Inhalte bleiben lokal" erscheint nur in der TopBar.
- Footer zeigt stattdessen Textvariante „StoryboardDesigner · Inhalte bleiben auf deinem Gerät" (SMC-Muster).
- Hero-Subtitle verliert „ohne Konto, direkt im Browser" (Botschaft steckt bereits in Pill und Banner).
- i18n: DE + EN angepasst, Paritäts-Test grün.

**Dateien:** Footer.tsx, HeroIntro.tsx, de.ts, en.ts
**Priorität:** Muss

### A2 — Banner und Hero zusammenführen

**Story:** Als Lernende:r möchte ich nach dem Header direkt einen kompakten Einstieg sehen, damit ich schneller zum Storyboard komme statt durch gestapelte Hinweisblöcke zu scrollen.

**Akzeptanzkriterien:**
- Ein Einstiegsblock statt InfoBanner + HeroIntro übereinander.
- Edu-Hinweis wird einzeilige Fußnote des Heros (1 Satz + Link), amber-Banner entfällt als eigener Block.
- Maximal ~180 px Chrome zwischen TopBar und A4-Fläche (Desktop).
- Kein Icon erscheint doppelt.
- Alles weiterhin `print:hidden`.

**Dateien:** App.tsx, HeroIntro.tsx, InfoBanner.tsx (entfällt oder wird integriert), de.ts, en.ts
**Priorität:** Muss

### A3 — „Für Lehrkräfte" eindeutig

**Story:** Als Lehrkraft möchte ich genau einen klar erkennbaren Einstiegspunkt zu den Hinweisen für Lehrkräfte, damit ich nicht zwei konkurrierende Links mit derselben Ikone sehe.

**Akzeptanzkriterien:**
- Genau ein Lehrkräfte-Link above the fold (TopBar-Link bleibt).
- Hero-Fußnote (aus A2) verlinkt ohne Mortarboard-Ikone oder verweist auf anderes Ziel (Datenschutz).

**Dateien:** TopBar.tsx, HeroIntro.tsx
**Priorität:** Muss

## Epic B — Visuelle Konsistenz (Muss)

### B1 — Eine Grau-Familie

**Story:** Als Lernende:r möchte ich eine einheitliche Farbtemperatur in der Oberfläche, damit Karten, Felder und Chrome wie aus einem Guss wirken.

**Akzeptanzkriterien:**
- `slate-*` für das komplette UI-Chrome; `gray-*` eliminiert (Ausnahmen: Print-Stile, begründete Einzelfälle).
- `grep -rn "gray-" src/components src/views` liefert nur dokumentierte Ausnahmen.
- Kein visueller Regressionsbruch (Kontraste bleiben ≥ WCAG AA).

**Dateien:** SceneCard.tsx, FieldConfigDialog.tsx, EditorView.tsx, AutoResizeTextarea.tsx, Notifications.tsx
**Priorität:** Muss

### B2 — Inputs und Textareas vereinheitlichen

**Story:** Als Lernende:r möchte ich, dass alle Eingabefelder einer Szenenkarte gleich aussehen, damit ich editierbare Flächen sofort erkenne.

**Akzeptanzkriterien:**
- AutoResizeTextarea verwendet die `inputClass`-Tokens aus fieldStyles (sichtbare slate-200-Border, slate-50-Fläche, gleiche Hover/Fokus-Zustände).
- Print-Reset (`print:border-0` etc.) bleibt unverändert.
- Szenenkarte zeigt identische Feldoptik für Input und Textarea.

**Dateien:** AutoResizeTextarea.tsx, fieldStyles.ts
**Priorität:** Muss

### B3 — Button-Hierarchie als Tokens

**Story:** Als Entwickler:in möchte ich zentrale Button-Tokens (primär/sekundär/ghost), damit neue Aktionen automatisch konsistent aussehen und Inline-Duplikate verschwinden.

**Akzeptanzkriterien:**
- `buttonPrimary` (blue-600, weiß), `buttonSecondary` (weiß, slate-300-Border), `buttonGhost` (transparent, Icon-Aktionen) zentral definiert (fieldStyles.ts oder eigenes buttonStyles.ts).
- TopBar, EditorView, SceneCard, FieldConfigDialog, Notifications nutzen die Tokens.
- 44-px-Touch-Ziele bleiben erhalten.

**Dateien:** fieldStyles.ts (oder neu buttonStyles.ts), TopBar.tsx, EditorView.tsx, SceneCard.tsx, FieldConfigDialog.tsx, Notifications.tsx
**Priorität:** Muss

### B4 — Heading- und Spacing-Skala

**Story:** Als Lernende:r möchte ich eine erkennbare Überschriften-Hierarchie, damit ich die Dokumentstruktur (Projekt → Planung → Storyboard) auf einen Blick erfasse.

**Akzeptanzkriterien:**
- Einheitliche Skala: Kicker `text-xs uppercase tracking-*`, Sektions-h2 einheitlich, Dialogtitel folgt derselben Skala.
- Vertikale Abstände nur aus Raster mt-4 / mt-6 / mt-8 (kein mt-7/mt-9).
- EditorView und FieldConfigDialog folgen derselben Skala.

**Dateien:** EditorView.tsx, FieldConfigDialog.tsx
**Priorität:** Muss

## Epic C — Attraktiverer Einstieg nach SMC-Muster (Soll)

### C1 — Formatwahl prominent

**Story:** Als Lernende:r möchte ich das Format (Film / Fotostory / Rede / Eigenes) gleich beim Einstieg als sichtbare Auswahl treffen, damit ich verstehe, dass die App mehrere Formate kann, und passende Vorlagenfelder bekomme.

**Akzeptanzkriterien:**
- Format als Kachel-/Tab-Auswahl (SMC-`module-tabs`-Muster, `role="tablist"`) im Einstiegsbereich vor oder über der A4-Fläche.
- Select in der Metadatenzeile bleibt synchronisierte Quelle der Wahrheit (beide steuern `setFormatType`).
- Additive Preset-Logik (`mergeFormatPreset`) unverändert.
- Tastaturbedienung + `aria-selected`; `print:hidden`.

**Dateien:** HeroIntro.tsx oder neue Komponente FormatTabs.tsx, EditorView.tsx, de.ts, en.ts
**Priorität:** Soll

### C2 — Hero-Dreiklang schärfen

**Story:** Als Lernende:r möchte ich einen prägnanten, kurzen Einstieg, damit der Hero motiviert statt Platz zu verbrauchen.

**Akzeptanzkriterien:**
- Kicker bleibt prägnant („Planen · Gestalten · Drucken").
- Headline + maximal 1 Satz Subline (≤ 2 Textzeilen auf Desktop).
- Mobile noch kompakter (kleinere Headline, weniger Abstand).

**Dateien:** HeroIntro.tsx, de.ts, en.ts
**Priorität:** Soll

### C3 — Footer entschlacken

**Story:** Als Lernende:r möchte ich einen ruhigen Footer mit Marke, Links und einer Textzeile, damit das Seitenende nicht den Header wiederholt.

**Akzeptanzkriterien:**
- BrandLogo klein + Nav-Links + Textvariante aus A1.
- Keine StatusPill-Komponente im Footer.

**Dateien:** Footer.tsx
**Priorität:** Soll

## Epic D — Feinschliff (Kann)

### D1 — Empty-State fürs Storyboard

**Story:** Als Lernende:r möchte ich beim ersten Öffnen eine freundliche leere Bühne mit Erklärung sehen, damit ich weiß, wie ich starte.

**Akzeptanzkriterien:**
- Bei 0 oder 1 leeren Szenen: Hinweistext/Illustration im Storyboard-Bereich statt nur „+ Szene hinzufügen".
- Verschwindet, sobald Inhalt existiert; `print:hidden`.

**Dateien:** EditorView.tsx, de.ts, en.ts
**Priorität:** Kann

### D2 — TopBar beim Scrollen verdichten

**Story:** Als Lernende:r möchte ich beim Arbeiten im Dokument mehr Bildschirmhöhe, damit auf Tablets mehr vom Storyboard sichtbar ist.

**Akzeptanzkriterien:**
- Beim Scrollen kollabiert Zeile 1 (Branding); Aktionszeile (Laden/Speichern/PDF) bleibt sticky sichtbar.
- Kein Layout-Springen (sanfte Transition); Tastaturfokus bleibt erreichbar.

**Dateien:** TopBar.tsx
**Priorität:** Kann

---

## Abdeckung

| Befund | Stories |
| ------ | ------- |
| D1 | A1, C3 |
| D2 | A1, A2 |
| D3 | A3 |
| D4 | A2, C2 |
| S1 | B1 |
| S2 | B2 |
| S3 | B3 |
| S4 | B4 |
| S5 | B4 |

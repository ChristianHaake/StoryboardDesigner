# UI/UX-Designsystem

Stand nach Version 1.2 (SMC-Redesign). Die App verwendet eine dokumentenzentrierte Oberfläche im visuellen Stil von smc.haak3.de. Editor und Druckansicht teilen dieselbe Inhaltsstruktur; reine Bedienelemente werden im Druck ausgeblendet.

## 1. Gestaltungsprinzipien

- **Dokument im Mittelpunkt:** Desktop und Tablet zeigen eine weiße A4-Arbeitsfläche auf slate-100-Hintergrund. Smartphones verwenden einen randlosen Dokument-Stream.
- **SMC-Produktfamilie:** Storyboard-Creator teilt Markenelemente (Logo, Akzentfarbe, Status-Pill, Header-Struktur) mit smc.haak3.de.
- **Eine Akzentfarbe:** `blue-600` (#2563EB) kennzeichnet primäre Aktionen, Links, Fokuszustände und Markenelemente.
- **Erkennbare Eingaben:** Editierbare Felder verwenden `slate-50`-Fläche. Hover hellt ab, Fokus zeigt weißen Hintergrund, blaue Kontur und Fokus-Ring.
- **Ruhige Hierarchie:** Abschnittsnamen in kleinen Versalien. Feldlabels normal geschrieben, über Gewicht und Abstand gegliedert.
- **Direkte Bearbeitung:** Kein separates Formular und keine Preview-Ansicht.

## 2. Design-Tokens

| Element             | Vorgabe                                      |
| ------------------- | -------------------------------------------- |
| Akzent              | Tailwind `blue-600` (#2563EB), Hover `blue-700` |
| Seitenhintergrund   | `slate-100` (#f1f5f9)                        |
| Eingabefläche       | `slate-50`, Hover `white`                    |
| Haupttext           | `gray-900` bis `gray-950`                    |
| Sekundärtext        | mindestens `slate-600`                       |
| Rahmen              | `slate-200` bis `slate-300`                  |
| Feld-/Button-Radius | `rounded-lg`                                 |
| Karten-Radius       | `rounded-xl`                                 |
| Touch-Ziel          | mindestens `44 × 44 px`                      |
| Fokus               | 3 px blauer Ring mit sichtbarem Offset       |
| Lokal-Akzent        | `emerald-*` (grüne Status-Pill)              |
| Hinweis-Akzent      | `amber-*` (Bildungs-Banner)                  |

Keine externe UI- oder Icon-Bibliothek. Icons bleiben reduzierte Inline-SVGs mit einheitlicher Größe und Strichstärke.

## 3. App-Shell

### TopBar

Zweireihiger SMC-Header, sticky, weiß, `print:hidden`:

- **Zeile 1 (Branding):** `BrandLogo` (Gradient-Quadrat + Wortmarke + Tagline) links; rechts `StatusPill` („Inhalte bleiben lokal", ab `sm`), „Für Lehrkräfte"-Link, `LanguageToggle` (DE/EN-Segment, aktiv `bg-blue-600`).
- **Zeile 2 (Aktionen):** `slate-50`-Hintergrund; Laden + Speichern (sekundär: weiß + `slate-300`-Border) und PDF (primär: `bg-blue-600`, Schatten).

### Dokumentfläche

- Desktop: A4-Breite, 15-mm-Innenabstand, weicher Schatten + `ring-1 ring-slate-900/5`.
- Tablet: maximal verfügbare Breite mit 16 px Außenabstand.
- Smartphone bis 640 px: volle Breite, kein Schatten, kein Außenabstand, 20 px Innenabstand, kein Radius.

### Vor dem Editor (Startseite, print:hidden)

- **InfoBanner:** amber `rounded-xl`, Bildungshinweis + Datenschutz-Link.
- **HeroIntro:** Blau-Kicker (uppercase, getrackt) → fette Headline → graue Subline.

### Footer und Meldungen

- Footer: `BrandLogo` (ohne Tagline) + Nav-Links + `StatusPill`. Weiß, `border-t slate-200`, `print:hidden`.
- Notifications: Fehler-Toast (rot, `role="alert"`) gestapelt über Undo-Snackbar (dunkel, `role="status"`). Mobil maximal breit, klar kontrastiert.

## 4. Editor

### Projektkopf und Planung

- Projektname mit sichtbarem Label und hervorgehobener Eingabefläche.
- Metadaten ab Tablet zweispaltig, Smartphone einspaltig.
- Planung ab Tablet im kompakten Zwei-Spalten-Raster.
- Abschnittstrenner: kleiner Versaltitel + feine horizontale Linie.

### Szenenkarten

- Weiß, `rounded-xl`, `border-slate-200`, leichte Hover-Anhebung (`shadow-md`).
- Kopfzeile: nummeriertes Badge (blau `rounded-md`, `bg-blue-50 text-blue-700`) + Szenen-Titel links; Drag-Handle + Duplizieren + Löschen rechts.
- Drag-Handle dauerhaft sichtbar. Duplizieren/Löschen bei Hover/Fokus (Desktop), dauerhaft auf Touch-Geräten (`pointer-coarse:opacity-100`).
- Alle Aktionen `size-11` (44 × 44 px).
- Bildfeld Desktop quadratisch, Smartphone `4:3`.
- Entfernen-Button über dem Bild (weißes Hintergrund-Pill, 44 px).
- Leere Bildfelder und alle Kontextaktionen beim Druck ausgeblendet.

## 5. Responsive Regeln

Verbindliche Prüfansichten:

- Desktop: `1280 × 720`
- Tablet: `768 × 1024`
- Smartphone: `390 × 844`

Kein horizontales Scrollen. Mobile TopBar vollständig sichtbar, kein Dropdown. Karten unter 640 px: vertikaler Aufbau (Bild oben, Textfelder darunter). StatusPill und „Für Lehrkräfte" ab `max-sm` ausgeblendet.

## 6. Barrierefreiheit und Interaktion

- Alle interaktiven Elemente erhalten sichtbaren `focus-visible`-Zustand.
- Semantische Labels und i18n-übersetzte Drag-and-Drop-Ansagen (DE + EN).
- Farbe nie alleiniger Indikator: Fokus nutzt Kontur und Ring, primäre Aktionen zusätzlich Flächenfüllung.
- Hover-Zustände verstecken keine für Touch notwendige Funktion.
- Text- und Bedienelementkontraste sollen mindestens WCAG AA erreichen.

## 7. Druck

- TopBar, InfoBanner, HeroIntro, Footer, Notifications, Aktionsbuttons, Platzhalter und leere Bildfelder sind `print:hidden`.
- Eingabeflächen verlieren Hintergrund, Rahmen, Innenabstand und Fokusdarstellung.
- Szenenkarten: neutraler Druckrahmen, `break-inside: avoid`.
- A4-Format und 15-mm-Rand via `@page` in `index.css`.
- Finale Ausgabe muss auf realen iPads und der eingesetzten MDM-Konfiguration geprüft werden.

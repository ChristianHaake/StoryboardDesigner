# UI/UX-Designsystem

Stand nach Sprint 9. Die App verwendet eine dokumentenzentrierte, minimalistische Oberfläche. Editor und Druckansicht teilen dieselbe Inhaltsstruktur; reine Bedienelemente werden im Druck ausgeblendet.

## 1. Gestaltungsprinzipien

- **Dokument im Mittelpunkt:** Desktop und Tablet zeigen eine weiße A4-Arbeitsfläche auf neutralgrauem Hintergrund. Smartphones verwenden einen randlosen Dokument-Stream.
- **Eine Akzentfarbe:** Blau kennzeichnet primäre Aktionen, Links und Fokuszustände. Inhalte und Sekundäraktionen bleiben neutral.
- **Erkennbare Eingaben:** Editierbare Felder verwenden eine sehr helle graue Fläche. Hover hellt sie leicht ab, Fokus zeigt weißen Hintergrund, blaue Kontur und Fokus-Ring.
- **Ruhige Hierarchie:** Abschnittsnamen verwenden kleine Versalien. Feldlabels bleiben normal geschrieben und werden über Gewicht und Abstand gegliedert.
- **Direkte Bearbeitung:** Kein separates Formular und keine Preview-Ansicht. Texte und Bilder werden direkt im Dokument bearbeitet.

## 2. Design-Tokens

| Element             | Vorgabe                                |
| ------------------- | -------------------------------------- |
| Akzent              | Tailwind `blue-600`, Hover `blue-700`  |
| Seitenhintergrund   | `gray-200`                             |
| Eingabefläche       | `gray-50`, Hover `gray-100`            |
| Haupttext           | `gray-900` bis `gray-950`              |
| Sekundärtext        | mindestens `gray-600`                  |
| Rahmen              | `gray-200` bis `gray-300`              |
| Feld-/Button-Radius | `rounded-lg`                           |
| Karten-Radius       | `rounded-xl`                           |
| Touch-Ziel          | mindestens `44 × 44 px`                |
| Fokus               | 3 px blauer Ring mit sichtbarem Offset |

Es wird keine externe UI- oder Icon-Bibliothek verwendet. Icons bleiben reduzierte Inline-SVGs mit einheitlicher Größe und Strichstärke.

## 3. App-Shell

### Topbar

- Desktop und Tablet: einzeilig, kompakt und sticky; Titel links, Projektaktionen rechts.
- Smartphone: Titelzeile plus darunter drei gleich breite Aktionen für Laden, Speichern und PDF.
- Alle Aktionen kombinieren Icon und kurze Beschriftung.
- PDF bleibt einzige gefüllte Primäraktion.

### Dokumentfläche

- Desktop: A4-Breite, 15-mm-Innenabstand, dezenter Schatten.
- Tablet: maximal verfügbare Breite mit 16 px Außenabstand.
- Smartphone bis 640 px: volle Breite, kein Schatten, kein Außenabstand, 20 px Innenabstand.
- Exakte Bildschirm-Paginierung wird nicht simuliert. Seitenumbrüche bestimmt der Browserdruck.

### Footer und Meldungen

- Footer verwendet dieselbe neutrale Farb- und Fokuslogik.
- Fehler und Rückgängig-Meldungen sind mobil maximal breit, klar kontrastiert und überdecken sich nicht.
- Aktionsbuttons innerhalb der Meldungen erfüllen die Mindesthöhe von 44 px.

## 4. Editor

### Projektkopf und Planung

- Projektname besitzt ein sichtbares Label und eine hervorgehobene Eingabefläche.
- Metadaten bleiben ab Tablet zweispaltig und werden auf Smartphones einspaltig.
- Planung verwendet ab Tablet ein kompaktes Zwei-Spalten-Raster.
- Abschnittstrenner verbinden kleine Versalüberschrift und feine horizontale Linie.

### Szenenkarten

- Karten verwenden weißen Hintergrund, neutralen Rahmen und eine leichte Hover-Anhebung.
- Kopfzeile enthält Szenennummer links und Aktionen rechts.
- Drag-Handle bleibt sichtbar. Duplizieren und Löschen erscheinen am Desktop bei Hover/Fokus; auf Smartphones und groben Zeigegeräten dauerhaft.
- Alle Szenenaktionen messen mindestens `44 × 44 px`.
- Bildfeld ist Desktop quadratisch und Smartphone `4:3`, damit Textfelder früher sichtbar werden.
- Bild entfernen liegt als kontrastreicher 44-px-Button über dem Bild.
- Leere Bildfelder und alle Kontextaktionen werden beim Druck ausgeblendet.

## 5. Responsive Regeln

Die verbindlichen Prüfansichten sind:

- Desktop: `1280 × 720`
- Tablet: `768 × 1024`
- Smartphone: `390 × 844`

In keiner Ansicht darf horizontales Scrollen entstehen. Die mobile Topbar bleibt vollständig sichtbar und verwendet kein Dropdown. Karten wechseln unter 640 px von Bild/Text-Zweispalte zu vertikalem Aufbau.

## 6. Barrierefreiheit und Interaktion

- Alle interaktiven Elemente erhalten einen sichtbaren `focus-visible`-Zustand.
- Semantische Labels und bestehende deutschen Drag-and-Drop-Ansagen bleiben erhalten.
- Farbe ist nie alleiniger Indikator: Fokus nutzt Kontur und Ring, primäre Aktionen zusätzlich Flächenfüllung.
- Hover-Zustände dürfen keine für Touch notwendige Funktion verstecken.
- Text- und Bedienelementkontraste sollen mindestens WCAG AA erreichen.

## 7. Druck

- Topbar, Footer, Notifications, Aktionsbuttons, Platzhalter und leere Bildfelder sind ausgeblendet.
- Eingabeflächen verlieren Hintergrund, Rahmen, Innenabstand und Fokusdarstellung.
- Szenenkarten verwenden neutrale Druckrahmen und `break-inside: avoid`.
- A4-Format und 15-mm-Rand werden über `@page` gesetzt.
- Finale Ausgabe muss zusätzlich auf realen iPads und der eingesetzten MDM-Konfiguration geprüft werden.

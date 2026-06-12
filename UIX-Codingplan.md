Das Design des SocialMediaCreators gibt eine klare funktionale Richtung vor. Die UI-Strategie rückt von einer getrennten Formular- und Vorschauansicht ab und fokussiert sich auf direkte Manipulation (WYSIWYG) sowie eine pragmatische, dokumentenorientierte Ansicht.

Hier ist der angepasste UI/UX-Design-Plan für das Storyboard.

### 1. Visuelles Kernkonzept: Das A4-Dokument

* **Dokumentenzentrierte Arbeitsfläche:** Der Hauptbereich der Web-App stellt visuell eine (oder mehrere) DIN-A4-Seiten dar. Die Lernenden sehen eine enge Annäherung an das spätere PDF-Ergebnis. (Exakte Seitenumbrüche bestimmt der Browser-Druckdialog; das Print-CSS stellt sicher, dass Szenen-Karten nicht zerschnitten werden — die A4-Optik ist visuelle Orientierung, keine pixelgenaue Paginierung.)
* **Reduziertes Layout:** Eine graue Hintergrundfläche hebt das weiße "Papier" (den Workspace) hervor. Es gibt keine breiten, permanent sichtbaren Sidebars für die Dateneingabe.

### 2. WYSIWYG-Eingabe (On-Page-Editing)

* **Direkte Texteingabe:** Keine separaten Formularfelder. Textbereiche (wie Bildbeschreibung oder Regieanweisung) sind als rahmenlose Textareas direkt auf der Storyboard-Karte platziert. Sie wachsen bei Eingabe automatisch mit.
* **Direkter Medien-Upload:** Ein Klick auf das leere Bild-Quadrat einer Szene öffnet direkt den Datei-Dialog des Betriebssystems. Nach Auswahl erscheint das Bild sofort im Quadrat.
* **Platzhalter:** Leere Felder zeigen subtile Platzhaltertexte (z. B. "Bildbeschreibung hier eingeben..."), die beim Drucken unsichtbar bleiben, wenn sie nicht ausgefüllt wurden.

### 3. Menüführung und Werkzeugleiste

* **Fixierte Kopfzeile (Sticky Top-Bar):** Eine schmale Leiste am oberen Bildschirmrand bündelt alle globalen Aktionen.
* Titel der App
* Button: "Projekt laden"
* Button: "Lokal speichern (.storyboard)"
* Button: "PDF exportieren"


* **Kontextbezogene Aktionen (Hover/Touch):** Buttons zum Löschen, Duplizieren oder Verschieben einer Szene (Drag-Handle) erscheinen erst, wenn die Maus über die jeweilige Szenen-Karte bewegt wird, oder permanent dezent bei Touch-Bedienung. Dies hält das Dokumenten-Design sauber.

### 4. Struktur der Ansicht

* **Kopfbereich (Metadaten & Pre-Planning):** Die erste A4-Seite beginnt mit den Metadaten. Felder für Name, Thema, Datum sowie die Logline und Ressourcen können direkt dort ausgefüllt werden.
* **Szenen-Raster:** Unter dem Kopfbereich folgen die Szenen-Karten. Ein klassisches Storyboard-Layout ordnet beispielsweise zwei oder drei Szenen untereinander an. Eine Szene besteht aus einem Medien-Feld links und den Textfeldern rechts daneben.
* **Szenen hinzufügen:** Am unteren Rand der letzten Seite befindet sich ein markanter, aber schlichter Button "+ Szene hinzufügen".

### 5. Styling und Barrierefreiheit

* **Farbpalette:** Monochrom (Weiß, Grautöne, Schwarz) für die Benutzeroberfläche. Eine dezente Akzentfarbe (z. B. das Blau des SocialMediaCreators) markiert primäre Buttons. Das lenkt nicht von den hochgeladenen Bildern und Inhalten der Lernenden ab.
* **Touch-Optimierung:** Ausreichend große Klickflächen für den Einsatz auf Schul-Tablets. Das Drag-and-Drop der Szenen benötigt ein klar greifbares Icon (z. B. sechs kleine Punkte).
* **Responsive Anpassung:** Auf sehr kleinen Bildschirmen (Smartphones) bricht das A4-Layout um und die Karten werden untereinander als vertikaler Stream angezeigt, um horizontales Scrollen zu vermeiden. Beim PDF-Export gilt wieder das A4-Raster.
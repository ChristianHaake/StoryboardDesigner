Für eine strukturierte und wartbare Entwicklung müssen klare Vorgaben (Guidelines) definiert werden. Diese Standards sichern die Code-Qualität und erleichtern zukünftige Erweiterungen.

## Entwicklungsvorgaben (Guidelines)

**1. Dokumentation und Changelog**

* **Changelog:** Eine Datei `CHANGELOG.md` wird im Hauptverzeichnis geführt. Der Aufbau erfolgt als tabellarische Übersicht mit den Spalten Datum, Veränderung und Kürzel der verantwortlichen Personen.
* **README.md:** Enthält zwingend Projektnamen, Tech-Stack, Anweisungen für das lokale Setup (`npm install`, `npm run dev`) und Deployment-Schritte.
* **Inline-Dokumentation:** Komplexe Logiken (z.B. ZIP-Komprimierung) werden im Code kurz und prägnant kommentiert.

**2. Versionskontrolle (Git)**

* **Branching-Modell:** Ein Feature-Branch-Workflow wird angewendet. Der `main`-Branch spiegelt den produktiven Stand wider. Neue Funktionen werden in separaten Branches (z.B. `feature/storyboard-cards`) entwickelt.
* **Commit-Messages:** Nutzung von Conventional Commits (z.B. `feat: add PDF export`, `fix: resolve image upload bug`, `docs: update changelog`). Dies sorgt für eine strukturierte Historie.

**3. Code-Qualität und Formatierung**

* **Linter und Formatter:** ESLint und Prettier werden eingerichtet und über npm-Skripte (`npm run lint`, `npm run format`) ausgeführt. Auf Pre-Commit-Hooks (Husky) wird verzichtet, da Commits ausschließlich manuell durch den Entwickler erfolgen (siehe Sprint-Planung). Vor einem Push muss der Linter fehlerfrei durchlaufen.
* **TypeScript:** Strikte Typisierung ist Pflicht (`"strict": true` in der `tsconfig.json`). Die Nutzung von `any` wird vermieden. Interfaces für Datenstrukturen werden zentral in einer `types.ts` definiert.
* **Komponentenstruktur:** Strikte Trennung von UI-Darstellung und Geschäftslogik. Zustand (State) wird über Hooks (`useStoryboardStore`) verwaltet, nicht innerhalb der UI-Komponenten.

**4. Dateibenennung und Struktur**

* **React-Komponenten:** PascalCase (z.B. `SceneCard.tsx`).
* **Hilfsfunktionen und Hooks:** camelCase (z.B. `zipHandler.ts`, `useExport.ts`).
* **Ordnerstruktur:** Flache, funktionale Aufteilung (z.B. `/components`, `/store`, `/utils`, `/assets`).

**5. Release und Deployment**

* **Semantic Versioning:** Versionierung erfolgt nach dem Schema Major.Minor.Patch (z.B. `1.0.0`).
* **CI/CD:** Das Deployment auf Cloudflare Pages erfolgt vollständig automatisiert. Ein Push oder Merge in den `main`-Branch löst den Build-Prozess aus. Der Push selbst erfolgt manuell durch den Entwickler.
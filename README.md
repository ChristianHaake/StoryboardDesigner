# StoryboardCreator

Eine rein clientseitige Web-App für Lernende zum Erstellen von Storyboards (Film, Fotostory, Rede). Projekte werden lokal als `.storyboard`-Datei (ZIP mit `data.json` und Bildern) gespeichert — kein Backend, keine Accounts, keine Datenübertragung.

## Tech-Stack

- **Build & Framework:** Vite, React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand 5
- **Drag & Drop:** @dnd-kit
- **Dateiformat:** jszip + file-saver (`.storyboard` ZIP)
- **Autosave:** idb-keyval / IndexedDB
- **PDF-Export:** native Druckfunktion (`window.print()`) mit Print-CSS
- **Feldsystem:** projektweite Zusatzfelder und Formatvorlagen
- **Mehrsprachigkeit:** i18next + react-i18next (DE/EN, Browser-Erkennung)

## Lokales Setup

```bash
npm install
npm run dev      # Dev-Server (Vite)
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
npm test         # Automatisierte Tests einmalig ausführen
npm run lint     # ESLint
npm run format   # Prettier
```

Voraussetzung: Node.js ≥ 22.12 (gepinnt in `.node-version`, Vite 8 benötigt ≥ 22.12).

## Deployment

Das Deployment erfolgt auf **Cloudflare** (Workers-Flow, statische Assets):

1. Repository in Cloudflare unter Workers & Pages verbinden.
2. Build-Befehl: `npm run build`, Bereitstellungsbefehl: `npx wrangler deploy`.
3. Konfiguration liegt in [`wrangler.jsonc`](wrangler.jsonc) — serviert `dist/` mit SPA-Fallback (`not_found_handling: single-page-application`).
4. Node-Version ist über [`.node-version`](.node-version) auf 22 gepinnt (Vite 8 braucht ≥ 22.12).
5. Push/Merge in den `main`-Branch löst den Build automatisch aus (der Push selbst erfolgt manuell durch den Entwickler).

Vor Veröffentlichung müssen die Rechtstexte durch den Betreiber rechtlich geprüft sowie Druck/PDF auf den eingesetzten iPads getestet werden.

## Projektdokumente

- [ARCHITECTURE.md](ARCHITECTURE.md) — technischer Überblick (Ist-Zustand, Datenfluss, Entscheidungen)
- [Codingplan.md](Codingplan.md) — Architektur, Datenmodell, Kernfunktionen
- [UIX-Codingplan.md](UIX-Codingplan.md) — UI/UX-Konzept (A4-Dokument, WYSIWYG)
- [Sprint-Planung.md](Sprint-Planung.md) — Sprints 1–12
- [UI-Backlog.md](UI-Backlog.md) — User-Stories zur UI-Verbesserung (Befunde + Epics A–D)
- [RulesofWorking.md](RulesofWorking.md) — Entwicklungsvorgaben
- [CHANGELOG.md](CHANGELOG.md) — Änderungshistorie

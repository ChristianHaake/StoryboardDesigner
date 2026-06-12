# StoryboardCreator

Eine rein clientseitige Web-App für Lernende zum Erstellen von Storyboards (Film, Fotostory, Rede). Projekte werden lokal als `.storyboard`-Datei (ZIP mit `data.json` und Bildern) gespeichert — kein Backend, keine Accounts, keine Datenübertragung.

## Tech-Stack

- **Build & Framework:** Vite, React, TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand (ab Sprint 2)
- **Drag & Drop:** @dnd-kit (ab Sprint 2)
- **Dateiformat:** jszip + file-saver (ab Sprint 4)
- **Autosave:** idb-keyval / IndexedDB (ab Sprint 2)
- **PDF-Export:** native Druckfunktion (`window.print()`) mit Print-CSS

## Lokales Setup

```bash
npm install
npm run dev      # Dev-Server (Vite)
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
npm run lint     # ESLint
npm run format   # Prettier
```

Voraussetzung: Node.js ≥ 20.

## Deployment

Das Deployment erfolgt auf **Cloudflare** (Workers-Flow, statische Assets):

1. Repository in Cloudflare unter Workers & Pages verbinden.
2. Build-Befehl: `npm run build`, Bereitstellungsbefehl: `npx wrangler deploy`.
3. Konfiguration liegt in [`wrangler.jsonc`](wrangler.jsonc) — serviert `dist/` mit SPA-Fallback (`not_found_handling: single-page-application`).
4. Node-Version ist über [`.node-version`](.node-version) auf 22 gepinnt (Vite 8 braucht ≥ 22.12).
5. Push/Merge in den `main`-Branch löst den Build automatisch aus (der Push selbst erfolgt manuell durch den Entwickler).

## Projektdokumente

- [ARCHITECTURE.md](ARCHITECTURE.md) — technischer Überblick (Ist-Zustand, Datenfluss, Entscheidungen)
- [Codingplan.md](Codingplan.md) — Architektur, Datenmodell, Kernfunktionen
- [UIX-Codingplan.md](UIX-Codingplan.md) — UI/UX-Konzept (A4-Dokument, WYSIWYG)
- [Sprint-Planung.md](Sprint-Planung.md) — Sprints 1–5
- [RulesofWorking.md](RulesofWorking.md) — Entwicklungsvorgaben
- [CHANGELOG.md](CHANGELOG.md) — Änderungshistorie

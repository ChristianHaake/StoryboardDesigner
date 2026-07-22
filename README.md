# Storyboard-Creator

🌍 **Live-App:** [sbc.haak3.de](https://sbc.haak3.de)

Eine rein clientseitige Web-App für Lernende zum Erstellen von Storyboards (Film, Fotostory, Rede, Podcast). Projekte werden lokal als `.storyboard`-Datei (ZIP mit `data.json` und Bildern) gespeichert — kein Backend, keine Accounts, keine Datenübertragung. Die App bietet zudem spezielle Vorlagen und eine Ansicht für Lehrkräfte.

## Tech-Stack

- **Build & Framework:** Vite, React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand 5
- **Drag & Drop:** @dnd-kit
- **Dateiformat:** jszip + file-saver (`.storyboard` ZIP)
- **Autosave:** idb-keyval / IndexedDB
- **PDF-Export:** lokaler PDF-Download via `html-to-image` + `jsPDF`; separater Druckpfad über `window.print()`
- **Feldsystem:** projektweite Zusatzfelder und Formatvorlagen
- **Mehrsprachigkeit:** i18next + react-i18next (DE/EN/ES/FR, Browser-Erkennung, Fallback Deutsch)

## Lokales Setup

```bash
npm install
npm run dev      # Dev-Server (Vite)
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
npm test         # Automatisierte Tests einmalig ausführen
npm run test:e2e # Browser-Regression in Chromium und WebKit
npm run typecheck
npm run lint     # ESLint
npm run format   # Prettier
```

Voraussetzung: Node.js ≥ 22.12 (gepinnt in `.node-version`, Vite 8 benötigt ≥ 22.12).

## CI & Deployment

Das Deployment erfolgt auf **Cloudflare** (Workers-Flow, statische Assets):

1. Repository in Cloudflare unter Workers & Pages verbinden.
2. Build-Befehl: `npm run build`, Bereitstellungsbefehl: `npx wrangler deploy`.
3. Konfiguration liegt in [`wrangler.jsonc`](wrangler.jsonc) — serviert `dist/` mit SPA-Fallback (`not_found_handling: single-page-application`).
4. Node-Version ist über [`.node-version`](.node-version) auf 22 gepinnt (Vite 8 braucht ≥ 22.12).
5. **CI-Workflow**: Ein GitHub Actions Workflow (`ci.yml`) prüft bei jedem Push und Pull Request die Typen, das Linting und die Tests.
6. Push/Merge in den `main`-Branch löst das Cloudflare-Deployment automatisch aus.

Vor Veröffentlichung müssen die Rechtstexte durch den Betreiber rechtlich geprüft sowie Druck/PDF auf den eingesetzten iPads getestet werden.

## haak3-Standard

Diese App folgt dem
[haak3 Web App Standard](https://github.com/ChristianHaake/haak3-webapp-standard).
Agenten-Vorgaben stehen in [AGENTS.md](AGENTS.md); Konformität und Ausnahmen in
[docs/standard-conformance.md](docs/standard-conformance.md).

## Projektdokumente

- [docs/architecture.md](docs/architecture.md) — technischer Überblick (Ist-Zustand, Datenfluss, Entscheidungen)
- [docs/standard-conformance.md](docs/standard-conformance.md) — Standard-Konformität und Ausnahmen
- [docs/review-checklist.md](docs/review-checklist.md) — Release-Review-Checkliste
- [CHANGELOG.md](CHANGELOG.md) — Änderungshistorie
- [docs/planning/](docs/planning/) — Planungsdokumente:
  - [Codingplan.md](docs/planning/Codingplan.md) — Architektur, Datenmodell, Kernfunktionen
  - [UIX-Codingplan.md](docs/planning/UIX-Codingplan.md) — UI/UX-Konzept (A4-Dokument, WYSIWYG)
  - [Sprint-Planung.md](docs/planning/Sprint-Planung.md) — Sprints 1–12
  - [UI-Backlog.md](docs/planning/UI-Backlog.md) — User-Stories zur UI-Verbesserung (Befunde + Epics A–D)
  - [Feature-Backlog.md](docs/planning/Feature-Backlog.md) — geplante Funktionsfeatures (Releases 1.3 - 1.5)
  - [RulesofWorking.md](docs/planning/RulesofWorking.md) — Entwicklungsvorgaben

## Lizenz

GPL-3.0-only — siehe [LICENSE](LICENSE).

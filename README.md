# Storyboard-Creator

🌍 **Live-App:** [sbc.haak3.de](https://sbc.haak3.de)

Eine rein clientseitige Web-App für Lernende zum Erstellen von Storyboards (Kurzfilm, Erklärvideo, Fotostory, Hörspiel, Podcast, Stop-Motion, Social-Media-Clip, Rollenspiel). Projekte werden lokal als `.storyboard`-Datei (ZIP mit `data.json` und Bildern) gespeichert — kein Backend, keine Accounts, keine Datenübertragung.

## ✨ Features

- **Format-Vorlagen & Detailgrade:** Vordefinierte, zielgruppengerechte Felder je nach Format (z.B. Kameraperspektive, Requisite) sowie anpassbare Detailgrade (Einfach, Standard, Erweitert).
- **Lehrkräfte-Ansicht:** Spezielle Informationsseite mit didaktischen Hinweisen und Einsatzszenarien für den Unterricht.
- **Offline-First & Autosave:** IndexedDB-basiertes automatisches Speichern und vollständige Offline-Nutzbarkeit nach dem ersten Laden.
- **Mehrsprachigkeit:** Unterstützt Deutsch, Englisch, Spanisch und Französisch (automatische Browser-Erkennung mit Fallback auf Deutsch).
- **Exportmöglichkeiten:** Lokaler PDF-Export, Export als ZIP (`.storyboard`) zum Teilen und ein nativer Druckpfad.
- **Undo/Redo & Feedback-Modus:** Nachvollziehbare Änderungshistorie und ein dedizierter Modus für Kommentare an einzelnen Szenen.

## 🛠 Tech-Stack

- **Build & Framework:** Vite, React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand 5
- **Drag & Drop:** @dnd-kit
- **Dateiformat & Export:** jszip, file-saver, html-to-image, jsPDF
- **Speicherung:** idb-keyval (IndexedDB)
- **I18n:** i18next, react-i18next

## 🚀 Lokales Setup

Voraussetzung: Node.js ≥ 22.12 (gepinnt in `.node-version`).

```bash
npm install
npm run dev      # Dev-Server (Vite)
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
npm test         # Automatisierte Tests (vitest)
npm run test:e2e # Browser-Regression in Chromium und WebKit (playwright)
npm run typecheck
npm run lint     # ESLint
npm run format   # Prettier
```

## ☁️ CI & Deployment

Das Deployment erfolgt auf **Cloudflare** (Workers-Flow, statische Assets):

1. **Infrastruktur:** Serviert `dist/` mit SPA-Fallback (`not_found_handling: single-page-application`) via `wrangler.jsonc`.
2. **CI-Workflow:** GitHub Actions (`ci.yml`) prüft bei jedem Push und Pull Request Typen, Linting und Tests.
3. **Deployment:** Ein Push/Merge in den `main`-Branch löst das Cloudflare-Deployment automatisch aus.

*Hinweis: Vor Veröffentlichung müssen die Rechtstexte durch den Betreiber rechtlich geprüft sowie Druck/PDF auf den eingesetzten iPads getestet werden.*

## 📚 Dokumentation

- [docs/architecture.md](docs/architecture.md) — technischer Überblick (Datenfluss, Architektur-Entscheidungen)
- [docs/standard-conformance.md](docs/standard-conformance.md) — haak3-Standard-Konformität und Ausnahmen
- [docs/review-checklist.md](docs/review-checklist.md) — Release-Review-Checkliste
- [CHANGELOG.md](CHANGELOG.md) — Änderungshistorie und Release-Notes

Historische Planungsdokumente (Sprints, UI-Konzepte) befinden sich zur Nachvollziehbarkeit im Ordner [`docs/planning/`](docs/planning/).

## ⚖️ Lizenz

GPL-3.0-only — siehe [LICENSE](LICENSE).
Diese App folgt dem [haak3 Web App Standard](https://github.com/ChristianHaake/haak3-webapp-standard). Agenten-Vorgaben stehen in [AGENTS.md](AGENTS.md).

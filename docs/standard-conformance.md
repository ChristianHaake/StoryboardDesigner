# haak3 Standard Conformance

Standard:
https://github.com/ChristianHaake/haak3-webapp-standard

Standard version: `1.0.0-draft`

Last reviewed: `2026-06-13`

## Exceptions

Use this format for every exception:

```text
Rule:
Reason:
Scope:
Temporary or permanent:
Review date:
```

```text
Rule: Legal/info content lives in top-level content/.
Reason: App loads markdown via Vite `?raw` imports from src/content/ (see
  src/App.tsx). Moving to top-level content/ would break the build wiring.
Scope: src/content/{hilfe,hilfe.en,datenschutz,impressum}.md
Temporary or permanent: Permanent.
Review date: n/a
```

```text
Rule: CSP style-src 'self' only.
Reason: dnd-kit writes drag transforms to inline style attributes and
  html-to-image injects inline styles into cloned nodes; both require
  'unsafe-inline'. Relaxed in public/_headers.
Scope: public/_headers Content-Security-Policy style-src.
Temporary or permanent: Permanent while using @dnd-kit + html-to-image.
Review date: n/a
```

## App-specific decisions

- **Undo/Redo** covers project content (metaData, prePlanning, fieldDefinitions,
  scenes) via a snapshot stack (`utils/history.ts`). Images are intentionally
  excluded — image add/remove has its own flow and the per-scene delete keeps
  its own undo snackbar. Keyboard shortcuts defer to native text undo while a
  form field is focused.
- Planning and design docs are kept under `docs/planning/`.
- PDF export uses native `window.print()` with print CSS, not a server.
- State persists via `idb-keyval` / IndexedDB (autosave) plus `.storyboard`
  ZIP files (`jszip` + `file-saver`) for durable backups.
- **Theming** (light / dark / high-contrast) is implemented by overriding
  Tailwind v4 theme variables (`--color-*`) under `html[data-theme]` in
  `index.css`, rather than migrating every component className to semantic
  token classes. Components keep referencing Tailwind utilities, which compile
  to `var(--color-*)`; the data-theme scope remaps the neutral/accent ramp.
  Semantic baseline tokens (`--surface`, `--text`, `--primary` …) are defined
  in `:root`. Theme + font scale persist in `localStorage` and apply pre-paint
  via a boot script (no flash).

## Known gaps & documented limitations

- **Alt text in PDF export.** Scenes carry a per-image `altText` (editor field,
  drives `<img alt>`, persisted in `.storyboard`). The PDF export rasterizes the
  DOM (`html-to-image` → PNG → jsPDF), so alt text cannot be embedded as text in
  the PDF. The accessible alternatives are the live app (screen readers read
  `<img alt>`) and the `.storyboard` file. A tagged-PDF or HTML export path would
  be required to carry alt text into the export itself.

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

- Planning and design docs are kept under `docs/planning/`.
- PDF export uses native `window.print()` with print CSS, not a server.
- State persists via `idb-keyval` / IndexedDB (autosave) plus `.storyboard`
  ZIP files (`jszip` + `file-saver`) for durable backups.

## Known gaps

- Footer lacks an "Über" route; template ships `content/ueber.md`. Add an Über
  page if the standard requires it.

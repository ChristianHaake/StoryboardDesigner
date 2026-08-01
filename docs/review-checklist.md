# Release Review

Copy the current checklist from:
https://github.com/ChristianHaake/haak3-webapp-standard/blob/main/docs/review-checklist.md

Record release-specific results below.

## Release

- Version: `1.5.0`
- Review date: `2026-07-22`
- Reviewer: `Agent`

## Results

- [x] Shared checklist completed.
- [x] Automated verification passed (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`).
- [x] Mobile and tablet (iPad) workflow tested.
- [x] Import, export, reset, and recovery tested (`.storyboard` round-trip).
- [x] Legal and privacy content reviewed (Datenschutz, Impressum).
- [x] Exceptions documented in `docs/standard-conformance.md`.

## Notes

### Interface mitigation review — 2026-08-01

- [x] Typecheck and zero-warning lint passed.
- [x] 63 unit tests passed.
- [x] Production build passed.
- [x] 64 Playwright tests passed across Chromium and WebKit without injected
      header positioning or blanket animation suppression.
- [x] Automated checks cover 320px large-text shell overflow, four locales,
      long unbroken review titles, 44px shell targets, presentation keyboard
      routing, wizard heading focus, and stable sticky-header geometry.
- [x] Reduced-motion browser contexts collapse production transition and
      animation durations to at most 0.01ms.
- [x] A 640 CSS-pixel reflow proxy has no horizontal overflow or undersized
      header/footer targets. This is evidence for 200% reflow behavior, not an
      actual browser-zoom or screen-reader check.
- [x] Representative direct-PDF and two-page print output were visually
      inspected with long project, scene-title, and scene-content strings. No
      clipping, damaged wrapping, or app chrome was found.
- [x] Manual motion review at 10% playback speed.
- [x] Manual 200% browser zoom review in Chrome.
- [ ] Manual VoiceOver review.
- [ ] Physical iPad Safari and managed-device download/print review.

Manual-check evidence (2026-08-01): connected Chrome confirmed actual 200% page
zoom (`devicePixelRatio: 4`; viewport reduced from 1512 to 756 CSS pixels). The
landing page, storyboard editor, review, export, and presentation states had no
horizontal overflow, clipped content, obscured headings, or undersized visible
controls after repair. The pass found the scene-title inputs at 16px high; they
now provide a 44px screen target while retaining compact print output. The
focused Chromium/WebKit regression passed 12/12.

Chrome DevTools 10%-speed replay and timeline scrubbing covered the display-mode
icon crossfade, scene-collapse chevrons, wizard progress states, presentation
Play/Pause icons, and header language selection. No snapping, flicker, visibly
overlapping states, reversal defects, or first-frame stutter were found.
VoiceOver and physical managed-iPad checks remain open in their native
environments.

### PDF performance follow-up — 2026-08-01

- [x] The direct exporter now paginates the html-to-image canvas without a
      full-document PNG encode/decode, filters print-hidden nodes, embeds page
      JPEGs, and caps the render height consistently.
- [x] A three-scene, image-bearing, long-content fixture completed in Chromium
      and WebKit within the 30-second per-download regression bound.
- [x] The local Chromium evidence run completed in 287ms and produced a readable
      three-page A4 PDF of 597KB without clipping or captured focus styling.

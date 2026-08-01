# Interface-Polish Mitigation Coding Plan

Status: Implemented; automated verification and representative output review complete, manual device checks pending  
Created: 2026-07-31  
Source: Full `make-interfaces-feel-better` evaluation of the current local app

Verification snapshot (2026-08-01): typecheck, zero-warning lint, 63 unit tests,
production build, and the Chromium/WebKit Playwright suite passed. Automated
reduced-motion coverage and a 640 CSS-pixel reflow proxy were added; all 64
Playwright tests passed.
Representative direct-PDF and two-page print artifacts were visually inspected
without clipping. The direct-PDF raster path was optimized after a heavier
fixture exposed a timeout: the same three-scene, image-bearing fixture now
completes within the automated 30-second bound in Chromium and WebKit, and a
local Chromium evidence run completed in 287ms with a 597KB three-page A4 file.
An actual 200% Chrome zoom pass covered the landing page, storyboard editor,
review, export, and presentation states. It exposed and closed a 16px-high
scene-title target; the screen target is now 44px with compact print styling
preserved. Chrome DevTools 10%-speed replay and bidirectional scrubbing passed
for icon, collapse, wizard-navigation, presentation, and header-selection
motion. VoiceOver and physical iPad Safari remain release checks rather than
automated claims.

## 1. Objective

Resolve all 15 findings from the interface evaluation:

- 4 HIGH interaction and responsive defects
- 5 MEDIUM usability, accessibility, motion, and target-size defects
- 6 LOW typography, surface, and micro-interaction defects

The implementation must preserve:

- the client-only architecture;
- the `.storyboard` format and project schema;
- local IndexedDB autosave;
- the existing Tailwind CSS v4 and `@haak3/ui` workspace stack;
- the current progressive-disclosure and format-visibility rules;
- print and PDF behavior.

No new styling or motion library is required.

## 2. Non-goals

- Redesigning the product workflow or visual identity
- Changing the project data model or import/export format
- Reworking legal copy
- Adding backend services, accounts, analytics, or network calls
- Replacing Lucide
- Expanding the task into unrelated security or dependency work

## 3. Finding traceability

| ID  | Severity | Finding                                                                                     | Primary files                                                                    |
| --- | -------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| H1  | HIGH     | Long scene titles break the review viewport                                                 | `ReviewScreen.tsx`                                                               |
| H2  | HIGH     | 320px plus extra-large text overflows and clips header, actions, scene controls, and footer | `index.css`, `SharedTopBar.tsx`, `BrandLogo.tsx`, `TopBar.tsx`, `Footer.tsx`     |
| H3  | HIGH     | Presentation Space shortcut intercepts focused controls                                     | `PresentationView.tsx`                                                           |
| H4  | HIGH     | Collapsing sticky header creates unstable or intercepted WebKit targets; tests mask it      | `SharedTopBar.tsx`, `storyboard.spec.ts`, `additional_features.spec.ts`          |
| M1  | MEDIUM   | Disabled mobile document actions lose their action-specific accessible names                | `TopBar.tsx`                                                                     |
| M2  | MEDIUM   | Repeated interactive targets are below 44px                                                 | Layout, wizard, editor, presentation, and footer components                      |
| M3  | MEDIUM   | Image-fit action is hover-only and 28px high                                                | `SceneCard.tsx`                                                                  |
| M4  | MEDIUM   | Lazy routes are blank and wizard step changes lose focus/context                            | `App.tsx`, `WizardRouter.tsx`, wizard screens                                    |
| M5  | MEDIUM   | `transition-all` and 1.10 hover scaling create broad or restless motion                     | Shared header, wizard, navigator, presentation                                   |
| L1  | LOW      | Shared buttons lack 0.96 press feedback; contextual icons swap instantly                    | `fieldStyles.ts`, `DisplaySettings.tsx`, `PresentationView.tsx`, `SceneCard.tsx` |
| L2  | LOW      | Root typography lacks macOS font smoothing                                                  | `index.css`                                                                      |
| L3  | LOW      | Headings and short descriptions lack intentional wrapping                                   | Wizard and dialog components                                                     |
| L4  | LOW      | Several dynamic counters lack tabular numerals                                              | Review, comments, and field dialog                                               |
| L5  | LOW      | Uploaded images lack a neutral inset outline                                                | Editor and presentation                                                          |
| L6  | LOW      | Start-screen tab radii are not concentric                                                   | `StartScreen.tsx`                                                                |

## 4. Implementation principles

1. Fix shared primitives before individual screens.
2. Keep all styling in Tailwind and the existing global CSS.
3. Do not use `transition-all`.
4. Interactive targets are at least 44×44px in this touch-first app.
5. User-entered strings must not determine viewport width.
6. Motion must remain interruptible and respect `prefers-reduced-motion`.
7. Automated tests must exercise production layout behavior. They must not replace sticky positioning or disable the behavior under test.
8. Each phase ends with its targeted tests before the next phase begins.

## 5. Phase 0 — Add failing regression coverage

Create regression tests before structural changes.

### 5.1 Responsive overflow helpers

Add a shared E2E helper that records:

```text
document.documentElement.scrollWidth <= window.innerWidth
```

Exercise it with:

- viewports: 320, 390, 451, 600, 601, 768, and 1280px;
- languages: DE, EN, ES, and FR at the narrow and boundary widths;
- font settings: normal and extra-large;
- themes: light, dark, and high-contrast where layout can change;
- screens: start, populated editor, review, export, presentation, and one content page.

Add explicit adversarial strings:

- a long unbroken scene title;
- a long multi-word project title;
- the longest translated header and action labels.

### 5.2 Presentation keyboard regression

Add tests proving:

- Space on focused Play activates Play and changes the accessible name to Pause;
- Space on focused Pause activates Pause;
- Enter still activates presentation controls;
- Space outside an interactive control advances a scene;
- ArrowLeft, ArrowRight, and Escape retain their current behavior.

### 5.3 Header production-behavior regression

Add a dedicated Chromium and WebKit test that uses the real header CSS:

- scroll beyond the former collapse threshold;
- tab through and activate header controls;
- activate a body control after Playwright scrolls it into view;
- assert that no header element intercepts the body control;
- assert stable bounding boxes during interaction.

Do not inject `header { position: static !important }` in this test.

### 5.4 Focus and loading regression

Add checks that:

- lazy route loading exposes a named `role="status"`;
- step transitions focus the new step heading;
- the field dialog still traps focus, closes with Escape, and restores focus;
- focus is not obscured by header or footer UI.

## 6. Phase 1 — Remove the four release blockers

### 6.1 H3: Correct presentation keyboard routing

In `PresentationView.tsx`:

1. Detect whether `event.target` is a button, link, input, select, textarea, or editable element.
2. Return without handling global slide shortcuts when the target is interactive.
3. Keep Escape global unless a modal or other higher-priority surface is introduced.
4. Keep Space as slide-next only when focus is not on an interactive control.

Acceptance:

- native button keyboard behavior works;
- body-level slide shortcuts still work;
- the new keyboard regression suite passes in Chromium and WebKit.

### 6.2 H1: Bound user-entered content

In `ReviewScreen.tsx`:

1. Give the title group `min-w-0 flex-1`.
2. Give the title `break-words` plus `overflow-wrap:anywhere`.
3. Keep the status group `shrink-0`.
4. Stack title and status vertically below the selected small-screen breakpoint.
5. Apply `text-pretty` where it does not conflict with arbitrary-word breaking.

Audit other user-content renderers during the same patch:

- project title in `EditorView.tsx`;
- metadata definition lists;
- custom-field labels and values;
- presentation text blocks;
- notifications.

Acceptance:

- long user content never increases root `scrollWidth`;
- the complete title remains readable;
- status text remains visible;
- print output wraps without clipping.

### 6.3 H2 and H4: Replace the collapsing app shell

Treat header and footer behavior as one responsive-shell change.

#### Header

1. Remove scroll-driven `max-height`, padding, and opacity collapse from `SharedTopBar`.
2. Remove `transition-all`.
3. Use stable geometry:
   - mobile: static header with wrapping control and action rows;
   - tablet/desktop: stable sticky header without layout collapse.
4. Render the supplied square logo below the mobile breakpoint and the wide logo above it.
5. Add `shrink-0` to the active logo asset.
6. Let the action toolbar wrap into two rows at 320px or large text instead of overflowing.
7. Keep every action visible; do not solve width pressure by shrinking targets below 44px.

#### Footer

1. Make the footer part of normal document flow on mobile and tablet.
2. Retain fixed positioning only where a single stable desktop row fits.
3. Remove the unconditional mobile `pb-14` compensation from `App.tsx`.
4. Let legal links wrap with 44px targets.
5. Keep support and repository links accessible without horizontal scrolling.

#### Tests

1. Remove the `header { position: static !important }` test override after the production header is stable.
2. Remove blanket animation suppression from tests intended to validate production motion.
3. If reduced motion is needed for unrelated deterministic tests, use the browser context preference so the production reduced-motion CSS is exercised.

Acceptance:

- no horizontal overflow at the required widths, languages, themes, or font sizes;
- no clipped logo, header control, action, footer link, or repository link;
- no intercepted body click in WebKit;
- header target bounding boxes do not move while being activated;
- footer never obscures the last content line or focus target.

## 7. Phase 2 — Accessibility and control geometry

### 7.1 M1: Preserve disabled action identity

In `TopBar.tsx`:

1. Keep each action’s accessible name: Present, Print, and PDF.
2. Add the prerequisite as associated descriptive text, not as the replacement name.
3. Use `aria-describedby` for “Add a scene first”.
4. Verify both mobile icon-only and desktop labelled states.

Acceptance:

- each disabled control has a unique accessible name;
- assistive technology exposes both action and reason;
- no duplicate “Add a scene first” controls appear in the accessibility tree.

### 7.2 M2: Establish 44px control primitives

Update `fieldStyles.ts` to provide:

- a shared 44px minimum-height button base;
- a 44×44px icon-button class;
- an optional compact desktop variant only where touch is not expected.

Migrate every affected control:

- `LanguageToggle`;
- `DisplaySettings`;
- footer links, support link, and repository link;
- top-bar educator, comments, and file-menu actions;
- file-menu rows;
- wizard back buttons;
- start-screen template buttons;
- editor back/review and collapse-all controls;
- scene navigator buttons;
- presentation duration, Play/Pause, and close buttons.

Do not use overlapping pseudo-element targets.

Acceptance:

- automated geometry audit reports no target below 44px in the core workflow;
- adjacent hit areas do not overlap;
- large-text mode reflows instead of enlarging the viewport.

### 7.3 M3: Expose image-fit on touch

In `SceneCard.tsx`:

1. Add `pointer-coarse:opacity-100` to the image-fit overlay.
2. Increase the control to at least 44px high.
3. Keep hover/focus reveal on fine-pointer desktop devices.
4. Add an explicit accessible name describing the resulting action.
5. Confirm it does not overlap the remove-image control.

Acceptance:

- fit action is visible and operable on touch;
- keyboard focus reveals it;
- both image controls have non-overlapping 44px targets;
- print remains unchanged.

### 7.4 M4: Restore step and loading context

1. Replace both `Suspense fallback={null}` instances with a localized, dimension-preserving `role="status"` loading surface.
2. Add a small step-focus hook or component:
   - heading receives `tabIndex={-1}`;
   - focus moves after the new step is mounted;
   - focus uses `preventScroll` only when it does not hide the heading behind sticky UI.
3. Announce the active step using existing translated step names.
4. Preserve the current field-dialog focus behavior.

Acceptance:

- no blank main area during chunk loading;
- focus lands on the new step heading;
- screen-reader context includes the new step;
- back/forward transitions behave consistently.

## 8. Phase 3 — Motion and transition cleanup

### 8.1 M5: Replace broad transitions

Replace every `transition-all` with exact properties:

| Surface             | Required properties                                         |
| ------------------- | ----------------------------------------------------------- |
| Format cards        | `border-color`, `box-shadow`, optionally `background-color` |
| Format arrow        | `color`, `opacity`, `translate`                             |
| Complexity cards    | `border-color`, `background-color`, `box-shadow`            |
| Progress bar        | `width`                                                     |
| Presentation arrows | `background-color`, `opacity`                               |

Remove `hover:scale-110` from presentation navigation. Color and opacity already provide sufficient feedback.

Acceptance:

- `rg "transition-all|transition: all"` returns no application matches;
- high-frequency interactions use no decorative scale animation;
- reduced-motion mode remains functional.

### 8.2 L1: Add restrained feedback

1. Add `motion-safe:active:scale-[0.96]` to the shared button primitive.
2. Include only `scale` and existing state properties in the transition list.
3. Keep a static opt-out for controls where movement would be distracting.
4. For theme and Play/Pause icons, keep both icons mounted and use the prescribed CSS cross-fade:
   - scale `0.25` to `1`;
   - opacity `0` to `1`;
   - blur `4px` to `0`;
   - `cubic-bezier(0.2, 0, 0, 1)`.
5. Replace the scene collapse icon swap with one rotating chevron.

Acceptance:

- press feedback is exactly 0.96;
- no new dependency is added;
- icon state remains understandable without motion;
- reduced-motion removes movement but preserves the static state cue.

## 9. Phase 4 — Typography and surfaces

### 9.1 L2: Font smoothing

Add to the root typography:

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

Verify that high-contrast and print styles do not override it unintentionally.

### 9.2 L3: Intentional text wrapping

Add:

- `text-balance` to short `h1`, `h2`, and card headings;
- `text-pretty` to short descriptions, captions, and guidance;
- no balancing on long Markdown content;
- `break-words`/`overflow-wrap:anywhere` to arbitrary user content.

Review all four languages at 320, 390, 601, and 768px.

### 9.3 L4: Tabular numerals

Add `tabular-nums` to:

- review scene badges;
- comment counts;
- field-usage counts;
- preserved-field counts;
- any other changing count identified by the audit.

Do not apply it to decorative or static version numbers.

### 9.4 L5: Image edge treatment

Create one reusable image-outline utility:

- light: inset `1px` pure black at 10%;
- dark: inset `1px` pure white at 10%;
- no tinted neutral;
- no layout-changing border.

Apply it to editor and presentation images. Disable or neutralize it in print if it degrades printed output.

### 9.5 L6: Concentric start-screen tabs

Change either:

- outer tablist radius from 16px to 20px; or
- inner tab radius from 12px to 8px.

Preferred: keep 12px tabs and use a 20px outer radius because the current card language already favors larger container radii.

## 10. Phase 5 — Verification and release evidence

### 10.1 Automated gates

Run:

```text
npm run typecheck
npm run lint -- --max-warnings=0
npm test
npm run build
npm run test:e2e
```

Required outcome:

- all commands pass;
- Chromium and WebKit pass without production-behavior masking;
- existing import/export, autosave, reorder, format-matrix, PDF, and print-call coverage remains green.

### 10.2 Manual browser matrix

Verify:

- 320×740
- 390×844
- 451px
- 600px
- 601px
- 768×1024
- 1280×800

For each relevant breakpoint:

- DE, EN, ES, and FR;
- light, dark, and high-contrast;
- normal and extra-large text;
- empty, populated, loading, error, and recovery states;
- hover, focus, active, disabled, and touch-equivalent states.

### 10.3 Motion review

Using a browser Animations panel:

1. Replay header, selection, icon, and navigation transitions at 10% speed.
2. Confirm interruption and reversal do not snap.
3. Confirm no first-frame stutter before adding any `will-change`.
4. Repeat with reduced motion enabled.

### 10.4 Accessibility review

Complete:

- keyboard-only primary workflow;
- actual 200% browser zoom;
- VoiceOver checks for header, wizard steps, field dialog, deletion recovery, and presentation;
- focus visibility and non-obscuration;
- unique accessible names for all icon-only and disabled controls.

### 10.5 Output and target-device review

Complete:

- visual PDF inspection with short and long content;
- print preview inspection for clipping and wrapping;
- physical iPad Safari test;
- managed-device/MDM download and print behavior where available.

Record manual results in `docs/review-checklist.md`. Do not claim these checks from WebKit automation alone.

## 11. File-impact summary

Expected source changes:

```text
packages/haak3-ui/src/SharedTopBar.tsx
src/app/App.tsx
src/app/layout/BrandLogo.tsx
src/app/layout/DisplaySettings.tsx
src/app/layout/Footer.tsx
src/app/layout/LanguageToggle.tsx
src/app/layout/TopBar.tsx
src/features/editor/CommentThread.tsx
src/features/editor/EditorView.tsx
src/features/editor/SceneCard.tsx
src/features/editor/SceneNavigator.tsx
src/features/presentation/PresentationView.tsx
src/features/wizard/ExportScreen.tsx
src/features/wizard/ReviewScreen.tsx
src/features/wizard/SetupScreen.tsx
src/features/wizard/StartScreen.tsx
src/features/wizard/WizardRouter.tsx
src/shared/ui/FieldConfigDialog.tsx
src/shared/ui/fieldStyles.ts
src/styles/index.css
tests/e2e/additional_features.spec.ts
tests/e2e/release_qa_regression.spec.ts
tests/e2e/storyboard.spec.ts
docs/review-checklist.md
```

No schema migration, translation-key removal, or project-file change is expected. New loading and accessibility descriptions may require additive translation keys in all four locale files.

## 12. Risks and controls

| Risk                                                    | Control                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Header restructuring regresses long-editor reachability | Test long pages at mobile and tablet before merging later polish             |
| Large-text fixes create excessive header height         | Prefer wrapping and static mobile chrome; measure visible task area          |
| Footer stops being persistently visible                 | Keep required links in normal flow and test direct content routes            |
| Focus movement causes scroll jumps                      | Focus only after mount and verify sticky-offset behavior                     |
| User-content wrapping harms print layout                | Include long strings in print/PDF checks                                     |
| Motion cleanup changes state clarity                    | Retain color, icon, label, and `aria-*` cues without relying on motion       |
| Test stability regresses after removing CSS overrides   | Synchronize against state and stable locators, not artificial layout changes |

## 13. Definition of done

The mitigation is complete only when:

- H1–H4, M1–M5, and L1–L6 are implemented;
- no HIGH, MEDIUM, or LOW finding remains reproducible;
- no supported viewport has horizontal page scrolling;
- all core interactive targets are at least 44×44px;
- presentation controls retain native keyboard activation;
- production header behavior passes Chromium and WebKit without test CSS overrides;
- lazy states and step changes preserve context and focus;
- all automated gates pass;
- remaining physical-device, screen-reader, zoom, motion, print, or PDF limitations are explicitly recorded rather than implied green.

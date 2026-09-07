# Advanced Motion — Implementation Plan (ROADMAP.md Phase 9)

Design spec: [docs/superpowers/specs/2026-09-07-advanced-motion-design.md](../specs/2026-09-07-advanced-motion-design.md). Read it first — this plan assumes its rationale and only restates what's needed to implement each task.

## Global Constraints

- No new npm dependencies. `motion` stays scoped to `/access`.
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build` must pass after every task, before its commit.
- One task = one commit, trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`, pushed to `main` immediately after.
- Vitest is Node-only (no jsdom) — pure logic goes in `lib/`, is unit-tested there; anything touching the DOM/browser is verified in Playwright.

---

### Task 1: Shared motion-capability utilities (`lib/motion/media.ts`)

**Red** — `lib/motion/media.test.ts`:
- `prefersReducedMotion`: given a fake matcher returning `{matches: true}` → `true`; asserts it was called with exactly `'(prefers-reduced-motion: reduce)'`; `{matches: false}` → `false`.
- `hasFinePointerAndHover`: asserts the exact query string `'(hover: hover) and (pointer: fine)'`; passthrough both ways.
- `isLowPerformanceDevice(hardwareConcurrency, deviceMemory)`: `(2, undefined)` → `true`; `(3, undefined)` → `false`; `(undefined, undefined)` → `false`; `(8, 1)` → `true` (deviceMemory alone triggers it); `(4, 4)` → `false`; boundary `(2, 2)` → `true`, `(3,3)` → `false`.

**Green** — `lib/motion/media.ts`:
```ts
type MatchMediaFn = (query: string) => { matches: boolean };

export function prefersReducedMotion(matchMedia: MatchMediaFn): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hasFinePointerAndHover(matchMedia: MatchMediaFn): boolean {
  return matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function isLowPerformanceDevice(
  hardwareConcurrency: number | undefined,
  deviceMemory: number | undefined,
): boolean {
  if (typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 2) return true;
  if (typeof deviceMemory === 'number' && deviceMemory <= 2) return true;
  return false;
}
```
Full header comments per the design spec's "Why `lib/motion/media.ts` is pure/injectable" section.

**Validate & commit.**

---

### Task 2: Custom cursor

**Red** — `tests/e2e/custom-cursor.spec.ts` (chromium project primarily; touch assertions use mobile-safari):
- On a storefront page, before any pointer movement, `document.documentElement` does not have the cursor-active class and no `.esque-custom-cursor` element is visible/positioned.
- After `page.mouse.move(x, y)`, the cursor-active class is present (initialization-safety).
- Under `page.emulateMedia({ reducedMotion: 'reduce' })`, after a mouse move, the class is still absent (feature never activates).
- On the mobile-safari project (touch), after a tap, the class is still absent.
- Hovering (`page.hover`) a `[data-cursor]` element (a `ProductCard` on a page that renders one, or — given this env has no Shopify products — assert directly against `FullScreenMenu`'s category links, which render unconditionally) sets the expected label/active state.
- `/access` never mounts the cursor (no `.esque-custom-cursor` node at all, even after a mouse move) — confirms the shell-only scoping decision.

**Green**:
- `components/navigation/CustomCursor.tsx` per the design spec's table — `useRef` for the dot node + a `initializedRef`/`labelRef`/`overFormFieldRef` trio to dedupe `setState` calls, one delegated `window` `pointermove` listener, two effects (capability-gated listener; `initialized` → toggles the `html` class).
- `app/globals.css` additions: `.esque-cursor-none` (+ `*` universal reach-down, + form-field re-enable by specificity), `.esque-custom-cursor` (8px default, `data-active` → 48-72px range midpoint, `data-hidden` → opacity 0), Micro-tier (120-200ms) transitions on size/opacity — already covered by the existing sitewide reduced-motion rule (plain CSS transitions), no separate CSS reduced-motion handling needed here.
- `components/navigation/ShellClient.tsx`: mount `<CustomCursor />` once, alongside `<FullScreenMenu>` (outside the `inert` wrapper — the cursor must keep tracking even while the full-screen menu is open, since it isn't part of the content the menu hides).
- `components/catalog/ProductCard.tsx`: add `data-cursor="VIEW"` to the existing `<Link>`.
- `components/navigation/FullScreenMenu.tsx`: add `data-cursor="OPEN"` to each category `<Link>`.

**Validate & commit.**

---

### Task 3: Homepage Hero parallax

**Red** — `tests/e2e/homepage.spec.ts` additions (extends the existing `homepage — motion` describe block):
- Desktop: simulate a pointer move over the page; assert the Hero wrapper's computed style custom property `--parallax-x`/`--parallax-y` (via `getComputedStyle`) is non-zero after the move (a real, observable signal the mechanism ran), and that it's `0`/absent before any movement (default-safe, no JS-required layout shift).
- Reduced motion (`emulateMedia({ reducedMotion: 'reduce' })`): after a pointer move, the custom properties stay unset/zero.
- Touch project (mobile-safari, `hasTouch`): same — properties stay unset/zero after a tap-drag.
- Regression: the existing `esque-hero-reveal` reduced-motion test and hero-structure tests continue to pass unmodified.

**Green**:
- `components/home/HeroParallax.tsx` — client wrapper per the design spec (ref + `window` `pointermove` + capability gate + `style.setProperty`).
- `components/home/CollectionHero.tsx`: wrap the three existing layers (background placeholder div, atmospheric `<h1>`, foreground `.esque-hero-reveal` group) in `<HeroParallax>`; add `esque-parallax-layer` class + inline `style={{ '--depth': 0.3 }}` (etc., 0.3/0.6/1.0 per layer) to each. No change to any layer's existing content, copy, or `aria-hidden`/opacity treatment.
- `app/globals.css`: `.esque-parallax-layer` (translate3d via `calc(var(--parallax-x,0) * var(--depth,0) * <px>)`), plus a reduced-motion override forcing `transform: none` (defense in depth alongside the JS-level gate).

**Validate & commit.**

---

### Task 4: View Transition infrastructure

**Red** — `lib/product/view-transition.test.ts`:
- `getProductViewTransitionName('hoodie-01')` → `'esque-product-hoodie-01'`.
- A handle with unsafe characters (e.g. `'hoodie 01!'`) → every disallowed character replaced with `-` (assert the exact sanitized output, not just "doesn't throw").
- Two different handles → two different names (no accidental collapsing).
- Idempotent on an already-safe handle (output content unchanged beyond the prefix).

**Green**:
- `lib/product/view-transition.ts` per the design spec.
- Add `import {} from 'react/experimental';` (one line, with a short comment citing DECISIONS.md D-038) to each file that will import `ViewTransition` from `'react'` in Tasks 5-6 — added in those tasks, not here, since this task has no consumer yet. (Noted here so Task 5/6 don't skip it.)
- Confirm `pnpm typecheck` passes with no consumer yet (this task is pure infra).

**Validate & commit.**

---

### Task 5: Grid ↔ PDP shared-element transitions

**Red**:
- `tests/e2e/catalog.spec.ts` / `pdp.spec.ts` additions: in this Shopify-unconfigured environment, assert the mechanism doesn't regress existing behavior — category routes and the product route still show their existing error-boundary/placeholder content unchanged (a coarse but real "did I break navigation or rendering" check, matching this project's own established honest limit for E2E verification without a live store).
- A new, narrower unit-level confidence check isn't meaningful here (the wrapping is JSX composition, not logic) — rely on Task 4's unit tests for the naming helper and the E2E checks above plus a `pnpm build` pass (catches any JSX/type error in the wrapping itself, e.g. a missing required prop).

**Green**:
- `components/catalog/ProductCard.tsx`: add `import { ViewTransition } from 'react'; import {} from 'react/experimental';`, add `enableSharedTransition?: boolean` prop (default `false`), wrap the existing image-container `<div>` in `<ViewTransition name={enableSharedTransition ? getProductViewTransitionName(product.handle) : undefined} share="morph" default="none">` when enabled (conditionally render the wrapped vs. unwrapped div — do not always mount `ViewTransition` with an `undefined` name if that risks React auto-assigning an unwanted identity; simplest correct approach: branch on `enableSharedTransition` and render either `<ViewTransition name={...} share="morph" default="none"><div>...</div></ViewTransition>` or the bare `<div>...</div>`, sharing the div's JSX via a local variable to avoid duplicating the image markup).
- `components/catalog/ProductGrid.tsx`: pass `enableSharedTransition` to every `<ProductCard>`.
- `components/product/ProductGallery.tsx`: add `handle: string` prop; wrap the first image's container div (`index === 0`) and the empty-state fallback div in the same `<ViewTransition name={getProductViewTransitionName(handle)} share="morph" default="none">` pattern.
- `components/product/ProductDetail.tsx`: pass `product.handle` to `<ProductGallery>`.
- `app/globals.css`: the morph CSS recipe (`::view-transition-group(.morph)`, `::view-transition-image-pair(.morph)`, `@keyframes esque-morph-blur`, `::view-transition { pointer-events: none; }`) plus the `::view-transition-old/new/group(*)` reduced-motion rule, folded into the existing `@media (prefers-reduced-motion: reduce)` block.

**Validate & commit.**

---

### Task 6: Interactive Model → PDP shared-element transition (D-034/D-035 resolution)

**Red**:
- `tests/e2e/homepage.spec.ts`: in the Shopify-unconfigured environment the Interactive Model renders its placeholder, not the real hotspot tree (already covered by an existing test) — add a build-time/typecheck-level check only (no live hotspot tree to click in this environment). Record explicitly in the PR/commit that live verification of the actual morph requires a configured store, same honest limitation as Task 5.
- If feasible, add a minimal test using the existing fixture-stub manual-verification technique this codebase already used for the Interactive Model (D-034's own precedent) is out of scope for an automated suite — note as a manual-verification item instead, consistent with the design spec's Testing section.

**Green**:
- `components/interactive-model/SilhouetteIllustration.tsx`: add `import { ViewTransition } from 'react'; import {} from 'react/experimental';`, wrap each hotspot `<button>` in `<ViewTransition name={getProductViewTransitionName(garment.product.handle)} share="morph" default="none">` unconditionally (both regions, always — see design spec's collision analysis for why this is safe here specifically).
- No change to `InteractiveModelExperience.tsx`'s click/hover/toggle logic — D-035's interaction model is preserved exactly.

**Validate & commit.** Record D-039 in this commit or the documentation task (see Task 9) — the interaction-model resolution is significant enough to record even before the final documentation pass; recording it here keeps the decision co-located with the code that implements it.

---

### Task 7: Reduced-motion audit

**Red/Green combined** (this task is primarily verification, not new production code):
- New `tests/e2e/reduced-motion-audit.spec.ts`: under `emulateMedia({ reducedMotion: 'reduce' })`, walk every animated surface and assert near-zero computed duration/no transform:
  - `FullScreenMenu` open/close transition (regression — mirrors existing coverage, confirm still passing).
  - Access-gate incorrect-password shift/message keyframes (regression).
  - Hero reveal (regression, already covered — confirm still passing).
  - Custom cursor never activates (Task 2's own test already covers this; cross-reference rather than duplicate).
  - Hero parallax custom properties stay zero (Task 3's own test already covers this; cross-reference rather than duplicate).
  - **New assertion**: a `::view-transition-group(*)`/`::view-transition-old(*)`/`::view-transition-new(*)` computed `animation-duration` is near-zero — the one gap this phase's own research surfaced (the sitewide universal-selector rule does not reach the browser's UA-generated view-transition pseudo-element tree). This can be asserted by triggering a same-page transition (e.g. via `document.startViewTransition` directly in `page.evaluate`, if supported by the test browser) or, more robustly given real navigation-triggered transitions are timing-sensitive in a test harness, by asserting the CSS rule itself is present and correctly scoped (reading the stylesheet rule's `animationDuration` value for the pseudo-element selector via `document.styleSheets` inspection, or simply asserting the source of `app/globals.css` contains the expected block — acceptable given the goal is confirming the *rule exists and targets the right selectors*, not re-testing the browser's own transition engine).
- If any existing surface is found to regress, fix it in this task and record the finding in D-042 (expected: none, given the pre-implementation audit in the design spec's Context section already confirmed every existing surface is correct).

**Validate & commit.**

---

### Task 8: Independent review

Dispatch a `ui-reviewer` subagent (background) with a scoped brief: review the Custom Cursor, Hero parallax, and Interactive Model shared-transition changes against DESIGN_SYSTEM.md §22-23/§27/§29-31, INTERACTIONS.md §7/§10/§12-14/§17, and this design spec — with explicit instructions to *reproduce* behavior live (dev server + browser), not just read code, mirroring D-037's precedent (which caught a real keyboard-accessibility defect that code-reading alone had missed). Scope: initialization-safety (cursor never hides the OS pointer prematurely), the four disable conditions, keyboard operability of everything the cursor/transitions touch (no regression to existing focus/keyboard behavior), and whether the parallax's magnitude matches "a few pixels" per DESIGN_SYSTEM §27 rather than something more aggressive.

Fix any genuine, confirmed defects; record findings (or their absence) in D-042 or a new entry, following D-037's own format (finding → fix → verification evidence).

**Validate & commit** (if fixes were needed).

---

### Task 9: Documentation

- `DECISIONS.md`: finalize D-038 through D-042 (some drafted inline in earlier tasks — consolidate/verify here).
- `ARCHITECTURE.md` §3: add `lib/motion/` to the repository structure tree with a one-line description.
- `ROADMAP.md` Phase 9: check off each completed line item honestly (cursor, shared-element transitions, parallax, reduced-motion audit) — narrate any partial/deferred aspect (e.g., "morph visual payoff pending a real store") in the line item text, matching this file's existing style (see Phase 7/8's own annotated checkboxes).
- `ROADMAP.md` Phase 8: update the D-034/D-035 reference lines to reflect D-039's resolution (click-vs-navigate is no longer an open deferral).

**Validate & commit.**

# Advanced Motion — Design Spec (ROADMAP.md Phase 9)

Status: Draft for implementation
Companion docs: [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) §22-23, §27-31, §69 · [INTERACTIONS.md](../../../INTERACTIONS.md) (all sections, especially §7, §8, §10, §12, §13, §14, §17-19) · [ARCHITECTURE.md](../../../ARCHITECTURE.md) · [DECISIONS.md](../../../DECISIONS.md) D-006, D-009, D-010, D-013, D-032, D-034, D-035, D-037

## Context

ROADMAP.md Phase 9 is the first phase whose entire remit is motion/interaction layered onto pages and components that already exist and already work without it (catalog grid, PDP, homepage, Interactive Model all shipped in Phases 4-8). Unlike prior phases, nothing here is blocked by missing Shopify data — the risk is scope creep and regression on working surfaces, not narrowing around a missing asset. Four checklist items:

1. Custom cursor (desktop-only, accessibility fallback) — DESIGN_SYSTEM §22-23, INTERACTIONS §7.
2. Shared-element product transitions, grid → PDP and interactive model → PDP — INTERACTIONS §10/§14, PROJECT.md §28/§69, deferred by D-013 "until a second real page exists" (many now exist).
3. Parallax/depth on homepage scenes — DESIGN_SYSTEM §27, deferred by D-032 specifically to this phase for Scene 01.
4. A reduced-motion audit across all of the above, plus everything animated so far (menu, entrance motion, hero, interactive model).

Item 2 also requires revisiting D-034/D-035's "click toggles the info panel, doesn't navigate" interactive-model decision, which was explicitly deferred pending this phase.

## Mechanism verification (done before any design decision below)

Per this project's Documentation and External Libraries discipline, the transition mechanism was verified against this exact installed toolchain, not assumed from memory:

- **Installed versions**: `react`/`react-dom` 19.2.8, `next` 16.3.1, `@types/react` 19.2.18, `motion` 13.1.1 (already installed per D-006).
- **`ViewTransition` is not in `@types/react`'s default `index.d.ts`** (grep confirms zero matches) — it lives only in `experimental.d.ts`/`canary.d.ts`. Per that file's own header, it activates for the whole program via a single `import {} from 'react/experimental'` (or a `"types"` array entry) anywhere in the project. A global tsconfig `"types"` array was considered and **rejected**: TypeScript's documented behavior is that setting `"types"` explicitly stops auto-including every other `@types/*` package (e.g. `@types/node`), which would silently break unrelated typechecking. The per-file side-effect import is scoped and carries no such risk.
- **Runtime**: Next.js 16.3.1 ships its own bundled docs at `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (the authoritative, version-exact source — more reliable here than a generic web search) which states plainly: *"View transitions work in the App Router with no configuration. The App Router uses React canary releases, which contain all stable React 19 changes as well as newer features like `ViewTransition`. You do not need to install `react@canary` yourself."* This is corroborated by `node_modules/next/dist/compiled/react-experimental/` existing as a real, shipped build Next.js's own bundler substitutes for App Router code. No `experimental.viewTransition` config flag exists in this version's `NextConfig` type or runtime config schema (confirmed by grep) — consistent with the bundled doc's "no configuration" claim. The `vercel-react-view-transitions` skill's mention of that flag is stale relative to this exact version; the version-pinned bundled doc is treated as authoritative per CLAUDE.md's "prefer official documentation... version-specific."
- **`transitionTypes` on `next/link`** is confirmed present (`node_modules/next/dist/client/link.d.ts:183`) — available if a later phase wants directional page-level slides, not used this pass (see Non-Goals).
- **Browser support**: Chromium 125+, Firefox 144+, Safari 18.2+ for the transition-types/class features this project's usage needs (per the bundled doc); unsupported browsers navigate normally with no animation — this satisfies INTERACTIONS §10's "must degrade gracefully and must never prevent navigation" as a platform guarantee, not something this project has to hand-build.
- **Conclusion**: React's `<ViewTransition>` (backed by the browser's native View Transitions API) is used for shared-element transitions, per D-006/ARCHITECTURE.md's motion stack ordering (View Transitions before Motion's layout animations, before GSAP). Zero new npm dependency. `motion` (already installed) is deliberately **not** used for the shared-element work, the custom cursor, or the new Hero parallax — see the per-feature reasoning below for why each is cheaper without it.

## Goals

1. A desktop-only custom cursor, disabled correctly for touch, reduced motion, low-performance devices, and form inputs, that never hides the OS cursor before it has genuinely initialized.
2. A real shared-element transition between the catalog grid and the PDP, and between the Interactive Model and the PDP, using React's `<ViewTransition>`.
3. Cursor-tracked parallax depth on the homepage Hero (Scene 01), picking up D-032's deferral.
4. A documented reduced-motion audit covering every animated surface in the codebase, old and new.
5. A resolution of D-034/D-035's deferred interactive-model click-vs-navigate question.

## Explicit Non-Goals (deferred or declined, with reasons)

- **Sitewide directional page-transition system** (type-keyed `nav-forward`/`nav-back` slides on every route, tagging every internal `<Link>`). The task names "shared-element product transitions," not a sitewide slide system — building the latter means auditing and instrumenting every navigation in the app (the `vercel-react-view-transitions` skill's own Step 3/4), a materially larger commitment than this phase asks for. `transitionTypes` is confirmed available (see above) for a future phase to pick up.
- **Parallax on homepage Scenes 02, 03, 04, 05, 06** — considered individually, declined per-scene:
  - Scene 02 (Interactive Model): no spec basis for ambient parallax here (Stage 4's masked-luminance highlight is a *different*, still-deferred technique — D-034 — not parallax), and pointer-tracked positional drift would actively work against precise hotspot targeting. A real usability cost, not just restraint.
  - Scene 03 (Collection Statement), Scene 06 (Drop Status): pure centered typography, no imagery layers to separate — DESIGN_SYSTEM §32's own parallax permission is conditioned on "editorial imagery," which these scenes don't have (D-032 already shipped them without photography for the same reason). Parallax on a single text block isn't depth, it's an arbitrary wobble.
  - Scene 04 (Selected Pieces): a functional product grid; DESIGN_SYSTEM never asks for parallax on product cards, and drifting a navigational product image under a customer's cursor is a usability regression, not a delight.
  - Scene 05 (Categories): DESIGN_SYSTEM §34 only specifies a discrete *hover* typography shift (a different, smaller concern already covered by general hover philosophy, §18) — not continuous cursor-tracked depth. No real category imagery exists yet to create depth against.
- **Masked-luminance highlight motion (Interactive Model Stage 4)** — still blocked on real photography (unchanged from D-034); this phase's remit is shared-element transitions and parallax, not un-deferring Stage 4.
- **Access Gate custom cursor** — the access route keeps its own existing, already-shipped, already-reduced-motion-correct `EntranceMotion` pointer treatment (PROJECT.md §13's "interactive cursor effects" requirement). Layering a second, generic follow-cursor on top of that one-time atmospheric sequence would compete with it visually on the site's single most important first impression. The custom cursor is scoped to the storefront shell (`ShellClient`) only.
- **`data-cursor` labels beyond `VIEW` (ProductCard) and `OPEN` (FullScreenMenu category links)** — these two are the only call sites DESIGN_SYSTEM explicitly names (§39, §25). `SHOP`/`DRAG`/`NEXT` remain supported by the component's generic, opt-in `data-cursor` API for a future call site that actually needs them; inventing a use now would be motion for its own sake.
- **WebGL/Three.js, GSAP** — nothing in this phase clears D-006/§61's "does this create meaningful Esque value" bar for either; every effect here is deliverable with native CSS/DOM APIs or the already-installed `motion`.

## New Architectural Decisions to Record

Recorded in full in DECISIONS.md as D-038 through D-042 once implemented; summarized here for the plan:

- D-038: React `<ViewTransition>` (native View Transitions API) is the mechanism for shared-element product transitions; the `react/experimental` type-activation approach and why; the container-div (not conditional image) wrapping strategy; the opt-in `enableSharedTransition` prop on `ProductCard` and why (a real, concrete naming collision between Selected Pieces and the Interactive Model, both independently resolvable to the same product on the homepage); the `::view-transition-*` reduced-motion CSS gap.
- D-039: Interactive Model click-vs-navigate resolution — hover-previews/click-toggles-panel is unchanged (D-035's accidental-click reasoning still holds); the panel's existing `VIEW PRODUCT` link now carries the shared-element transition. Supported by PROJECT.md §30's own two-step mobile pattern.
- D-040: Custom cursor architecture — four-condition disable logic, initialization-safety mechanism, no `motion` dependency, scoped to the storefront shell.
- D-041: Homepage parallax scoped to Scene 01 only; vanilla CSS-custom-property mechanism, no `motion` dependency (deliberately not repeating EntranceMotion's bundle-cost pattern on the homepage's critical route, per ROADMAP Phase 12's own flagged concern).
- D-042: Reduced-motion audit results.

## Architecture

### New directories/files

```
lib/
└── motion/                      # NEW — shared, framework-agnostic capability checks
    ├── media.ts                 # prefersReducedMotion / hasFinePointerAndHover / isLowPerformanceDevice
    └── media.test.ts
lib/product/
├── view-transition.ts           # NEW — getProductViewTransitionName(handle)
└── view-transition.test.ts
components/navigation/
└── CustomCursor.tsx             # NEW
components/home/
└── HeroParallax.tsx             # NEW — thin client wrapper
```

Matches ARCHITECTURE.md §3's existing forward-reference (`navigation/ # Header, full-screen menu, cursor`) — `cursor` was already anticipated there. `lib/motion/` is a genuinely new top-level `lib/` domain and will be added to ARCHITECTURE.md §3's tree in the documentation task.

### Why `lib/motion/media.ts` is pure/injectable

This project's vitest environment is `'node'`, with no jsdom (see `lib/product/variants.ts`'s header comment) — nothing that touches `window`/`navigator` directly is unit-testable as-is. Mirroring `lib/product/recently-viewed.ts`'s injected-`{getItem,setItem}` precedent for `localStorage`, each `matchMedia`-based check takes the matcher function as a parameter instead of reading `window.matchMedia` itself. `isLowPerformanceDevice` takes plain numbers (`navigator.hardwareConcurrency`, `navigator.deviceMemory`) so it needs no injection at all. Two real, concurrent consumers this same phase (`CustomCursor`, `HeroParallax`) justify extracting this now rather than duplicating the media-query strings in two places — not a speculative abstraction.

`isLowPerformanceDevice` is explicitly a best-effort heuristic, documented as such: `hardwareConcurrency <= 2` and `deviceMemory <= 2` (GB, Chromium-only) are conservative thresholds chosen so ordinary mid-range hardware (commonly 4+ cores) is never misclassified — a false negative (a weak device slipping through) is the accepted failure mode, not a false positive on ordinary hardware. This honesty-over-precision framing matches this codebase's existing pattern for unverifiable-without-real-data heuristics (D-023's productType-matching caveat, D-028's quantityAvailable-unknown caveat).

### Custom cursor (`components/navigation/CustomCursor.tsx`)

DESIGN_SYSTEM §22-23 / INTERACTIONS §7 requirements mapped directly to mechanism:

| Requirement | Mechanism |
|---|---|
| Desktop only | `hasFinePointerAndHover` — `(hover: hover) and (pointer: fine)`; a single check covers touch *and* hybrid/coarse pointers, no separate touch listener needed |
| Never hide OS cursor before init | `initialized` state flips `true` exactly once, only inside the first real `pointermove` handler call; the CSS class that sets `cursor: none` on `<html>` is only ever applied after that flip. Before that, nothing renders and nothing is hidden |
| Disable for reduced motion | `prefersReducedMotion` check gates the whole effect — the feature's entire value is inertia-following motion (INTERACTIONS §17 explicitly names "cursor inertia" as something reduced motion must disable); with no motion, a static dot adds cost with no value, so it's disabled outright rather than shown motionless |
| Disable for low-performance devices | `isLowPerformanceDevice` gates the whole effect (see above) |
| Disable over form inputs | Not a full disable — the dot's `opacity` drops to 0 and a scoped CSS override re-enables the native cursor (`input`, `textarea`, `select`, `[contenteditable]`) inside the `cursor:none` scope, so the text I-beam shows correctly. Detected via `event.target.closest(...)` on every pointermove, same delegated listener as the label logic below |
| Low lag | Position is written directly to the DOM (`ref.current.style.transform`) inside the native `pointermove` handler — never through React state, so there is no re-render on the hot path and zero synthetic interpolation/lag. DESIGN_SYSTEM §22: "If the cursor feels delayed, disable interpolation" — this implementation has none to disable |
| Expand + label over interactive imagery | A generic, opt-in `data-cursor="LABEL"` attribute API. A single delegated `pointermove` listener (not one per interactive element) calls `event.target.closest('[data-cursor]')`. Label/expanded-state changes only call `setState` when the computed value actually differs from a ref-tracked previous value — so state updates happen only on meaningful transitions (entering/leaving a labeled element or a form field), not on every pixel of movement (`rerender-use-ref-transient-values`) |

No `motion` import. The whole effect is `useRef` + two `useEffect`s + native DOM APIs — cheaper than `motion`'s spring/interpolation machinery for a feature whose own spec explicitly wants *zero* interpolation, and avoids growing the bundle on every storefront page (mounted once, in `ShellClient`).

`data-cursor="VIEW"` is added to `ProductCard`'s link (DESIGN_SYSTEM §39: "cursor becomes VIEW"). `data-cursor="OPEN"` is added to `FullScreenMenu`'s category links (DESIGN_SYSTEM §25: "custom cursor changes to OPEN").

### Homepage Hero parallax (`components/home/HeroParallax.tsx`)

`CollectionHero.tsx` is currently a Server Component (no `'use client'`) rendering three layers directly in a `<section>`: an absolutely-positioned background placeholder, an absolutely-positioned atmospheric `<h1>ESQUE</h1>`, and a `relative` foreground copy group. DESIGN_SYSTEM §27: "Subtle mouse movement creates depth between typography, model, and background. Movement should stay within a few pixels."

Mechanism: a thin client wrapper (`HeroParallax`) with `className="contents"` (Tailwind's `display:contents` — adds a script/ref hook with **zero** layout-box impact, so it cannot disturb the section's existing flex/absolute positioning relationships) wraps all three layers as `children`. Inside, a `window`-level `pointermove` listener (matching `EntranceMotion`'s own existing full-viewport tracking convention, not a per-element hover listener) writes two CSS custom properties (`--parallax-x`, `--parallax-y`, normalized to roughly `[-1, 1]`) directly onto the wrapper's own DOM node via `ref.current.style.setProperty(...)` — never through React state, so pointer movement causes zero re-renders. Each of the three server-rendered layers carries its own `--depth` value (0.3 / 0.6 / 1.0, mirroring `EntranceMotion`'s existing three-tier depth convention for visual consistency) and a shared `.esque-parallax-layer` CSS class that reads both custom properties via `calc()`.

Gated by the same `lib/motion/media.ts` checks as the cursor (`prefersReducedMotion`, `hasFinePointerAndHover` — DESIGN_SYSTEM §59/INTERACTIONS §16 both call for reducing pointer-dependent depth effects on mobile, and a touch device has no cursor to track anyway) — when either check fails, the effect never attaches and the custom properties stay at their CSS-default `0`, so layers render exactly where they do today. A CSS-level `@media (prefers-reduced-motion: reduce)` fallback additionally forces `transform: none` regardless, as defense in depth (matching this file's existing pattern of a JS-level check plus a CSS-level backstop).

**Why not `motion`, unlike `EntranceMotion`**: ROADMAP.md's own Phase 12 note already flags `EntranceMotion`'s ~119KB decoded JS as an unresolved cost on the `/access` route. Loading `motion` a second time on `/` — the site's most-trafficked, LCP-critical route — to reproduce an effect this simple (translate two or three layers a few px based on pointer position) would repeat that exact mistake on a more important route, which the task explicitly warns against doing "uncritically." `CollectionHero`'s own existing entrance fade (`.esque-hero-reveal`) already established the precedent of using plain CSS for this scene rather than a library (its own code comment: "ordinary page-load polish... needs no animation library") — the new parallax work extends that same, already-correct-for-this-scene pattern rather than introducing a second, heavier one. `EntranceMotion` is left untouched (its own animation needs — synchronized scale/opacity entrance plus parallax together — are more complex, and it's out of scope to refactor already-shipped, tested code for this task's audit-only mandate over prior work).

### Shared-element transitions (`lib/product/view-transition.ts` + `ProductCard`/`ProductGallery`/`SilhouetteIllustration`)

`getProductViewTransitionName(handle)` returns `esque-product-${sanitizedHandle}` — a single source of truth consumed by all three components so every pairing agrees byte-for-byte. Sanitization (anything outside `[a-zA-Z0-9-_]` → `-`) is a defensive measure: Shopify handle format isn't contractually guaranteed CSS-`<custom-ident>`-safe, and PROJECT.md §101 lists product data as still open.

**What gets wrapped, and why the container div rather than the `<Image>` directly**: `ProductCard`'s existing image container (`relative aspect-[4/5] ... bg-esque-surface`, currently home to a conditional primary image, conditional secondary hover-image, and conditional SOLD OUT badge) is wrapped whole, not just the `<Image>` inside it. Rationale: this container renders unconditionally regardless of whether a real photo exists yet (PROJECT.md §101 — no real photography exists today), so wrapping it (rather than the image element, which is conditionally absent) gives a real, honest, always-present shared-element target *today* — a plain color block growing from grid-cell size into PDP-hero size and position, a genuine "connect two interface states" cue (Interaction Rule #3) that needs no photography to be truthful, and will automatically look richer once real photography exists without any further code change. `ProductGallery` is symmetric: its first image's own container (and its own "no images" fallback `div`, which already exists) get the same treatment, gaining a new `handle: string` prop to build the name.

**Styling**: `share="morph"` + `default="none"` (per React's documented pattern — "add `default='none'`... when you add `default='none'` to a named pair, keep the explicit `share`"), with a CSS recipe adapted from Vercel's own documented pattern (blur-during-morph to hide pixel-interpolation artifacts, `::view-transition { pointer-events: none }` so mid-transition clicks aren't lost) but re-expressed in Esque's own tokens — Editorial-tier timing (DESIGN_SYSTEM §21: 500-800ms) and `--ease-esque`, not the demo's own arbitrary values. This is "reinforce Esque's identity" (Interaction Rule #4), not a cosmetic detail.

**The `enableSharedTransition` opt-in on `ProductCard` (default `false`)**: a concrete, non-speculative naming collision was found during design, not assumed away. The homepage renders both `SelectedPieces` (up to 3 products via `getSelectedPieces()`) and the Interactive Model (2 products via `getInteractiveModelLook()`) as two **independent** Shopify queries against the same 6-product Collection 001 catalog. Both can realistically resolve to the same product (e.g., Selected Pieces' unscoped "first N products" query and the Interactive Model's "first product of type Tops" query can trivially name the same hoodie). Per the `vercel-react-view-transitions` skill's own explicit warning, two simultaneously-mounted elements sharing one `name` is a real failure mode (browsers can abort a transition outright on a duplicate `view-transition-name`), not just a cosmetic risk. Rather than trying to guarantee two independent, unrelated Shopify queries can never overlap (fragile, data-dependent, and not really provable), `ProductCard` defaults the feature off; `ProductGrid` (the only other `ProductCard` consumer, used by category pages and PDP's own Related Products — both single-query, no-duplicate-handle, and never co-rendered with the Interactive Model) passes `enableSharedTransition` through unconditionally. `SelectedPieces` needs no code change at all — it simply doesn't opt in, and still navigates normally (no morph, full graceful degradation). This is exactly the "grid → PDP" journey the task names; Selected Pieces was never part of that scope.

**Honest limitation, not a defect**: this dev/CI environment has no configured Shopify store at all (confirmed via the existing `catalog.spec.ts`/`pdp.spec.ts` comments — every product/category route hits the generic error boundary). The shared-element pair can only form when the destination content is rendered in the same navigation commit (per React's own documented behavior); an unconfigured store means the PDP route currently never renders real content to pair against. The mechanism is real and correct regardless — this is the same "mechanism-now, honest-about-content" pattern D-012/D-030/D-032/D-034 already established — but its visual payoff is only fully realized once a real, reasonably fast-responding Shopify store exists. Recorded in D-038, not treated as a blocker to building the mechanism.

### Interactive Model → PDP (D-034/D-035 resolution)

**Decision**: hover-previews / click-toggles-the-panel is **unchanged** — D-035's reasoning (an easy-to-trigger-by-accident hard navigation on an invisible, irregularly-shaped hit region) is exactly as true today as when it was written; nothing about the placeholder illustration has changed. What changes: the panel's existing, already-real `VIEW PRODUCT` link (identical for desktop/keyboard/touch, per D-035) is now the shared-element transition trigger. Each hotspot `<button>` in `SilhouetteIllustration` itself carries `<ViewTransition name={getProductViewTransitionName(garment.product.handle)} share="morph" default="none">` — unconditionally, matching `ProductCard`'s own pattern, not conditionally on `activeRegion` (the two regions are always different products from different categories, so both can safely carry a name at all times with no collision between them; conditioning on `activeRegion` would add state-tracking complexity for no safety benefit).

This reading is directly supported, not just permitted, by PROJECT.md §30's own mobile interaction model: "tap a garment... product info appears... a **second action** opens the product or adds it to bag" — a two-step preview-then-commit flow was always the specified mobile pattern; desktop's hover-preview + click-to-panel + explicit `VIEW PRODUCT` is the same two-step shape. Wiring the shared transition onto the *second* action (navigation) rather than the *first* (hotspot activation) fulfills PROJECT.md §28's "selecting the garment transitions the visitor... via shared visual transition" without reopening the accidental-click risk D-035 was written to avoid.

## Component/File Changes Summary

| File | Change |
|---|---|
| `lib/motion/media.ts` (new) | `prefersReducedMotion`, `hasFinePointerAndHover`, `isLowPerformanceDevice` |
| `lib/product/view-transition.ts` (new) | `getProductViewTransitionName(handle)` |
| `components/navigation/CustomCursor.tsx` (new) | the cursor |
| `components/navigation/ShellClient.tsx` | mount `<CustomCursor />` |
| `components/catalog/ProductCard.tsx` | `data-cursor="VIEW"`; new `enableSharedTransition?: boolean` prop wrapping the image container in `<ViewTransition>` |
| `components/catalog/ProductGrid.tsx` | pass `enableSharedTransition` to every `ProductCard` |
| `components/navigation/FullScreenMenu.tsx` | `data-cursor="OPEN"` on category links |
| `components/product/ProductGallery.tsx` | new `handle: string` prop; wrap first image's container (and the empty-state fallback) in `<ViewTransition>` |
| `components/product/ProductDetail.tsx` | pass `product.handle` to `ProductGallery` |
| `components/interactive-model/SilhouetteIllustration.tsx` | wrap each hotspot `<button>` in `<ViewTransition>` |
| `components/home/HeroParallax.tsx` (new) | pointer-tracked CSS custom properties |
| `components/home/CollectionHero.tsx` | wrap the three layers in `<HeroParallax>`; add `.esque-parallax-layer` + `--depth` to each |
| `app/globals.css` | cursor CSS, parallax CSS, view-transition morph CSS, `::view-transition-*` reduced-motion rule |

## Accessibility

- Custom cursor: never removes the native cursor before a real pointer-move proves the replacement is live and positioned; form fields keep the native I-beam; entirely absent for touch, reduced motion, and (best-effort) low-performance devices — DESIGN_SYSTEM §23's exact four-item list, no more, no fewer.
- Shared-element transitions: purely visual — no change to focus order, accessible names, or keyboard operability of any wrapped element (`<ViewTransition>` introduces no DOM node of its own). Screen-reader users and reduced-motion users get the same successful navigation, just without the morph (or with an instant swap, per the reduced-motion CSS).
- Parallax: `aria-hidden`/decorative layers only (the background placeholder and the atmospheric wordmark are already `aria-hidden`/low-opacity-but-real per existing code); the foreground copy group's real, readable content is unaffected by the transform (it moves a few px, never its content, never focus order).
- Interactive Model resolution: no change to Stage 2/3's already-corrected keyboard behavior (D-037) — `VIEW PRODUCT` remains a real `<Link>`, reachable and operable exactly as before; the transition is an enhancement on top of already-working navigation, not a replacement for it.

## Responsive Behavior

- Custom cursor and Hero parallax are both gated off by the same `(hover: hover) and (pointer: fine)` check — neither appears on touch/tablet, satisfying DESIGN_SYSTEM §59/INTERACTIONS §16 without separate touch-specific code paths.
- Shared-element transitions are viewport-independent (View Transitions animate whatever layout exists at the time of navigation, mobile or desktop) — no separate mobile handling needed; already-established responsive image/grid behavior (Phases 4/5) is untouched.

## Error, Empty, and Degraded States

- No configured browser support for View Transitions → navigation proceeds normally with no animation (platform-guaranteed, not custom-built).
- No Shopify store / product fetch failure → existing error boundaries (`app/error.tsx`, `notFound()`) are completely unaffected; `<ViewTransition>` wraps presentation, not data-fetching.
- No real product images yet → the container-div wrapping strategy (not the `<Image>` itself) still provides an honest, functioning shared-element target (see above).
- Cursor/parallax capability checks return `false`/unsupported → both effects simply don't attach; no console errors, no layout shift, nothing rendered that needs to be un-rendered.

## Performance

- Bundle: zero new npm dependencies. Cursor and parallax are new, small, dependency-free client code (`useRef`/`useEffect`/native DOM APIs). `motion` remains scoped to `/access` only, unchanged from before this phase — verified after implementation by confirming no new source file imports `motion` and by comparing `.next` build output before/after.
- Runtime: cursor position and parallax offsets are written via direct `style` mutation on an already-referenced node, never through `setState` — no React re-render on the pointermove hot path for either feature (`rerender-use-ref-transient-values`).
- View Transitions: the browser's own compositor handles the animation; React's involvement is limited to snapshotting before/after DOM state around an already-happening navigation — no continuous JS work.

## Testing

This project has no jsdom/component-testing environment (vitest is Node-only) and Playwright drives real browsers, so the split follows the established precedent (D-034's own testing note; `lib/product/variants.ts`'s header comment):

- **Unit tests** (`lib/motion/media.test.ts`, `lib/product/view-transition.test.ts`): pure logic — exact media-query strings, boolean passthrough, threshold boundaries, handle sanitization. Fast, deterministic, no browser needed.
- **Playwright E2E**: behavioral, observable-in-a-real-browser assertions —
  - Cursor: does not activate under `emulateMedia({ reducedMotion: 'reduce' })`; does not activate when Playwright's mobile-safari/touch project is used (`hasTouch`); the `cursor:none` class is absent before any simulated pointer movement and present after one (initialization-safety, directly testable via `mouse.move`); the dot is hidden over an `<input>` (Request Access form, or any existing input) once available, or verified against a page known to have inputs.
  - Shared-element transitions: does not break navigation — clicking a `ProductCard`/hotspot/related-product still lands on the correct URL, exactly like the existing catalog/PDP specs already verify in this Shopify-unconfigured environment (the honest limit of what's E2E-verifiable without a live store, matching `catalog.spec.ts`/`pdp.spec.ts`'s own documented constraint) — plus a targeted check that the wrapped elements' rendered output is otherwise unchanged (SOLD OUT badge, hover crossfade, image content) so the feature is additive, not a regression.
  - Parallax: Hero's layers carry no transform offset under reduced motion or on a touch-emulated project; a desktop pointer move produces a non-zero `--parallax-x`/`--parallax-y` custom property on the wrapper.
  - Reduced-motion audit: a dedicated spec walking every known animated surface (menu, access-gate incorrect-password shift, hero reveal — regression-only, already covered by existing specs — plus the new cursor/parallax/view-transition surfaces) under `emulateMedia({ reducedMotion: 'reduce' })`.
- Manual-verification note (not automated): the *visual quality* of the morph (blur timing, whether it "feels" like Esque) is inherently subjective and best judged live; a written note in the design spec plus the independent `ui-reviewer` pass (mirroring D-037's precedent) covers this rather than a brittle pixel-diff test.

## Explicitly Open / Out of Scope for This Spec

- A full directional page-transition system (`nav-forward`/`nav-back`) — `transitionTypes` is confirmed available for a future phase.
- Stage 4/5 of the Interactive Model (masked-luminance highlight, visual refinement) — still blocked on real photography, per D-034, unchanged by this phase.
- Bundle-size regression budget/tooling (a proper bundle analyzer) — Next 16.3.1's Turbopack production build no longer prints the classic per-route "First Load JS" table this project's docs previously referenced; a coarse, honest before/after comparison is done manually this pass (see Performance), not a new permanent tool.

# Esque — Interactive Model (Signature Feature)

Status: Design spec, written for implementation planning.
Scope: ROADMAP.md Phase 8. Stages 1-3 (hotspots, product info panel, mobile tap behavior) built in full against a clearly-labeled placeholder illustration. Stage 4 (masked luminance motion) and Stage 5 (visual refinement) deferred — real photography/final art direction don't exist yet. Shop the Look panel + multi-item add flow built now, because it reuses the exact same real-data mechanism Stages 1-2 already establish, not a separate curation gap. This phase also retires Phase 7's Scene 02 placeholder-slot line, replacing it with the real feature.

## Context

Phases 0-7 are complete and on `main`. The homepage (`app/(storefront)/page.tsx`) currently renders `InteractiveModelPlaceholder` (Phase 7) as Scene 02 — a static "LOOK 01 / ESQUE PLACEHOLDER — MODEL, FULL BODY / ARRIVING SOON." slot, deliberately built with no interactivity because ROADMAP.md names the real feature as its own multi-stage phase (see DECISIONS.md D-032).

This phase's blocker shape mirrors Phase 7's Scene 01/04, not Phase 4/5's. Phase 4/5 were narrowed because Shopify *data* didn't exist to verify commerce mechanisms against — that gap is now closed for read-only product data (Phase 2 shipped a real, typed client; `getProduct`/`getProducts` are real, tested, reusable functions). What's still missing here is *creative* assets: DESIGN_SYSTEM.md §30 wants silhouette-shaped hit regions over a photographed model, and PROJECT.md §101 confirms photography style, model casting, and campaign direction remain open. That is not a reason to leave the mechanism unbuilt — D-012, D-027, D-030, and D-032 already establish this project's answer: build the real mechanism (hit-region shapes, keyboard/touch operability, real product data) against clearly-labeled placeholder content. This spec applies that exact precedent to Phase 8.

Separately, and independently of photography: no real Shopify store exists yet either (ROADMAP.md Phase 0's "Create Shopify development store" is still unchecked). Every `getProduct`/`getProducts` call in this codebase — including this feature's — throws today. This is the same environment every prior phase built and tested against; this spec follows the identical discipline (D-016, D-025, D-033): the mechanism is real and unit-tested against mocks, and gracefully, honestly degrades when Shopify has nothing to say.

Source of truth: PROJECT.md §26-30 (Interactive Model desktop/mobile/selection, Shop Entire Look), §39-41 (Quick Add's two-step "trigger reveals selector, selector's own CTA adds" shape), §66 (Interaction Rule), §93-94 (Design/UX North Star); DESIGN_SYSTEM.md §29-31 (Scene 02, Hotspots, Shop the Look — the specific sections this task named), §22-23 (Custom Cursor / Cursor Accessibility — checked for overlap, see Non-Goals), §65 (placeholder-asset convention), §69 (V1 signature features), §80 (build functionality before spectacular animation — this phase's own five-stage structure); INTERACTIONS.md §13 (Interactive Model motion/interaction consolidated reference); CONTENT.md §10 (CTA vocabulary — `VIEW PRODUCT`, `QUICK ADD`, `SHOP THE LOOK`, `ADD LOOK`, `ADD TO BAG`); ARCHITECTURE.md §3 (`components/interactive-model/` and the `lib/<domain>/` pairing pattern were already sketched as the target structure); DECISIONS.md D-006/D-013 (motion stack, cheapest-tier-first), D-010 (focus-ring color), D-023 (product-type query mechanism), D-027 (native semantics over hand-rolled ARIA), D-029 (real disabled-gated button, no-op onClick, until a cart exists), D-030 (Complete the Look's curation-data gap — the precedent this spec explicitly does *not* need to invoke for Shop the Look, see below), D-032/D-033 (per-scene scope discipline, graceful Shopify-failure isolation).

## Goals

- **Stage 1 — hotspots work.** Two silhouette-shaped hit regions (Top, Bottom — see Non-Goals for why not three) over a placeholder illustration. Each region is keyboard-operable (a real, native `<button>`, not a hand-rolled widget) and touch-operable, with a hit-region that matches its visible non-rectangular shape exactly, at every viewport size.
- **Stage 2 — product info panel works.** Each hotspot resolves to one real Shopify product (name, category, price, description, live colors/sizes with real availability). The panel renders `VIEW PRODUCT` (real navigation to `/products/[handle]`) and `QUICK ADD` (a real, disabled-until-complete button; no-op `onClick`, matching D-029's established precedent, since no cart exists yet — D-016).
- **Stage 3 — responsive/mobile tap behavior works.** No separate mobile gesture layer: the same activation model (hover **or** focus **or** click/tap all set the active region) works correctly with or without a pointer that supports hover, verified by real touch-sized targets and a mobile Playwright project that already exists (`mobile-safari`).
- **Shop the Look panel + multi-item add flow.** A native-`<dialog>` panel (mirrors D-027's `SizeGuidePanel` precedent) listing every garment currently on the illustration, each with an include/exclude checkbox and its own real variant selector, gated by a single `ADD LOOK` action that is disabled until every *included* item has a complete selection — PROJECT.md §29's literal requirement ("never add undefined variants automatically... all required selections resolved first").
- Stage 4 (masked luminance highlight motion) and Stage 5 (visual refinement) are explicitly named in ROADMAP.md and DESIGN_SYSTEM.md §80 as separate, later steps — not silently dropped, but deliberately deferred (see Non-Goals for why).

## Explicit Non-Goals (deferred, with reasons)

- **Stage 4 — masked luminance highlight motion.** DESIGN_SYSTEM.md §29 asks for a specific *photographic* treatment ("masked luminance/exposure treatment," explicitly not glow/outline) that only makes sense against a real photograph — a luminance mask over an abstract placeholder shape has nothing to mask. Stage 1-3's dim/highlight feedback is instead a plain CSS color/opacity transition (see Architecture) — real, functional, honestly simple, and automatically reduced-motion-safe via the sitewide rule already in `app/globals.css`. This mirrors D-032's exact reasoning for deferring Scene 01's cursor parallax and Scene 04's photography-dependent polish: the *mechanism* ships now, the *photography-dependent treatment* waits for photography.
- **Stage 5 — visual refinement.** DESIGN_SYSTEM.md §80 frames this as its own explicit final step after functionality (Stages 1-3) and motion (Stage 4) — by definition it presupposes both already exist and real assets to refine against. Nothing to refine yet beyond what Stage 1-3 already needs to look intentional-if-plain.
- **Cursor-driven parallax/depth, custom-cursor contextual labels (VIEW/SHOP/DRAG/OPEN), and the shared-element hotspot→PDP transition.** All three are explicitly, separately owned by ROADMAP.md Phase 9 ("Custom cursor," "Shared-element product transitions (grid → PDP, **interactive model → PDP**)," "Parallax / depth"). Building any of them here would risk contradicting Phase 9's own coordinated design, exactly the reasoning D-032 already used to defer Scene 01's parallax. Checked DESIGN_SYSTEM.md §22-23 directly per this task's own instruction: the custom cursor is Phase 9's; nothing here disables or interferes with it, and nothing here substitutes for it (hotspot discoverability instead comes from a real visible affordance — see Architecture).
- **A click on the hotspot navigating directly to the PDP.** PROJECT.md §28 describes this as a *shared visual transition* ("the visual area surrounding the hoodie enlarges... the model image transforms toward the product detail layout") — an animation this phase doesn't build (it's Phase 9's). Shipping a plain hard-navigate-on-click now would (a) be easy to trigger by accident while exploring an invisible-until-labeled hit region, and (b) need to be rewired the moment Phase 9 adds the real transition. Instead, click/Enter/Space toggles the info panel (open/pin, same as focus/hover); the panel's own explicit `VIEW PRODUCT` control is the one real navigation trigger, for both desktop and mobile alike. See D-035.
- **A third "Etc." hotspot region.** PROJECT.md §8's committed Collection 001 catalog is four Tops + two Bottoms — zero Hats/Jewelry products. Inventing a third region with nothing real to bind it to would be exactly the fabrication D-028/D-030/D-033 already refuse elsewhere. The mapping mechanism (see Architecture) generalizes to a third region trivially whenever a real Etc. product exists.
- **Collection-page placement.** PROJECT.md §26 lists "Collection pages" as a future home for this feature alongside the homepage. ROADMAP.md Phase 8 doesn't scope a collection page integration (collection pages themselves — `/collections/[handle]` — are unbuilt, per ARCHITECTURE.md §3). `components/interactive-model/` is deliberately not nested under `components/home/` for exactly this reason — it's placed at the top level per ARCHITECTURE.md §3's own already-sketched target structure, ready for a future collection page to import without relocation.
- **A running total price in Shop the Look.** DESIGN_SYSTEM.md §31's worked example shows an indexed list, per-item variant controls, and one final `ADD LOOK` CTA — no total. Adding one introduces a small new concern (currency summation) for an action that doesn't add anything to a real cart yet either way. Skipped as a deliberate, minor scope trim, not a blocker-driven deferral.
- **Analytics instrumentation.** PROJECT.md §82 names "garment hotspot selection, Shop the Look opens, Shop the Look purchases" as desired events, but ROADMAP.md Phase 12 ("Analytics wired") owns this, and `lib/analytics/` doesn't exist yet anywhere in this codebase (ARCHITECTURE.md §3 lists it among not-yet-built directories). Building instrumentation now would reach into Phase 12's territory with no existing infrastructure to hook into.
- **Live-store verification of anything.** Identical constraint to every prior phase — see Testing.

## New Architectural Decisions to Record

- **D-034**: Phase 8's per-stage scope (Stage 1-3 + Shop the Look built now; Stage 4-5 deferred pending real photography) and the hotspot-to-product data mapping mechanism: each of the two regions (Top, Bottom) binds to one representative real product via the *existing* product-type query mechanism (D-023), not curated per-photo "look" membership. Both regions must resolve or the whole section falls back to the existing placeholder (extends D-033's graceful-degradation precedent to a second homepage Shopify dependency). Also records why Shop the Look does *not* need a D-030-style curation-data deferral: it lists exactly the same per-region resolved set hotspots already establish, mechanically, not a fabricated outfit pairing.
- **D-035**: The accessibility/interaction mechanism — real `<button>` elements with percentage-based `clip-path: polygon()` for silhouette-shaped, native-semantics hit regions (and why this was chosen over an SVG-path-as-ARIA-button and over an ARIA tablist); click/Enter/Space toggles the info panel rather than navigating to the PDP (defers PROJECT.md §28's shared-transition click-to-navigate to Phase 9); `VIEW PRODUCT` as the one real navigation trigger for every input mode; and the always-visible `SHOP THE LOOK` entry point as the deliberate, real, non-visual-dependent alternative to a purely visual silhouette map (the specific accessibility risk this task named).
- **D-036**: `VariantPicker` extracted from `ProductPurchasePanel` (Phase 5) into `components/product/VariantPicker.tsx`, now used by three call sites (PDP, the Interactive Model info panel, Shop the Look's per-item rows) instead of a third hand-rolled copy of D-027's accessibility-load-bearing radio-group markup. Records the `namePrefix` fix this reuse required (see Architecture) — a real bug the single-consumer PDP usage never surfaced.

## Architecture

### New domain directories

Per ARCHITECTURE.md §3's already-sketched (but until now unbuilt) target structure, this feature is **not** nested under `components/home/`/`lib/home/`: PROJECT.md §26 places it on both the homepage and future collection pages, so it gets its own top-level domain, matching the existing `catalog/`/`product/`/`home/` pairing pattern:

```
components/interactive-model/
  InteractiveModelPlaceholder.tsx   (moved from components/home/, content unchanged)
  InteractiveModel.tsx              (Server Component — decides real vs. placeholder)
  InteractiveModelExperience.tsx    ('use client' — state orchestration + info panel)
  SilhouetteIllustration.tsx        (hotspot buttons over the placeholder illustration)
  ShopTheLookPanel.tsx              ('use client' — native <dialog>, multi-item add)

lib/interactive-model/
  look.ts                           (Shopify-backed: getInteractiveModelLook)
  look-selection.ts                 (pure: isLookAddValid)
```

`components/home/InteractiveModelPlaceholder.tsx` is relocated, not duplicated — Phase 8 takes ownership of Scene 02 in full, and the placeholder it already built becomes this feature's own honest fallback state rather than a second, competing copy.

### Data model & fetch (`lib/interactive-model/look.ts`)

```typescript
import { getProduct, getProducts, type ProductDetail } from '@/lib/shopify/products';
import { buildProductSearchQuery } from '@/lib/catalog/filters';
import { getCategoryProductTypes, type CategorySlug } from '@/lib/catalog/taxonomy';

export type HotspotRegion = 'top' | 'bottom';

export interface InteractiveModelGarment {
  region: HotspotRegion;
  regionLabel: string;
  product: ProductDetail;
}

interface RegionConfig {
  region: HotspotRegion;
  regionLabel: string;
  category: CategorySlug;
}

export const HOTSPOT_REGIONS: readonly RegionConfig[] = [
  { region: 'top', regionLabel: 'Top', category: 'tops' },
  { region: 'bottom', regionLabel: 'Bottom', category: 'bottoms' },
];

export async function getInteractiveModelLook(): Promise<InteractiveModelGarment[]>;
```

Each region resolves independently: `getProducts({ query: buildProductSearchQuery({ productTypes: getCategoryProductTypes(category) }), first: 1 })` picks one representative product of that garment category (the *same* mechanism category pages already use — D-023 — and Related Products already reused — D-030), then `getProduct(handle)` fetches the full detail (options, variants, description, images) the info panel needs. Both regions are resolved concurrently via `Promise.all` (they're fully independent — no reason to serialize them; per this project's own performance discipline, ARCHITECTURE.md §9/CLAUDE.md's async-waterfall guidance). If a region's query returns no product, that region is simply omitted from the result (not an error). The whole call is wrapped in one try/catch mirroring `getSelectedPieces`'s exact precedent (D-033): a thrown error (unconfigured store, throttled request) is logged via `console.error` and resolved to `[]`, never propagated.

**Both-or-placeholder threshold.** `InteractiveModel.tsx` renders the real experience only when `garments.length === HOTSPOT_REGIONS.length` (currently 2). A partial result (one region resolved, one didn't) falls back to the same honest placeholder as a total failure — a figure with only one garment drawn reads as broken, not intentional, and this threshold self-extends if a third region is ever added. This is a direct extension of D-033's graceful-degradation precedent to this feature's own Shopify dependency.

**Shop the Look needs no separate curation data.** Its item list is exactly `garments` — the same resolved set hotspots already show. Unlike D-030's "Complete the Look" (which needs a real merchandiser's specific outfit-pairing decision with no metafield representation yet), nothing here is presented as "a curated outfit" — it's "the garments currently on this illustration," which is an honest, mechanically-derived description of what the feature actually does. This is why Shop the Look does not need its own D-030-style deferral entry.

### Pure selection logic (`lib/interactive-model/look-selection.ts`)

```typescript
import { isSelectionComplete, type OptionSelections } from '@/lib/product/variants';
import type { ProductOption } from '@/lib/shopify/products';

export interface LookItemSelectionState {
  included: boolean;
  options: ProductOption[];
  selections: OptionSelections;
}

export function isLookAddValid(items: LookItemSelectionState[]): boolean;
// true iff at least one item is `included`, and every included item's
// selection is complete (reuses the existing isSelectionComplete —
// PROJECT.md §29: never add an undefined variant; all required selections
// resolved first).
```

This is the one piece of Phase 8's interaction logic substantial and spec-critical enough to warrant its own pure, unit-tested function, mirroring `lib/product/variants.ts`'s existing precedent exactly. Toggling which region is "active" (see below) is a one-line ternary with no separable logic worth extracting — kept inline in the component, consistent with this project's practice of not extracting logic that has nothing non-trivial to test.

### Why this project has no jsdom/React Testing Library changes what "pure logic" needs to cover

`vitest.config.ts`'s `include: ['**/*.test.ts']` (not `.tsx`) and no React Testing Library dependency mean component *rendering* is never unit-tested anywhere in this codebase — confirmed directly, not assumed. Every prior phase's real behavioral coverage lives in extracted `.ts` logic (`lib/product/variants.ts`, `lib/catalog/filters.ts`, `lib/home/selected-pieces.ts`) plus Playwright E2E for what's reachable without a live store. This phase follows the identical discipline: `look.ts` and `look-selection.ts` carry real, thorough unit coverage; the React components are thin glue verified by typecheck/build plus the E2E coverage described in Testing.

### Shared component extraction (`components/product/VariantPicker.tsx`)

Extracted verbatim from `ProductPurchasePanel.tsx`'s existing fieldset-per-option block (D-027's native-radio-group pattern: `sr-only peer` input + a sibling `<label>` styled via `peer-checked`/`peer-disabled`/`peer-focus-visible`) — no behavior change, no styling change.

```typescript
interface VariantPickerProps {
  // Unique per rendered instance (e.g. the garment's Shopify handle). Two
  // VariantPickers can now be mounted simultaneously (Shop the Look's two
  // item rows) — without this, both products' "Size" option would render
  // <input name="Size">, and native radio-group scoping is by `name`
  // value document-wide (absent a <form> boundary), so selecting a size on
  // one garment would silently un-check the other garment's same-named
  // radio group. The PDP's own single-instance usage never surfaced this
  // because only one VariantPicker is ever mounted there at once. See
  // DECISIONS.md D-036.
  namePrefix: string;
  options: ProductOption[];
  variants: ProductVariant[];
  selections: OptionSelections;
  onChange: (optionName: string, value: string) => void;
}
```

`ProductPurchasePanel.tsx` is updated to render `<VariantPicker namePrefix={handle-or-title} ... />` in place of its inline block, and to import `formatPrice` from its new home (see next) instead of defining it locally. No other change to `ProductPurchasePanel`'s behavior, markup, or styling.

### Shared price formatting (`lib/product/price.ts`)

`ProductPurchasePanel`'s private `formatPrice` helper (`Intl.NumberFormat('en-US', { style: 'currency', currency })`) is extracted to `lib/product/price.ts` and reused by the Interactive Model's info panel and Shop the Look's per-item rows — three call sites, one definition, identical logic. Parameter stays the existing inline `{ amount: string; currencyCode: string }` shape (no new named type — this codebase has never introduced one for this shape, e.g. `ProductDetail.minPrice`, `ProductVariant.price` are both this same inline shape already).

### Component breakdown

- **`InteractiveModel.tsx`** (Server Component, no `'use client'`). Receives `garments: InteractiveModelGarment[]` (already fetched by `page.tsx`, mirroring `SelectedPieces`'s exact "page awaits, component decides" pattern). Renders `<InteractiveModelPlaceholder />` when `garments.length < HOTSPOT_REGIONS.length`, otherwise `<InteractiveModelExperience garments={garments} />`. This is the only file that imports both branches; each branch independently owns its own `<section aria-label="Interactive Model">` landmark (a small, deliberate duplication of one string constant across two files, not of any interactive logic — cheaper and clearer than threading a shared wrapper through both).

- **`InteractiveModelExperience.tsx`** (`'use client'`). Owns the real state:
  - `activeRegion: HotspotRegion | null` (`useState`, initial `null` — nothing previewed at rest).
  - `selectionsByRegion: Record<HotspotRegion, OptionSelections>` (`useState`, lazily initialized via `getInitialSelections` per garment — reused, not reimplemented).
  - `shopTheLookOpen: boolean` (`useState`).

  Renders, in order: an `sr-only` `<h2>Interactive Model</h2>` (redundant with the section's own `aria-label`, matching the established, deliberate `ProductDetail`/`RecentlyViewed` redundancy pattern per the homepage spec's own accessibility rule); the visible `LOOK 01` label (unchanged copy from the placeholder); `<SilhouetteIllustration>`; a reserved-height info panel (renders a neutral prompt when `activeRegion` is `null`, otherwise the active garment's name/category/price/description/`VariantPicker`/`VIEW PRODUCT`/`QUICK ADD` — reusing `findMatchingVariant`, `isSelectionComplete`, `isProductSoldOut`, `getScarcityStatus`/`getScarcityLabel`, all as-is); a `SHOP THE LOOK` trigger (always visible, not gated behind any hotspot interaction — see Accessibility); and `<ShopTheLookPanel>`.

  Activation rule (same for every input mode, deliberately unified rather than branching on hover-capable vs. touch — see D-035): `onMouseEnter` **and** `onFocus` both set `activeRegion` to that button's region (hover previews for a mouse, focus previews for a keyboard user — parity, not two different mechanisms); `onClick` (which also fires for Enter/Space on a native `<button>` and for a touch tap, with no extra wiring) **toggles** it (same region again → `null`). There is deliberately no `onMouseLeave`/`onBlur` handler: the panel never auto-closes when the pointer or focus leaves the hotspot, so moving the mouse from the hotspot *toward the panel's own controls* (to actually pick a size/color) never races the panel closing before you get there — a real bug this design avoids structurally rather than timing around. This also means the last-activated garment stays shown until a different hotspot is hovered/focused or the same one is clicked again, which incidentally satisfies WCAG 1.4.13 (Content on Hover or Focus)'s persistence and dismissibility requirements as a side effect of the simplest correct design, not a bolted-on fix.

- **`SilhouetteIllustration.tsx`** (no `'use client'` of its own — it has no hooks; it's always rendered from within an already-`'use client'` tree, so it needs no directive per Next.js's actual client/server boundary rules, verified against how a directive only marks the *boundary* file). Renders a `position: relative` box (`aspect-4/5`, matching the existing placeholder's proportions) with the `ESQUE PLACEHOLDER — MODEL, FULL BODY` label (DESIGN_SYSTEM.md §65's own literal wording, reused verbatim) in the same small, muted styling this project already uses for placeholder captions (`SizeGuidePanel`'s "ESQUE PLACEHOLDER — MEASUREMENTS" precedent — not at display scale). Two real `<button>` elements are absolutely positioned over it, each `clip-path: polygon(...)` in **percentage** units (not px, and not an SVG `<path>`/CSS `clip-path: path()` combination — see D-035 for why: percentage-based `clip-path` resolves against the element's own box at every reflow, so the hit-region and the visible shape can never drift apart at any viewport width, whereas a fixed-px `clip-path: path()` or a separately-scaled SVG coordinate system would need JS/`ResizeObserver` to stay aligned on resize). Each button's fill color reflects state (neutral / dimmed to ≈25% opacity when a *different* region is active, per DESIGN_SYSTEM.md §29's "35-50% visual emphasis" reduction / highlighted when active) via plain Tailwind `transition-colors duration-200 ease-esque` — automatically covered by the sitewide reduced-motion rule, no bespoke handling needed. `aria-label` names the garment (`"Top — Hoodie 01"`); `aria-pressed` reflects whether this region is the active one (a real toggle button, both semantically and behaviorally).

- **`ShopTheLookPanel.tsx`** (`'use client'`). A native `<dialog>` (D-027's established `SizeGuidePanel` pattern exactly: `showModal()`/`close()` via a `useEffect` keyed on an `open` prop, side panel at `md`+ / bottom sheet below it, no bespoke focus-trap code needed) listing every garment in `garments` with: an index (`01 —`, `02 —`), a checkbox (`accent-esque-forest`, reusing D-024's exact established accent-color-on-a-native-control precedent) defaulting to checked, the garment's name/price, and — only while checked — its own `<VariantPicker namePrefix={garment.region} ... />`. Bottom CTA: `ADD LOOK`, disabled via `isLookAddValid`, `onClick={() => {}}` (D-029's precedent — no cart exists). Internal per-item selection state is separate from `InteractiveModelExperience`'s hover-preview state — they're genuinely independent concerns (what you're previewing vs. what you're about to add), not artificially split.

### Accessibility

This is the specific risk this task named explicitly, so it gets its own resolution, not an afterthought:

1. **Hotspots are real, native `<button>` elements** — full keyboard support (Tab reaches them in document order, Enter/Space activates them) for free, no hand-rolled `role`/`tabIndex`/`keydown` code, consistent with D-027's "prefer native semantics" ruling. `aria-pressed` gives assistive tech an explicit, correct on/off state. Focus is visible via the project's standard `--color-esque-text` ring (D-010) — drawn around the button's box (a minor, accepted cosmetic limitation: the ring outlines the bounding box, not the clipped silhouette shape itself, exactly like Stage 5's "visual refinement" territory, not a functional gap).
2. **The non-visual alternative to the silhouette map is real, not a hidden decoy list.** Rather than adding a second, redundant `sr-only` text list that could quietly drift out of sync with the real hotspots, the always-visible `SHOP THE LOOK` control **is** the accessible, non-spatial way to reach every garment: it's reachable by keyboard/screen reader independent of ever touching the illustration, and it exposes the identical real controls (name, price, variant selection) each hotspot's panel does. This is a deliberate design choice (D-035), not an omission — it makes the "screen-reader equivalent" load-bearing and real rather than a parallel, easily-neglected structure.
3. **Heading structure**: `sr-only <h2>Interactive Model</h2>` (matching the section's `aria-label`, mirroring `ProductDetail`/`RecentlyViewed`'s established redundant-labeling pattern) once in the real branch; the placeholder branch keeps its existing `<h2>ARRIVING SOON.</h2>` unchanged. The active garment's name inside the info panel is an `<h3>`, correctly nested one level under the scene's `<h2>`.
4. **Touch targets**: each hotspot button's *bounding box* (before `clip-path`) is sized generously (≥19% of the illustration's width/height at the breakpoints this renders at, comfortably exceeding a 44×44px touch target on any realistic mobile viewport width ≥320px) even though the *visible/clickable* clipped area is smaller and irregular — the bounding box, not the visible shape, is what determines whether a touch lands inside vs. outside the clip-path (clip-path affects hit-testing within the box, but the box itself must still be reachable; sized generously here so touch imprecision near a garment's edge still registers).
5. **Reduced motion**: every transition this phase adds (`SilhouetteIllustration`'s dim/highlight color transition) uses the same `transition-*` Tailwind utilities already covered by the sitewide `@media (prefers-reduced-motion: reduce)` rule in `app/globals.css` — no new JS-driven motion (`motion/react`) is introduced anywhere in this phase, so no bespoke `useReducedMotion()` handling is needed (unlike `EntranceMotion.tsx`'s JS-driven parallax, which does need it). `ShopTheLookPanel`'s native `<dialog>` open/close is instant, matching `SizeGuidePanel`'s existing precedent (no CSS transition to begin with).
6. **Forms/labels**: every control has a real accessible name — hotspot buttons via `aria-label`, the Shop the Look checkbox via `aria-label={"Include " + title}`, every radio via `VariantPicker`'s existing `<label htmlFor>` (unchanged from D-027).

### Responsive behavior

Per DESIGN_SYSTEM.md §60 ("do not simply scale desktop compositions down"): the illustration-then-panel vertical relationship stays constant at every breakpoint (deliberately not a side-by-side desktop layout — a floating panel anchored to each hotspot's specific screen position has real viewport-edge-collision complexity that Stage 5 ["visual refinement"], not Stage 1-3, is the right place to take on). What *does* change at `md` and up is the info panel's own internal arrangement: text info (name/category/price/description) stacks above the variant picker and action buttons below `md`, and sits beside them at `md`+ — a genuine compositional change, not a uniform scale-down. `SilhouetteIllustration`'s hit regions are percentage-based by construction, so they need no separate mobile/desktop coordinate sets at all — the same shapes are correct at every width. `ShopTheLookPanel` reuses `SizeGuidePanel`'s exact existing responsive treatment (bottom sheet below `md`, side panel at `md`+) — proven, not reinvented.

## Error, Not-Found, and Empty States

- **Shopify unconfigured/unreachable, or a region resolves to no product**: `getInteractiveModelLook()` catches and logs (mirrors D-033 exactly), or naturally omits the unresolved region. `InteractiveModel.tsx`'s both-or-placeholder gate renders the existing, honest `InteractiveModelPlaceholder` — never a partially-broken interactive tree, never a silent one-garment version.
- **A garment is sold out** (`isProductSoldOut`): the info panel and the Shop the Look row both reuse the exact same logic the PDP already uses — the variant picker is replaced by the existing `NO LONGER AVAILABLE.` treatment (PROJECT.md §87/CONTENT.md §6), and that item can't be included in a valid `ADD LOOK` (its own selection can never complete).
- **No garment is currently active** (initial state, or after toggling one off): the info panel shows a plain, muted prompt (reserved at a fixed `min-height` so its appearance/disappearance never reflows the rest of the page) rather than collapsing to nothing, so the panel's presence is always legible as "this is where details go."

## Testing

No live Shopify store exists — identical constraint to every prior phase, stated plainly rather than worked around:

- **Unit (Vitest), fixture-driven**:
  - `lib/interactive-model/look.test.ts` — mocks `@/lib/shopify/products`' `getProducts`/`getProduct` (same `vi.spyOn` technique as `lib/home/selected-pieces.test.ts`/`lib/shopify/products.test.ts`): both regions resolve → both garments returned; one region's `getProducts` resolves empty → only the other garment returned (proves the both-or-placeholder gate has real data to gate on); a thrown error from either call → `[]`, logged via `console.error` (asserted, mirroring `selected-pieces.test.ts`'s exact assertion style); confirms the two regions are fetched concurrently, not serially (asserting call order/timing is brittle — instead, asserting `getProducts` is called exactly twice with the two distinct product-type queries is sufficient proof of the *shape* without over-specifying scheduling).
  - `lib/interactive-model/look-selection.test.ts` — `isLookAddValid`: all included + complete → `true`; one included item incomplete → `false`; that same item then excluded (unchecked) → `true` again; nothing included → `false`; empty list → `false`.
  - `lib/product/price.test.ts` — `formatPrice`: a whole-dollar amount and a fractional amount both format to the correct two-decimal USD string.
- **E2E (Playwright)**, everything genuinely reachable without a store:
  - `tests/e2e/homepage.spec.ts`'s existing "the interactive model placeholder is present and honestly labeled" test must continue to pass **unchanged** — this is the regression proof that relocating `InteractiveModelPlaceholder` and wrapping it behind `InteractiveModel`'s conditional didn't alter its rendered output at all.
  - New assertion (same file): with Shopify unconfigured, `SHOP THE LOOK` is **not** present anywhere on the page — proving the real client tree (and its bundle) genuinely isn't mounted in the fallback branch, not just visually absent.
  - New assertion: the existing "loads without console errors" test continues to pass — this would catch a hydration mismatch or a runtime error from the new client component tree, even though that tree only mounts in the fallback branch in this environment.
  - **Not reachable this pass without a store** (stated explicitly, not glossed over): hotspot hover/click/keyboard activation, the info panel's live content, Shop the Look's checkbox/variant-selection/`ADD LOOK` gating, and the dim/highlight reduced-motion transition can only render once `getInteractiveModelLook()` returns two real garments — which requires a configured Shopify store this environment doesn't have. This is not a gap specific to this feature; it's the same limit `pdp.spec.ts`/`catalog.spec.ts` already document for their own Shopify-dependent behavior. Confidence in the interactive mechanism instead comes from: the pure logic's real unit coverage above (`look-selection.ts` covers the one genuinely spec-critical rule exhaustively), the fact that `VariantPicker`/`findMatchingVariant`/`isSelectionComplete`/scarcity logic are *already* real, tested, and merely being reused (not reimplemented) here, and a one-time manual verification during implementation (temporarily stubbing `getInteractiveModelLook` to return fixture data, exercising the real component tree in a dev server by hand, then reverting the stub before committing — not a committed test, since it isn't repeatable, but real evidence gathered before claiming the feature works, consistent with this project's "don't claim untested things pass" discipline).
  - `components/interactive-model/*` get no dedicated component test files — matches every prior phase's precedent (no jsdom/RTL; `vitest.config.ts` only collects `.test.ts`).

## Explicitly Open / Out of Scope for This Spec

- Whether `getCategoryProductTypes('tops')`'s OR'd product-type query actually prefers a specific subcategory (e.g. Hoodies over T-Shirts) when a real store has both — unresolved and low-stakes: the query takes the *first* result Shopify's default ordering returns, same "featured has no true curation" honesty D-023 already recorded for category pages. Revisit once a real store exists and this is worth curating.
- Whether the two hotspot regions' exact pixel shapes read well against real photography once it exists — by construction (percentage-based `clip-path`), the *mechanism* transfers unchanged; the specific coordinates are Stage 5's to redraw against a real photograph's real garment boundaries.
- A collection-page integration of this feature (PROJECT.md §26) — not scoped by ROADMAP.md Phase 8, and `/collections/[handle]` doesn't exist yet.
- Whether `InteractiveModelExperience`'s client bundle size is acceptable — no dependency is added (no `motion/react` usage in Stage 1-3), so the addition is plain React + Tailwind classes; a precise before/after route-size comparison is checked at implementation/validation time (`pnpm build`'s route output) rather than pre-judged here.

# Esque — Quick Add (desktop overlay + mobile bottom sheet)

Resolves ROADMAP.md Phase 5's partial line: "Quick Add (desktop overlay + mobile bottom sheet) — the underlying variant-selection mechanism is built in full (above) and directly reusable; the on-grid entry point itself is deferred (needs new on-demand data-fetching plumbing with no other consumer yet) — see DECISIONS.md D-029."

## Context

D-029 deferred Quick Add's on-grid entry point for one concrete reason: `ProductCard` only ever fetches `ProductListItem` (deliberately lean — no `options`/`variants`, per D-023), so opening a variant selector from the grid needs genuinely new on-demand data-fetching plumbing — a Server Action or a Route Handler, plus client-side fetch/loading/error handling — that had no other consumer at the time. D-058 (Search) just built exactly that kind of plumbing for a different purpose (`app/api/search/route.ts`, this codebase's first Route Handler). That precedent is directly reusable here: a second, simpler Route Handler that calls the already-real, already-Demo-Mode-aware `getProduct(handle)` on demand.

Everything else Quick Add needs already exists and is real: `VariantPicker` (D-036, extracted "for a third call site" — this is that third call site), `lib/product/variants.ts`'s selection/availability/sold-out logic, `lib/product/scarcity.ts`, the native-`<dialog>` side-panel/bottom-sheet mechanism (`SizeGuidePanel.tsx`, D-027), and the established disabled-until-complete/no-op-onClick stub pattern for a purchase action with no cart behind it (D-016/D-029, `ProductPurchasePanel`/`InteractiveModelExperience`).

## Goals

- A real `QUICK ADD` trigger on `ProductCard`, discoverable on both desktop (hover/focus-reveal) and mobile (always visible) per PROJECT.md §74's "no interaction should depend solely on hover."
- A real, on-demand fetch of the full product detail (options, variants, scarcity-relevant fields) when Quick Add opens — never prefetched, never bundled into the grid's own list query.
- A real desktop overlay and mobile bottom sheet, reusing `SizeGuidePanel`'s native-`<dialog>` mechanism rather than a second hand-rolled implementation.
- Real `VariantPicker` reuse: real color/size selection, real per-value availability gating, real "single color may already be selected" / "size must never be guessed" behavior (PROJECT.md §39) — for free, via `getInitialSelections`, with zero new selection logic.
- Real loading/error/sold-out states, matching this codebase's established copy (CONTENT.md) and patterns (D-033/D-058's error-boundary scoping).
- Real analytics for Quick Add usage (PROJECT.md §82), reusing/extending the existing taxonomy (D-055) rather than inventing a parallel one.
- A real, disabled-until-complete `ADD TO BAG` button whose click is a deliberate no-op — matching D-016/D-029's precedent exactly, not a new stub shape.

## Explicit Non-Goals (deferred, or out of scope, with reasons)

- **A real cart mutation.** No cart exists (D-016). `ADD TO BAG` inside Quick Add is exactly as stubbed as the PDP's and Interactive Model's own `ADD TO BAG`/`QUICK ADD` buttons.
- **Quantity selection.** DESIGN_SYSTEM.md §40's literal example (`HOODIE 01 / COLOR / BLACK FOREST / SIZE / S M L XL / ADD TO BAG`) has no quantity row, unlike the PDP's own panel. PROJECT.md §39 says "Quantity if appropriate" — for a deliberately fast, lightweight, skip-the-PDP flow, it is not appropriate: it adds a control with no real consumer (no cart to apply it to) and contradicts the literal example this task explicitly asks to match. Quantity selection remains a PDP-only affordance.
- **Price and scarcity labels inside the panel.** Also absent from §40's literal example, and DESIGN_SYSTEM §33/§37 establish prices are hidden by default and only appear on deeper "product interaction" — the PDP and Interactive Model panels already show price/scarcity (a deliberate, deeper interaction); Quick Add is deliberately the fast, minimal path and shows only what §40 lists: name, COLOR, SIZE, ADD TO BAG. A sold-out product still needs *some* state beyond that — see States below.
- **A trigger positioned/anchored to the exact card that opened it (a true popover).** DESIGN_SYSTEM §40 says "connected to the product card," which this reads as *contextually* connected (opens and closes in direct response to that card's own trigger, over a centered lightweight overlay) rather than *pixel-anchored* to it. A real anchored popover needs position-tracking JS (resize/scroll listeners, collision detection) with no established precedent anywhere in this codebase and meaningfully more risk than this feature's value justifies. Considered and rejected — see New Architectural Decisions to Record.
- **A new opt-in prop to scope Quick Add to only category pages.** Considered (mirroring `enableSharedTransition`/`priorityFirstImage`'s established opt-in-prop shape) and rejected — see New Architectural Decisions to Record. Quick Add ships as unconditional `ProductCard` behavior, like the hover crossfade and the `SOLD OUT` badge already are.
- **Any change to the PDP or Interactive Model's own purchase UI.** They already have full panels for their own featured product/garment (D-027, D-034/D-036) and don't need a redundant entry point.

## Architecture

### Trigger: `ProductCard`, unconditional, no new prop

`ProductCard` currently wraps its entire visible content (image + title) in one `<Link>`. A `QUICK ADD` `<button>` cannot be nested inside that `<a>` (invalid HTML; a click would also fire the outer navigation). The fix is structural, not cosmetic: wrap the existing, unmodified `<Link>` in a new outer `<div className="group flex flex-col gap-3">` (moving `group` off the Link, since Tailwind's `group-hover`/`group-focus-within` need to react to the whole card, not just the anchor), and render a new `QuickAddTrigger` as a **sibling** of the Link, after it. No absolute positioning, no z-index stacking, no nested-interactive-element problem — the two remain fully independent DOM nodes with independent event handling.

Visibility, mirroring DESIGN_SYSTEM §37/§39 ("Hover:... quick-add controls become available") and PROJECT.md §74 ("Quick Add remains accessible through a clear secondary action" on mobile, "No interaction should depend solely on hover"):

- **Below `md`:** always visible, always interactive. No hover exists on touch.
- **At `md` and up:** hidden by default (`opacity-0 pointer-events-none`, but still occupying its fixed layout row — never `display:none`/`hidden`, so revealing it never shifts the grid's row height and never causes CLS), revealed via `group-hover` **and** `group-focus-within` (so a keyboard user tabbing onto the trigger reveals it exactly as it receives focus — hover-only reveal with no focus equivalent would be a real accessibility regression of the same class D-037 already caught elsewhere in this codebase). `pointer-events-none` blocks accidental clicks on the invisible state without touching its tab order or focusability.
- Opacity transition: `duration-200 ease-esque`, matching the exact tier the *same component's* existing secondary-image hover crossfade already uses — one motion value for two related reveals on the same card, not a new one invented for this feature. Falls under INTERACTIONS.md §17's "retain: fades" — no reduced-motion override needed.
- Visual treatment: matches `ProductPurchasePanel`'s existing "Size Guide" secondary-action link style (`text-utility uppercase tracking-metadata text-esque-text-secondary`, underline-on-hover) rather than a bordered `Button`, which would visually overweight a small per-card affordance. DESIGN_SYSTEM §17 explicitly allows text-based CTAs ("Editorial CTA... instead of large filled buttons").
- Label: `QUICK ADD` (CONTENT.md §10's canonical vocabulary, matching `ActiveGarmentPanel`'s existing usage verbatim).

This applies everywhere `ProductCard` renders — category/subcategory grids, the PDP's own Related Products, Search results, the homepage's Selected Pieces — since none of those is the redundant "PDP/Interactive Model's own featured product" case the task names, and DESIGN_SYSTEM gives ProductCard one consistent interaction model regardless of which page renders it (the hover crossfade and `SOLD OUT` badge already work this way). See New Architectural Decisions to Record for the full reasoning against scoping this behind a new prop.

### Data fetching: `GET /api/products/[handle]`, this codebase's second Route Handler

Mirrors `app/api/search/route.ts` exactly: a plain `GET` handler, no `export const dynamic` override needed (GET handlers default to dynamic since Next 15.0.0-RC, already confirmed against this project's installed docs by D-058), already excluded from the access gate (`proxy.ts`'s matcher excludes `/api` unconditionally). Calls the existing `getProduct(handle)` directly — no new Shopify query, no new fetch logic in `lib/shopify/products.ts`.

```
GET /api/products/[handle]  ->  { product: ProductDetail }        (200, found)
                             ->  { product: null }                (200, not found — mirrors getProduct's own null-is-not-an-error contract, exactly like search's `{ products: [] }` for zero results)
                             ->  { error: 'product_fetch_failed' } (500, a real thrown error — logged server-side only, never forwarded, mirroring search's contract)
```

A `404` status for "not found" was considered and rejected: this codebase's own established convention (search's route, `getProduct`'s own docstring: "a genuinely absent product is not an error") treats resource-absence as *data*, not a wire-level error — keeping the client's handling uniform (branch on `product === null`, not on status code).

Why a Route Handler, not a Server Action: identical reasoning to D-058 Part 5 — this is a live, on-demand, one-shot GET triggered by a UI interaction, not a form submission (this codebase's existing Server Action call sites are all discrete form submissions — `AccessForm`, `RequestAccessForm`). A dynamic route segment (`[handle]`), not a query parameter, because this fetches one specific, already-known resource by its canonical identifier — exactly mirroring the page route it's paired with (`/products/[handle]`), unlike search's flat `?q=` (which isn't about one resource).

### Desktop panel vs. mobile bottom sheet: one native `<dialog>`, reusing `SizeGuidePanel`'s mechanism, different desktop CSS

Per the task's explicit instruction, `QuickAddPanel` reuses `SizeGuidePanel`'s exact mechanics: a single native `<dialog>` element, `showModal()`/`close()` driven by an `open` prop via `useEffect`, `onClose` wired to the dialog's native `close` event so Escape and programmatic close both keep parent state in sync. This gives real focus-trapping, Escape-to-close, and a backdrop natively — zero hand-rolled keyboard-event code, matching D-027's reasoning for choosing this over `FullScreenMenu`'s bespoke pattern.

The **mobile** treatment is a direct copy of `SizeGuidePanel`'s own bottom-sheet CSS (`fixed inset-x-0 bottom-0`, capped height, `overflow-y-auto`) — DESIGN_SYSTEM §41 wants exactly this, and there's no reason to diverge from an already-reviewed pattern for the same tier.

The **desktop** treatment deliberately does *not* copy `SizeGuidePanel`'s right-docked side panel. DESIGN_SYSTEM §40 describes Quick Add's desktop treatment differently from §46's Size Guide wording — "lightweight overlay or expansion connected to the product card," not "side panel." The desktop override instead centers the dialog as a small, capped-width box (`md:inset-0 md:m-auto md:w-full md:max-w-sm`, height left auto/`fit-content`, capped by the shared `max-h-[85vh]`) — the classic `position:fixed; inset:0; margin:auto` centering technique, which is also literally how a native `<dialog>` centers itself by default before any position override is applied. This reads as "lightweight" (small, centered, minimal chrome) and distinct from Size Guide's edge-docked drawer, while sharing the exact same underlying `<dialog>` mechanism. No open/close CSS transition is added, matching `SizeGuidePanel`'s own precedent of instant native show/hide — see New Architectural Decisions to Record.

### Component breakdown

- **`components/catalog/QuickAddTrigger.tsx`** (new, client component) — owns `open` state; renders the `QUICK ADD` button (fires `quick_add_open`, then opens) and `<QuickAddPanel>`. Takes only primitive props (`handle`, `title`) from the server-rendered `ProductCard`, matching D-031's "every prop is a primitive" discipline. Lives in `components/catalog/` — it is the on-grid entry point itself, the same domain as `ProductCard`/`ProductGrid`/`FilterBar`.
- **`components/product/QuickAddPanel.tsx`** (new, client component) — the dialog: fetch-state machine, selection state, `VariantPicker` reuse, loading/error/not-found/sold-out rendering, the `ADD TO BAG` button. Lives in `components/product/` alongside `VariantPicker`/`SizeGuidePanel`/`ProductPurchasePanel` — it is purchase-panel UI in the same sense `VariantPicker` already is, regardless of which page's component tree renders it (mirrors this exact cross-domain precedent: `ProductDetail`, in `components/product/`, already imports `ProductGrid` from `components/catalog/` for Related Products — imports flow both directions here already).
- **`app/api/products/[handle]/route.ts`** (new) — the Route Handler above.
- **`components/catalog/ProductCard.tsx`** (edited) — the minimal restructure described above, plus rendering `<QuickAddTrigger>`.
- **`lib/analytics/events.ts`** (edited) — one new event, one extended union member (see Analytics below).

`QuickAddPanel`'s internal state:

```ts
type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'loaded'; product: ProductDetail };
```

A fresh fetch runs every time `open` transitions to `true` (an `AbortController`-guarded effect, cleaned up on close/unmount — mirroring `SearchOverlay`'s exact cancellation pattern), and selections reset to `getInitialSelections(product.options)` once the product resolves. This matches `SearchOverlay`'s own established "reopening always starts fresh" precedent (D-058) rather than caching across opens — Quick Add is opened rarely enough (one explicit click) that refetching is cheap and guarantees freshness, and caching would need its own invalidation story with no current justification.

### States (PROJECT.md §39, DESIGN_SYSTEM §40, this task's own list)

- **Loading:** a small skeleton (`animate-pulse` blocks), matching `SearchOverlay`'s existing loading treatment — not a spinner, no new pattern invented.
- **Error (a real thrown fetch/response failure):** `SOMETHING WENT WRONG.` + a `Retry` button that re-runs the fetch — copied verbatim from `SearchOverlay`'s own error state (same underlying "a live fetch can fail" situation, same established copy and mechanism, same `retryToken`-increment retry pattern).
- **Not found (`{ product: null }`):** `THIS PIECE DOESN'T EXIST.` — CONTENT.md's own 404 copy, used here because this *is* that condition (the same `getProduct` returning `null` that the PDP's own route turns into a hard `notFound()`), just surfaced inline instead of as a full page.
- **Sold out (`isProductSoldOut(variants)`, product-level):** `NO LONGER AVAILABLE.` in place of the variant picker and `ADD TO BAG` — verbatim, matching `ProductPurchasePanel`/`ActiveGarmentPanel`'s existing treatment exactly. The trigger itself stays clickable even for a card already showing `SOLD OUT` (PROJECT.md §40: sold-out products "remain visible... pages remain accessible") — opening still works, it just immediately shows this state.
- **Unavailable variants "visibly disabled" (§40):** free, via `VariantPicker`'s existing `peer-disabled` treatment — no new code.
- **Already-selected single color (PROJECT.md §39):** free, via `getInitialSelections` — no new code.
- **Loaded, selection incomplete:** `ADD TO BAG` disabled, with the same "Select all options to continue." hint text `ProductPurchasePanel`/`ActiveGarmentPanel` already show.

The state-dependent body is wrapped in `aria-live="polite" aria-atomic="true"`, matching `SearchOverlay`'s and `InteractiveModelExperience`'s established precedent (D-049) for content that swaps without navigation — a screen-reader user who just opened the dialog is told when loading resolves, rather than sitting on a silent skeleton.

### Accessibility

- Native `<dialog>` gives focus-trapping, Escape-to-close, and (per D-027's established, unchallenged precedent) focus restoration to the trigger on close — no hand-rolled keyboard code, no `FullScreenMenu`/`SearchOverlay`-style WebKit `tabIndex` workaround needed (those exist specifically for *hand-rolled* `role="dialog"` implementations; the native element doesn't have that quirk).
- `aria-label={`Quick Add — ${title}`}` on the dialog — dynamic, not `SizeGuidePanel`'s fixed generic label, since many `QuickAddPanel` instances exist on one page (one per card) and a screen-reader user needs to know which product's dialog they're in.
- The trigger button is keyboard-reachable and its reveal is `focus-within`-gated, not hover-only (see Trigger above) — the concrete accessibility failure mode D-037 already found and fixed once in this codebase (a hover-gated affordance with no focus equivalent).
- `VariantPicker`'s existing radio-group semantics, disabled-state styling, and D-010 focus-ring color are reused unmodified.
- `namePrefix={`quickadd-${handle}`}` — a fourth call-site tag alongside D-036's `pdp-`/`preview-`/`look-`, keeping this panel's radio groups from colliding with any other simultaneously-mounted `VariantPicker` for the same or a different product. (Realistic collision risk is already zero — `SearchOverlay`/`FullScreenMenu` make the rest of the page `inert` while open, so at most one Quick Add dialog is ever genuinely interactive at a time — but the tag costs nothing and keeps the convention consistent.)

## Analytics (PROJECT.md §82 — "Quick Add usage", following D-055's taxonomy conventions)

D-055 already added `quick_add_click` (`{currency, value, items: [AnalyticsItem], region: string}`), wired to the Interactive Model's own `QUICK ADD` button with `region` carrying its hotspot region (`'top'`/`'bottom'`). That event is reused here, not duplicated: the on-grid `ADD TO BAG` click inside `QuickAddPanel` fires it with `region: 'product_card'` — `region`'s type is already a plain `string` (not a closed union scoped to hotspot regions), so this is a non-breaking, same-shape extension of an existing event to a second real surface, exactly the "which surface fired it" pattern D-055 already established for `variant_selected`'s `context` field.

One genuinely new event is added: `quick_add_open` (`{item_id, item_name}`), fired when the trigger is clicked and the panel begins opening — mirroring the existing `shop_the_look_open`/`request_access_open` "opened a flow" pattern, which none of the three existing Quick-Add-adjacent surfaces had for this specific flow (the Interactive Model's own `QUICK ADD` button has no separate "open" step — its panel is already visible once a hotspot is activated). This gives PROJECT.md §82's "Quick Add usage" a real open→complete funnel for the one surface that actually has an open step, without inventing a metric no other surface can produce.

`variant_selected`'s `context` union (`'pdp' | 'interactive_model' | 'shop_the_look'`) gains a fourth member, `'quick_add'` — the shared `VariantPicker` now has a fourth real, live call site.

```
Product Behavior additions/reuse:
  quick_add_open   { item_id: string; item_name: string }                                  — NEW
  quick_add_click  { currency, value, items: [AnalyticsItem], region: 'product_card' }      — reused, new region value
  variant_selected { ..., context: 'quick_add' }                                            — reused, new context value
```

No PII, no secrets — identical shape/sanitization guarantees as every other event (`dispatchAnalyticsEvent`/`sanitizeEventProperties` are unmodified).

## Demo Mode

`getProduct` already short-circuits to `getPreviewProductDetail(handle)` before ever touching `getStorefrontClient()` (D-057). The new Route Handler calls `getProduct(handle)` directly and does nothing else — Demo Mode support is inherited for free, with zero new code, exactly as the task asked to verify rather than assume. This is confirmed, not assumed, during implementation by running the dev server locally with `PREVIEW_DEMO_MODE=1` and exercising the real trigger → fetch → panel flow against real fixture data (`lib/shopify/preview-demo-fixtures.ts`), then re-confirming the flag stays off in every committed config (`.env.local.example`, `playwright.config.ts`, CI) exactly as before.

One fixture-data caveat worth recording up front (not a defect in this feature): each Demo Mode fixture declares two options (`Size`: 5 values, `Color`: 2 values) but only one real variant (`M / Black`) — so every other Size/Color combination correctly renders as unavailable via `VariantPicker`'s existing disabled-state logic. This is a pre-existing fixture-data property (already true for the PDP and Interactive Model today), not something this feature changes or needs to work around.

## Testing

This feature inherits the same fundamental limitation D-023/D-028/D-030/D-034/D-045/D-048/D-049/D-053/D-055/D-056/D-058 have each already documented: no real Shopify store is configured in this dev/CI environment, so every category/PDP route hits the generic error boundary before a real `ProductCard` — and therefore a real `QuickAddTrigger`/`QuickAddPanel` — ever mounts through normal navigation. Unlike `SearchOverlay` (mounted unconditionally in the shell, reachable on every page regardless of Shopify state), `QuickAddTrigger` only exists *inside* a successfully-rendered `ProductCard`, so there is no unconditioned mounting point to exercise via ordinary Playwright navigation.

Given that:

- **Unit tests (real, CI-running):** `app/api/products/[handle]/route.test.ts`, mirroring `app/api/search/route.test.ts`'s exact structure — found/not-found/error-shape cases against a mocked `getProduct`. `lib/analytics/events.test.ts` gains coverage for the new `quick_add_open` event and the extended `variant_selected` context value.
- **Live, one-time verification (not committed):** a temporary fixture-probe route, mirroring this codebase's own established technique (D-026/D-034/D-045/D-048/D-049/D-053/D-055/D-056/D-058) — real fixture `ProductListItem`s rendered through the real, unmodified `ProductCard`/`QuickAddTrigger`/`QuickAddPanel` — plus a manual Demo Mode dev-server pass, used to confirm: the trigger's mobile-always-visible/desktop-hover-and-focus-reveal behavior at real viewport widths; the fetch → loading → loaded transition; real variant selection reflecting live state; the sold-out, not-found, and error+retry states; keyboard operability and focus return on close; the desktop-centered vs. mobile-bottom-sheet CSS actually rendering as designed. Deleted before commit, confirmed via `git status --short`, exactly like every prior instance of this technique.
- **Existing regression suite:** every current Playwright spec is re-run to confirm the `ProductCard` restructure introduces no regression. This is expected to be a non-event: grepping every existing spec confirms no current test ever reaches a real `ProductCard` render (every consumer — category grids, PDP Related Products, Search results, homepage Selected Pieces — is gated behind a successful Shopify fetch that never succeeds in this environment) — verified directly, not assumed, before relying on it.
- **Honestly not built:** a permanent, committed E2E test exercising the real trigger→fetch→add flow through ordinary navigation. This mirrors D-045's/D-049's own explicit precedent (a real coverage gap, honestly documented, rather than inventing a new committed-fixture-route pattern this codebase has deliberately never adopted for a single feature's sake).

## New Architectural Decisions to Record

1. Quick Add's on-grid entry point (D-029's deferral) is resolved: a new Route Handler mirroring D-058's pattern, `QuickAddTrigger`/`QuickAddPanel` reusing `VariantPicker`/`SizeGuidePanel`'s mechanisms, a real disabled-until-complete/no-op `ADD TO BAG` matching D-016/D-029.
2. Quick Add ships as **unconditional** `ProductCard` behavior — no new opt-in prop (unlike `enableSharedTransition`/`priorityFirstImage`, which exist because of concrete, provable technical conflicts specific to certain call sites — a View Transition naming collision, an LCP-targeting requirement). Quick Add has no such conflict: it is exactly as safe on PDP Related Products, Search results, and homepage Selected Pieces as the already-unconditional hover crossfade and `SOLD OUT` badge are. The task's own scoping language ("only category/catalog grid usage needs this") is read as explaining why the PDP's/Interactive Model's *own featured product* doesn't need a second, redundant entry point — not as excluding the *other* real products those same pages already show via plain `ProductCard`.
3. Quick Add's desktop treatment is a **centered lightweight overlay**, not a copy of `SizeGuidePanel`'s right-docked side panel — DESIGN_SYSTEM §40's own wording ("lightweight overlay... connected to the product card") differs deliberately from §46's "side panel" wording for Size Guide. A true position-anchored popover (pinned to the exact triggering card) was considered and rejected: it requires resize/scroll-tracking JS with no precedent anywhere in this codebase, for a payoff (pixel-exact "connectedness") the spec's own wording doesn't demand — "connected" is satisfied contextually (opens/closes in direct response to that card, blocks nothing else) without it.
4. No open/close CSS transition is added to the dialog itself, matching `SizeGuidePanel`'s existing precedent of instant native `showModal()`/`close()` with no animation. `@starting-style`-based dialog entrance/exit transitions (the current standards-track technique for animating `<dialog>`) were considered and deliberately not introduced: this codebase has no existing use of the technique to build on, and introducing it here — for one feature's polish — would be a new motion pattern with its own cross-browser verification burden, disproportionate to what DESIGN_SYSTEM's general "quick add" motion-timing-table entry actually mandates (a categorization example, not a per-feature animation requirement; the trigger's own 200ms hover/focus-reveal already sits in the named tier).
5. `quick_add_click`'s existing `region: string` field is reused (not duplicated) for the on-grid surface, with the value `'product_card'` — a same-shape, non-breaking extension consistent with how `variant_selected`'s `context` field already tags multiple real surfaces on one event.

## Explicitly Open / Out of Scope for This Spec

- Whether Quick Add should eventually be scoped away from any specific surface (e.g., if the homepage's "brand-world, not a catalog" philosophy is later judged to conflict with an on-card commerce affordance) is a product decision for `product-manager`/`ui-ux-designer`, not resolved here — flagged, not guessed at.
- Real relevance of the Demo Mode fixture caveat (one variant per product) to a future, larger fixture set is out of scope — unchanged by this feature.
- A real cart, and therefore a real `ADD TO BAG` mutation from within Quick Add, remains blocked on D-016 exactly as it does for the PDP and Interactive Model.

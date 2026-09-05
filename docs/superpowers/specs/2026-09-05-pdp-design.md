# Esque — Product Detail Page

Status: Design spec, written for implementation planning.
Scope: ROADMAP.md Phase 5 (Product Detail Page), narrowed — the real `/products/[handle]` route, the 60/40 layout, size/color selection with a real size-guide panel, scarcity display logic, related products, and recently-viewed. Quick Add's on-grid entry point and a few PROJECT.md §43 elements that need real merchandising/editorial data are explicitly deferred (see Explicit Non-Goals).

## Context

The catalog (Phase 4) is complete and pushed to `main`: seven category routes, `ProductCard`/`ProductGrid`/`FilterBar`/`CategoryListing`, and `lib/catalog/{taxonomy,filters,grid-layout}.ts`. Every `ProductCard` already links to `/products/[handle]`, which has been a 404 since Phase 4 — this phase is the first real consumer of that route.

`lib/shopify/products.ts`'s `getProduct(handle)` already exists (built in Phase 2) and is unused. Its current return shape (`ProductDetail`): `id, handle, title, description, productType, tags, minPrice, images: ProductImage[], variants: ProductVariant[]` where each variant has `id, title, availableForSale, price, selectedOptions`. It does **not** currently fetch `Product.options` (the option names/values needed to render a generic size/color selector) or `ProductVariant.quantityAvailable` (needed for honest scarcity copy) — both exist on Shopify's real, current (2026-07) Storefront API schema (confirmed directly against the pinned `lib/shopify/storefront.types.d.ts` schema dump, not assumed), so both are addable now, before a real store exists, exactly like every other typed read in this codebase.

No real Shopify store exists yet — same hard constraint every prior phase worked under. `pnpm graphql-codegen` was run standalone (no query changes) as part of writing this spec to confirm network access to Shopify's schema proxy still works in this environment; it succeeded and produced a byte-identical regeneration, confirming the D-015/D-017 codegen workflow is available for this phase's query extension.

Source of truth: `PROJECT.md` §39-49 (Quick Add, sold-out, scarcity, add-to-bag feedback), §43-46 (PDP required elements, layout, media, scarcity), `DESIGN_SYSTEM.md` §39-49 (product card, Quick Add desktop/mobile, PDP layout/scrolling/media, size selection, size guide, scarcity UI), `ARCHITECTURE.md` §4-5 (rendering strategy, Category/Collection separation), `DECISIONS.md` D-007 (Category/Collection), D-010 (focus-ring color), D-012 (placeholder-data precedent), D-016 (cart/checkout deferred — no cart exists), D-023/D-024/D-025 (this project's established narrowing discipline), `CONTENT.md` §6-8 (error/empty/scarcity copy).

## Goals

ROADMAP.md Phase 5's five items, narrowed:

- **PDP layout (60/40 media/info split)** — full build. Real route `app/(storefront)/products/[handle]/page.tsx`, server-rendered against the typed Shopify client, same honest-failure pattern as every prior phase (unconfigured Shopify → `app/error.tsx`; unknown handle → real `notFound()`).
- **Size/color selection, size guide** — full build. A generic, data-driven variant selector (native radio groups, keyboard-operable, D-010 focus rings) built against `product.options`/`product.variants` — genuinely fixture-verifiable, same class of correctness as the catalog's filter logic. Size guide is a real, native `<dialog>`-based panel (side panel desktop / bottom sheet mobile) with placeholder measurement content, clearly labeled as such — sizes/measurements are still an open product decision (`PROJECT.md` §101), so the mechanism is real and the content is honest about being illustrative.
- **Quick Add** — partial. The underlying variant-selection mechanism (above) is built once, fully reusable by Quick Add later. The Quick Add *entry point* itself (desktop overlay + mobile bottom sheet, triggered from `ProductCard`/the grid) is deferred — see Explicit Non-Goals and the new D-029 for why this is a different call than simply stubbing a button click.
- **Scarcity UI** — built, honestly. A real, fixture-tested display-tier function reads Shopify's actual (now-fetched) `quantityAvailable` field and renders truthful copy (`LOW STOCK`, `N REMAIN`, `SOLD OUT`) when a number is known; renders nothing when it isn't (unconfigured store, or a real store that hasn't enabled inventory visibility). Never fabricates a count — see D-028.
- **Related products / Complete the Look / Recently viewed** — split. Related Products is built (mechanically derived: other products sharing this product's `productType`, reusing the already-tested `getProducts`). Complete the Look is deferred (needs real curatorial/outfit-pairing data that doesn't exist). Recently Viewed is built (client-side, versioned `localStorage`, no Shopify dependency at all).

End state: a real, server-rendered, crawlable PDP with a working, keyboard-accessible variant selector, a real size-guide panel, honest scarcity display, a related-products rail, and a recently-viewed strip — all committed with unit + E2E coverage, ready for a future cart phase to wire real Add-to-Bag behavior into the mechanism this phase builds.

## Explicit Non-Goals (deferred)

- **Quick Add's on-grid entry point** (desktop overlay + mobile bottom sheet triggered from `ProductCard`). See D-029. Unlike the PDP's own selector (which receives data the page already fetched), an on-card overlay needs *new* on-demand data-fetching plumbing (a Server Action or route handler + client fetch + loading/error handling inside a small overlay) that has no other consumer yet — building it now means shipping new infrastructure whose only payoff (skip-the-PDP speed) is moot before Add-to-Bag itself does anything real. `ProductCard`/`ProductGrid` stay the zero-JS Server Components Phase 4 built; no client island is added to the grid this pass.
- **A real Add-to-Bag mutation.** No cart exists (D-016). The PDP's "ADD TO BAG" button is real and its enabled/disabled state is fully real (reflects true variant/availability selection), but its click handler is a documented no-op — matching the exact, already-shipped precedent in `Header.tsx` (`SEARCH`/`ACCOUNT`/`BAG` are real, clickable, `onClick={() => {}}` today, with `bagCount` as local, disconnected `useState(0)`). Not wired to Header's bag count — incrementing a local, unpersisted counter would simulate a working cart that doesn't exist, which is a worse dishonesty than a plain no-op.
- **Complete the Look.** Needs a real, curated outfit-pairing relationship between specific products (which items pair with this one) — no metafield/metaobject encoding that exists yet, and DESIGN_SYSTEM/PROJECT tie the fuller "Shop the Look" concept to the Interactive Model (ROADMAP Phase 8, its own signature feature with its own "Shop the Look panel + multi-item add flow" line item). Related Products (mechanically derived by shared `productType`) is a different, honestly-derivable relation and is built.
- **Drop/collection context on the PDP** (e.g. "COLLECTION 001"). `getProduct`'s query doesn't currently surface collection membership, and with only one real collection in the catalog (same fact D-024 already used to defer a Collection filter), hardcoding it would be the exact anti-pattern D-024 rejected. Cleanly additive later (one more query field + one more line of text) once it's worth a second collection existing to prove it's not hardcoded.
- **Materials, Fit, Care instructions, Model measurements, Shipping information as dedicated structured sections.** `PROJECT.md` §101 lists sizes, materials, and fit descriptions as still-open product decisions — there is no real per-product structured data (Shopify metafields) for any of these yet. Unlike the Size Guide (whose *mechanism* is real and whose placeholder measurement content is clearly framed as illustrative, mirroring D-012's placeholder-nav precedent), fabricating specific material/fit/care/shipping claims reads as an operational or factual promise a customer could act on (e.g., a care instruction, a shipping timeline) even when labeled "placeholder" — a materially different risk than a labeled placeholder tape measurement. `product.description` (the one real field that exists) is rendered as the PDP's editorial copy; nothing else is fabricated. Shipping copy specifically is skipped even as a placeholder, since `PROJECT.md` §54/§101 haven't decided a carrier, rate, or threshold at all — there's nothing honest to place there yet, not even an illustrative placeholder.
- **Zoom / lightbox, video, 360° media.** Not in ROADMAP Phase 5's own checklist (only layout, selection+guide, Quick Add, scarcity, related/recently-viewed are listed) — this pass treats that checklist as this project's own prior narrowing of `PROJECT.md` §43-45's maximal list, not an oversight to silently "complete." Video/360° also have no real assets (`ROADMAP.md` V2+ list already defers 360° explicitly). The gallery is a static, stacked list of real images.
- **Wishlist / Save on the PDP.** `ROADMAP.md` Phase 10 ("Account") already owns "Wishlist (anonymous local + merge on login)" as its own line item — building a heart/save affordance here would duplicate work that phase is meant to design as a whole (including the anonymous-to-account merge behavior), not a PDP-specific decision.
- **Back-in-stock notification.** `ROADMAP.md`'s own V1.1 section already lists this as a post-launch follow-up, not a V1/Phase 5 item — already deferred by the roadmap itself, not a new deferral introduced here.
- **Structured data (Product schema), canonical URLs beyond Next's defaults, Open Graph images.** `ROADMAP.md` Phase 12 ("SEO pass") owns this holistically, exactly as the catalog spec already established for category pages. Basic `generateMetadata` (title/description) is still built, since it isn't the later-owned line item the way structured data is.
- **Live-store verification of anything.** Identical constraint to every prior phase: built and unit-tested against fixtures shaped like the real generated Shopify types; E2E-tested for what's genuinely reachable without a store. Whether the grid of related products is *merchandising-quality*, whether real scarcity numbers ever actually render, and whether a real customer completes a real purchase are not verifiable this pass.

## New Architectural Decisions to Record

- **D-027**: Size/color selection uses native `<fieldset>`/radio-input groups (visually restyled, not `<select>` dropdowns) rather than a custom ARIA widget — full native keyboard support and disabled-state semantics for free. The Size Guide panel uses the native `<dialog>` element (`showModal()`), not `FullScreenMenu`'s hand-rolled `role="dialog"` + manual focus-trap pattern — a deliberate, reasoned deviation for a differently-shaped problem (a plain utility side-panel/bottom-sheet vs. a bespoke full-screen editorial transition), not a competing pattern for the same responsibility.
- **D-028**: Scarcity is a real, pure, fixture-tested tier function over Shopify's actual `quantityAvailable` (now fetched) and `availableForSale`. Renders nothing when the count is unknown (`null`) rather than fabricating one. Documents the exact thresholds chosen (≤3 → exact count "REMAIN", ≤10 → "LOW STOCK", else silent) as this pass's own honest interpretation of `CONTENT.md` §8's example vocabulary, not a value handed down by a merchandiser.
- **D-029**: Quick Add's on-grid entry point (not just its cart mechanics) is deferred — distinct reasoning from D-016's cart deferral. The PDP's own variant-selection mechanism is built in full, with a stubbed Add-to-Bag action matching `Header.tsx`'s existing no-op-button precedent.
- **D-030**: Related Products (mechanical, same-`productType`) is built; Complete the Look, drop/collection context on the PDP, and dedicated Materials/Fit/Care/Shipping sections are deferred — bundled under one entry since they share the same root cause (no real curatorial or structured per-product data exists yet), mirroring how D-024 bundled Size/Color/Collection filters under one reason.
- **D-031**: Recently Viewed is implemented as a small, versioned, capped `localStorage` list of denormalized product snippets (handle/title/image/price) — not a re-fetch of full product data and not tied to any account/server state. No Shopify dependency; works even when the store is unconfigured.

## Architecture

### Route and data flow

```
app/(storefront)/products/[handle]/page.tsx
  generateMetadata() ─┐
                       ├─► cached getProduct(handle)   [React cache(), request-scoped]
  page component ─────┘
       │
       ├─ notFound() if null (real 404 — see Error Handling)
       │
       ├─ isProductSoldOut(product.variants) computed for the top-level SOLD OUT badge
       │
       ├─ getProducts({ query: buildProductSearchQuery({ productTypes: [product.productType] }), first: 5 })
       │     — sequential, not parallel: genuinely depends on product.productType, so this
       │       is a real dependency chain, not the kind of avoidable waterfall the
       │       async-parallel/server-parallel-fetching guidance warns against.
       │     — filtered to exclude product.handle itself, capped to 4
       │
       └─► <ProductDetail product={...} soldOut={...} relatedProducts={...} />
```

`generateMetadata` and the page component both need `getProduct(handle)`. Rather than assume `@shopify/storefront-api-client`'s internal `fetch` happens to be deduped by Next's request memoization (an implementation detail this codebase doesn't rely on elsewhere), the route wraps `getProduct` in React's `cache()` locally in `page.tsx` — a three-line, request-scoped memoization, not a new abstraction layer, and the documented fix for exactly this "same data needed in `generateMetadata` and the page body" shape.

### Query and data-layer extension

`GET_PRODUCT_QUERY` (`lib/shopify/queries/products.ts`) gains two things, verified against the real, pinned (2026-07) schema before writing them:

- `options { id name optionValues { id name } }` on `Product` — the current, non-deprecated shape (`ProductOption.values: [String]` exists but is `@deprecated`; `optionValues` is used instead). No `swatch` field is fetched — DESIGN_SYSTEM.md's own Quick Add mock (§40) shows color as a plain text value (`BLACK FOREST`), not a swatch chip, so there's no design requirement to fetch it, and not fetching it keeps the query and the mapping smaller.
- `quantityAvailable` on each `ProductVariant` in the existing `variants(first: 100)` selection — a plain, nullable `Int` on the schema with no scope annotation in its own doc comment (unlike, e.g., `ProductVariantComponent`, which explicitly documents needing `unauthenticated_read_product_listings`). Whether a real store actually returns a non-null value here also depends on a merchant-side "show inventory quantities" setting this project can't confirm without a real store — exactly the same class of caveat D-023 already recorded for `productType` string matching. The mapping treats `null` as "unknown," never as zero.

`lib/shopify/products.ts` additions (additive to the existing `ProductDetail`/`ProductVariant`, not a breaking change — every existing field stays):

```typescript
export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}

export interface ProductDetail {
  // ...existing fields unchanged...
  options: ProductOption[];
}
```

`getProduct`'s mapping adds `options: product.options.map((o) => ({ id: o.id, name: o.name, values: o.optionValues.map((v) => v.name) }))` and `quantityAvailable: node.quantityAvailable ?? null` per variant. The existing `products.test.ts` "maps a real-shaped response" test is updated (its fixture and expectation both gain `options`/`quantityAvailable`) since it asserts the full shape via `toEqual` — this is a necessary update to an existing test's fixture, not a behavior change to anything the test was actually verifying.

No changes to `GET_PRODUCTS_QUERY`/`getProducts`/`ProductListItem` (the catalog's grid query) — Related Products reuses `getProducts` exactly as built, no new Shopify-layer code beyond the one query/mapping extension above.

### Pure logic modules — `lib/product/`

Mirrors `lib/catalog/`'s existing split (pure, framework-free, fixture-tested logic; thin components on top) for the same reason: this project has no jsdom/React Testing Library (confirmed: `vitest.config.ts` sets `environment: 'node'`), and introducing one for this phase isn't justified when every piece of real logic can be pure functions instead. `lib/catalog/` stays about multi-product browsing; `lib/product/` is about single-product detail concerns — parallel to the existing `components/catalog/` vs. new `components/product/` split below.

**`lib/product/variants.ts`**
```typescript
export type OptionSelections = Record<string, string>; // option name -> selected value

// PROJECT.md §39: "If only one color exists, the color may already be
// selected... Size must never be guessed." — auto-fills any option with
// exactly one possible value, EXCEPT one named "Size" (case-insensitive),
// which always starts unselected regardless of how many values it has.
export function getInitialSelections(options: ProductOption[]): OptionSelections;

// A variant "matches" when every one of its own selectedOptions entries
// equals the corresponding current selection. Naturally returns null for
// a partial selection (an option the product defines but selections
// hasn't set yet) without a separate completeness check, since
// selections[name] is undefined and never equals a real value.
export function findMatchingVariant(
  variants: ProductVariant[],
  selections: OptionSelections,
): ProductVariant | null;

// True iff some available-for-sale variant has this exact (name, value)
// pair — drives the disabled/struck-through treatment on a option-value
// button (DESIGN_SYSTEM.md §45).
export function isOptionValueAvailable(
  variants: ProductVariant[],
  optionName: string,
  value: string,
): boolean;

export function isSelectionComplete(options: ProductOption[], selections: OptionSelections): boolean;

// True when every variant is unavailable — the product-level SOLD OUT
// state (independent of which variant, if any, is selected), mirroring
// ProductCard's own product-level badge.
export function isProductSoldOut(variants: ProductVariant[]): boolean;
```

**`lib/product/scarcity.ts`**
```typescript
export type ScarcityStatus =
  | { level: 'sold-out' }
  | { level: 'final'; count: number }
  | { level: 'low' }
  | null; // unknown or plentiful — nothing truthful/urgent to say

// CONTENT.md §8's permitted vocabulary (LOW STOCK, "3 REMAIN", SOLD OUT),
// generalized into three tiers. Never fabricates: a null quantityAvailable
// (unconfigured store, or a real store not exposing it) always yields
// null here, never a guessed number. See DECISIONS.md D-028 for why these
// exact thresholds (≤3, ≤10) are this pass's own reasoned choice, not a
// merchandiser-supplied value.
export function getScarcityStatus(
  quantityAvailable: number | null,
  availableForSale: boolean,
): ScarcityStatus;

// Maps a status to CONTENT.md-vocabulary copy. Kept separate from the
// status computation so the copy itself is independently unit-tested.
export function getScarcityLabel(status: ScarcityStatus): string | null;
```

**`lib/product/recently-viewed.ts`**
```typescript
export interface RecentlyViewedItem {
  handle: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  minPrice: { amount: string; currencyCode: string };
}

// Minimal structural type (not DOM lib's full Storage) — easy to fake in
// tests with a plain object, and this code only ever needs these two
// members. See vercel-react-best-practices' client-localstorage-schema:
// versioned, capped, and the write path never throws over a full/blocked
// store (private browsing, quota) — a failed write still returns the
// updated in-memory list so the current render is correct either way.
export interface RecentlyViewedStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readRecentlyViewed(storage: RecentlyViewedStorage): RecentlyViewedItem[];

export function recordRecentlyViewed(
  storage: RecentlyViewedStorage,
  item: RecentlyViewedItem,
  max?: number, // default 8
): RecentlyViewedItem[]; // dedupes by handle, most-recent-first, capped
```

### Component breakdown — `components/product/` (new directory, parallel to `components/catalog/`)

- **`ProductGallery.tsx`** (Server) — vertical stack of `product.images`, `next/image` with `priority` on the first (LCP). No zoom/lightbox this pass (Non-Goals).
- **`ProductPurchasePanel.tsx`** (Client, `'use client'`) — the sticky right column's interactive core. Receives a narrow, serialization-conscious prop shape (`title`, `minPrice`, `options`, `variants` — *not* `images`, which never needs to cross the server/client boundary since `ProductGallery` renders them server-side). Owns `selections`/`quantity` state, derives `matchedVariant`/`scarcity`/CTA-enabled via the pure functions above. Static server-rendered content (the description) is passed in as `children` — composition, not a prop, per the vercel-composition-patterns guidance already in use elsewhere in this codebase — so that text stays zero-JS even though it's visually inside the client panel.
- **`SizeGuidePanel.tsx`** (Client) — the `<dialog>`-based panel `ProductPurchasePanel`'s "SIZE GUIDE" control opens. Responsive via CSS alone (one element, `md:` breakpoint switches side-panel↔bottom-sheet positioning) — no separate mobile component.
- **`RecentlyViewed.tsx`** (Client) — records the current product into `localStorage` on mount (a genuine effect: synchronizing "this page was visited" with an external system, not a click-driven update that belongs in an event handler) and renders whatever the list holds, excluding the current handle. Renders nothing when that list is empty (no invented empty-state copy — `CONTENT.md` doesn't define one for this case).
- **`ProductDetail.tsx`** (Server) — assembles the 60/40 grid (gallery left, purchase panel right, `lg:sticky`), the description-as-children composition, the SOLD OUT/`NO LONGER AVAILABLE.` treatment when `isProductSoldOut` is true, the "MORE {PRODUCT TYPE}" related-products section (reusing the existing `ProductGrid`, omitted entirely when empty), and `<RecentlyViewed>`.

`components/catalog/ProductCard`/`ProductGrid` are reused as-is for Related Products — no changes, no new grid component.

### Layout

Desktop (`lg:` and up): CSS grid, `lg:grid-cols-12`; gallery `lg:col-span-7` (~58%), purchase panel `lg:col-span-5` (~42%) — closest clean split to DESIGN_SYSTEM.md §42/§44's "approximately 60/65% / 35/40%" on the existing 12-column grid, per §15's "based on the grid internally" allowance. Purchase panel is `lg:sticky lg:top-[88px]` (Header is a fixed `h-[72px]`, per `Header.tsx`, plus a small gap) through the gallery's scroll, matching DESIGN_SYSTEM.md §43. Below `lg`: single column, gallery first, panel follows (not sticky — a persistent side column has no room on narrow viewports, and DESIGN_SYSTEM.md's sticky-panel model is explicitly a two-column desktop concept).

### Size/color selection accessibility (D-027)

Each option (`Size`, `Color`, …) renders as a `<fieldset>` with a `<legend>` (visually styled as a label, not hidden — DESIGN_SYSTEM.md wants the option name visible, e.g. "SIZE"/"COLOR"). Each value is a real `<input type="radio" name={optionName}>` visually hidden (`sr-only peer`) behind a `<label>` styled as the pill DESIGN_SYSTEM.md §45 describes, using `peer-checked:`/`peer-focus-visible:`/`peer-disabled:` Tailwind variants — full native keyboard support (Tab into the group, arrow keys between values, native activation), a real disabled state for unavailable values (struck-through/reduced-opacity via `peer-disabled:`, and genuinely unselectable, not just visually implied), and a D-010-compliant visible focus ring (`peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-esque-text`) — all without a hand-rolled keyboard handler, unlike `FullScreenMenu`'s necessarily bespoke full-screen dialog.

### Quantity

A plain, controlled `Input` (existing component, `type="number" min={1}`, `useState`) — no new primitive. Controlled (not uncontrolled) is fine here: D-022's controlled-input defect was specific to a value read from native `FormData` at a Server Action's submit boundary; this is a purely client-side derived value feeding client-side computation, no such race exists.

### Add to Bag (D-029)

Real `Button` (`variant="primary"`), `disabled` until `matchedVariant` exists and `matchedVariant.availableForSale`. `onClick` is an explicit, commented no-op — `Header.tsx`'s exact existing pattern for "the real system doesn't exist yet," not a new one. No fake success toast, no wiring to Header's local bag count (which would simulate cart behavior that doesn't exist — a worse dishonesty than a plain no-op).

## Error, Not-Found, Out-of-Stock, and Empty States

- **Shopify unconfigured/unreachable**: `getProduct`/`getProducts` throw; propagates to the existing `app/error.tsx` boundary. Same three-times-established pattern (access gate, Klaviyo, catalog).
- **Unknown handle**: `getProduct` returns `null` → `notFound()` → the existing branded `app/not-found.tsx` (`THIS PIECE DOESN'T EXIST.`). Inherits D-026's already-investigated, already-deferred limitation (dynamically-rendered `notFound()` returns HTTP 200 + `noindex` in this Next.js version, not a hard 404) — not re-investigated here; same fix, if any, lands in Phase 12 for every route that shares it.
- **Out of stock** (product exists, every variant unavailable): not an error or a 404 — the page renders fully. `isProductSoldOut` drives a `SOLD OUT` tag near the price (matching `ProductCard`'s existing badge copy) and replaces the purchase controls' CTA area with `NO LONGER AVAILABLE.` (`CONTENT.md` §6), rather than a disabled `ADD TO BAG`.
- **Scarcity unknown** (a real store hasn't enabled inventory visibility, or the store's unconfigured in dev): renders nothing — silence, not a fabricated number.
- **Related Products empty** (fewer than one match after excluding the product itself): the entire "MORE {TYPE}" section is omitted, not rendered with an empty grid.
- **Recently Viewed empty** (first-ever visit, or nothing else viewed): the entire section is omitted. `CONTENT.md` defines no copy for either empty case, so neither invents new copy — consistent with how `CategoryListing` already treats "nothing to show" as either a real, cited empty-state line (when one exists) or omission (when none is specified).

## Testing

No live store exists — identical constraint to every prior phase:

- **Unit (Vitest), fixture-driven:**
  - `lib/product/variants.ts` — initial-selection auto-fill (including the Size exception), matching a full/partial selection, per-value availability, product-level sold-out, using fixtures shaped like the real generated types (mirroring `lib/shopify/products.test.ts`'s existing fixture style).
  - `lib/product/scarcity.ts` — every tier boundary (0, 1, 3, 4, 10, 11, null) crossed with both `availableForSale` values; label mapping for each tier.
  - `lib/product/recently-viewed.ts` — read of empty/missing/corrupt/wrong-version storage all safely return `[]`; record dedupes by handle and moves the re-viewed item to the front; caps at `max`; a `setItem` that throws (quota/private browsing) still returns the correct in-memory list.
  - `lib/shopify/products.ts` — extend `getProduct`'s existing tests: maps `options`/`quantityAvailable` correctly, including `quantityAvailable: null` passing through as `null` (not coerced), and a product with no options mapping to `options: []`.
- **E2E (Playwright)**, everything genuinely reachable without a store — the same honest limit the catalog spec named for its own grid/filter interactions applies here even more directly, since the *entire* PDP (gallery, selector, scarcity, related, recently-viewed) only ever renders once a real product fetch succeeds:
  - `/products/anything` surfaces `SOMETHING WENT WRONG.` with Shopify unconfigured (mirrors every prior phase's E2E pattern exactly).
  - Not reachable this pass without a store: the not-found path (an unconfigured client throws before `getProduct` can return `null`), metadata correctness (title needs a real product, unlike category pages' taxonomy-only metadata), and all interactive behavior (selection, scarcity, quick-add-adjacent CTA state, recently-viewed rendering). Recorded explicitly rather than silently skipped, matching the catalog spec's own "Explicitly out of reach this pass" section.
  - `components/product/*` get no dedicated component test file, for the same reason `ProductCard`/`ProductGrid` didn't: no jsdom/RTL in this project, and the logic that matters is already covered by the pure `lib/product/*` unit tests. Coverage comes from `pnpm typecheck`/`pnpm build` plus the E2E test above.

## Explicitly Open / Out of Scope for This Spec

- Whether a real store actually populates `quantityAvailable` (merchant-side inventory-visibility setting) — unverifiable without one; the code path for "unknown" is built and tested regardless.
- Whether `Product.options`' value strings will match whatever real size/color taxonomy Esque eventually adopts — the selector is fully generic over whatever values Shopify returns, so no taxonomy assumption is baked in here (unlike D-023's `productType`-string caveat, this one has no failure mode to record: a generic renderer has nothing to get wrong about the taxonomy's contents).
- Quick Add's on-grid entry point, Complete the Look, drop/collection context, Materials/Fit/Care/Shipping sections, zoom, wishlist, structured data — see Non-Goals; each belongs to a later, already-named phase or a future pass once real data exists.

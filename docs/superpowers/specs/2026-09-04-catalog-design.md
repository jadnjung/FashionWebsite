# Esque — Catalog

Status: Design spec, written for implementation planning.
Scope: ROADMAP.md Phase 4 (Catalog), narrowed — category listing pages, the product grid, and the subset of filters/sort that don't require live store data to build and verify correctly. Search and the remaining filter dimensions are explicitly deferred (see Explicit Non-Goals).

## Context

The storefront shell (Phase 0/1/3), the Shopify commerce data layer (Phase 2, narrowed per D-016), and the Access Gate (Phase 6, narrowed per its own spec) are all complete and pushed to `main`. `lib/shopify/{client,products,collections}.ts` exist with typed, tested read functions (`getProduct`, `getProductsByCollection`, `getCollection`, `getCollections`), but nothing in the app calls them yet — Phase 4/5 are the first real consumers. `lib/navigation-data.ts` holds the real category/subcategory taxonomy (`NAVIGATION`), already wired into `Header`/`FullScreenMenu`, but every category href (`/tops`, `/bottoms`, `/etc`, `/new`, and their subcategories) currently 404s via the branded `not-found.tsx` — there is no page behind any of them yet.

No Shopify store exists yet (same hard constraint D-016 and the access-gate spec both worked under). This spec follows the same discipline: narrow honestly to what can be genuinely built and verified without live data, rather than build things whose correctness can't actually be checked this pass.

Source of truth: `PROJECT.md` §9-11 (category taxonomy, IA), §33-36 (search, filtering, collection page, product grid), §39-40 (product card, sold-out), `DESIGN_SYSTEM.md` §15 (responsive grid), §37-41 (collection page, grid behavior, product card, quick add — quick add out of scope, see Non-Goals), §50-51 (search, filters), `ARCHITECTURE.md` §5 (Category vs. Collection data-model mapping), `DECISIONS.md` D-007 (Category/Collection are separate dimensions), D-012 (placeholder-data precedent for undecided real data), D-016 (narrow to what's verifiable without a live store).

## Goals

ROADMAP.md Phase 4's four items, narrowed:

- **New / Tops / Bottoms / Etc. category pages** — full build. Seven routes: `/new`, `/tops`, `/tops/[subcategory]`, `/bottoms`, `/bottoms/[subcategory]`, `/etc`, `/etc/[subcategory]`. Wires the real hrefs `lib/navigation-data.ts` already exposes.
- **Product grid** — full build. An unconventional, periodic large/standard layout per `DESIGN_SYSTEM.md` §36-38, responsive across the documented 12/8/4-column grid (`DESIGN_SYSTEM.md` §15 — the first real implementation of that grid; previously "conceptual/undocumented in code" per ROADMAP.md Phase 1).
- **Filters** — partial. Sort (all four `PROJECT.md` §34 options), Availability, and Price range are built as zero-JavaScript, URL-driven filters, fully verifiable against the typed Shopify client with fixtures. Category/Subcategory are satisfied by routing itself (visiting `/tops/hoodies` *is* filtering by category+subcategory). Size, Color, and Collection are deferred — see Explicit Non-Goals and DECISIONS.md D-024.
- **Search** — deferred entirely this pass. See Explicit Non-Goals and DECISIONS.md D-025.

End state: seven real, server-rendered, crawlable category routes backed by a typed Shopify query, a working sort/availability/price filter mechanism verified with fixtures, and a product grid/card system matching `DESIGN_SYSTEM.md`'s layout and content rules — all committed with unit + E2E coverage, ready for Phase 5's PDP to link into.

## Explicit Non-Goals (deferred)

- **Predictive full-screen search.** See DECISIONS.md D-025 — its value (relevance/ranking quality against a real catalog, "feels instantaneous" per `PROJECT.md` §33) is fundamentally about live-store interaction, not just query-shape correctness. Header's `SEARCH` button stays a no-op, as it already is today.
- **Size, Color, and Collection filters.** See DECISIONS.md D-024 — real size/color taxonomy doesn't exist yet (`PROJECT.md` §101 still lists it as an open product decision, the same category of gap D-012 already named for navigation data), and with exactly one real collection in the catalog, a Collection filter has no second collection to prove it actually excludes anything.
- **Collection identity pages** (`/collections`, `/collections/[handle]`). Not in ROADMAP.md Phase 4's own checklist (only "New / Tops / Bottoms / Etc. category pages" is listed). `DESIGN_SYSTEM.md` §35/§37 describes these as bespoke editorial environments — "individual editorial environments rather than generic product grids," with per-collection accent color, hero typography, and graphic motifs — one of `DESIGN_SYSTEM.md` §69's six V1 signature features, naturally paired with the homepage/interactive-model editorial work in Phase 7/8. Building it now as "just another grid" would risk contradicting §37's own instruction. `getCollection`/`getCollections` (already built, already tested, Phase 2) are untouched and ready when that work starts.
- **Product Detail Page** (`/products/[handle]`) and **Quick Add** — ROADMAP.md Phase 5. `ProductCard` links to `/products/[handle]` anyway, matching the existing, already-established precedent of `Header`/`FullScreenMenu` linking to category routes before *this* pass built them — the branded 404 covers the gap until Phase 5.
- **Custom-cursor `VIEW` label on card hover.** `DESIGN_SYSTEM.md` §39/§18's cursor-label behavior belongs to the signature custom-cursor system, which is ROADMAP.md Phase 9, not built yet. Cards use the default pointer cursor until then.
- **Structured data (Product/Breadcrumb schema), sitemap, Open Graph.** ROADMAP.md Phase 12 ("SEO pass") owns this holistically and explicitly, across every page including the PDP that doesn't exist yet — doing it piecemeal now would mean redoing it there. Basic `generateMetadata` (title/description) is still built this pass (see Architecture) since it's not a distinct, later-owned line item the way structured data is.
- **A bespoke skeleton-grid `loading.tsx`.** The existing root `app/loading.tsx` (pulsing "ESQUE" typography) already satisfies `PROJECT.md` §88's loading-state requirement and applies automatically to every new route. A grid-shaped skeleton is a real, but purely visual, refinement better done once real grid timing/content is understood — noted, not silently skipped.
- **The editorial-image insert** from `DESIGN_SYSTEM.md` §36's illustrative grid sequence ("...4. Wide product 5. Large editorial image 6. Product"). That section's own wording ("Possible desktop sequence") signals an example, not a checklist, and it depends on real campaign photography that doesn't exist yet. The grid system varies product presentation across a periodic large/standard rhythm (satisfying the actual requirement — "may vary product presentation while maintaining alignment and rhythm") and can accommodate an editorial slot later without restructuring.
- **Live-store verification of anything.** Identical constraint to D-016/D-017/D-020: everything here is built and unit-tested against fixtures shaped like the real generated Shopify types, and E2E-tested for what's genuinely reachable without a store (routing, 404s, the error boundary, static metadata) — not for "does the grid show the right 6 products," which needs a real store to mean anything.

## Architecture

### Category pages query Shopify's root `products` connection, not a Collection

Per `ARCHITECTURE.md` §5, Category maps to Shopify product type + tags, deliberately independent of Collection (D-007). Concretely, this means category pages cannot reuse `getProductsByCollection` (which queries `collection(handle).products`, i.e., a specific drop) — they query the root `products(first, after, query, sortKey, reverse)` connection instead, filtered by a `product_type` clause built into the `query` search string.

Verified directly against Shopify's current Storefront API docs (not assumed) before writing the query:
- `products` root field: `first`/`after`/`before`/`last` (cursor pagination), `query: String` (search-syntax filter), `sortKey: ProductSortKeys` (default `ID`), `reverse: Boolean` (default `false`).
- Search-syntax grammar (`shopify.dev/docs/api/usage/search-syntax`): `field:value` equality, `field:>value`/`field:>=value`/`field:<value`/`field:<=value` comparisons, implicit `AND` between adjacent terms, explicit `OR`, parentheses for grouping, multi-word values quoted. Supported product-query fields include `available_for_sale`, `product_type`, `tag`, `title`, `variants.price`, `created_at`.
- Confirmed the dedicated `search`/`predictiveSearch` root queries are a *separate* mechanism from `products(query:)` — reinforces that Search is architecturally its own feature, not a byproduct of this one (see Non-Goals/D-025).

Example built query, for `/tops?available=1&maxPrice=200`:

```
(product_type:"T-Shirts" OR product_type:"Shirts" OR product_type:"Hoodies" OR product_type:"Sweaters" OR product_type:"Jackets") AND available_for_sale:true AND variants.price:<=200
```

**Category/subcategory → product type mapping is derived from `lib/navigation-data.ts`'s existing `NAVIGATION`**, not a second, parallel taxonomy table: a top-level category's product types are its subcategories' `label`s (e.g. `/tops` → `['T-Shirts','Shirts','Hoodies','Sweaters','Jackets']`); a subcategory route's product type is that one `label` (e.g. `/tops/hoodies` → `'Hoodies'`). `/new` has no product-type filter and defaults its sort to newest-first instead (see Filters below). This keeps the taxonomy single-sourced — `NAVIGATION` already drives `Header`/`FullScreenMenu`, and duplicating it in a second mapping would risk the two drifting apart.

**Explicit caveat, same class as ARCHITECTURE.md §5's existing metafield-namespace note:** this assumes the real Shopify store's `productType` field values will exactly equal `NAVIGATION`'s subcategory labels (`"Hoodies"`, `"T-Shirts"`, …) once it exists. If the real store's merchandiser sets different product-type strings, category pages will silently return zero results for that type rather than erroring — this must be confirmed/aligned when the real store is provisioned, exactly like the metafield-namespace risk already on record.

**"Featured" sort has no true curation at the root-query level.** Shopify's `ProductCollectionSortKeys` (used by `collection.products`) has `MANUAL`/`COLLECTION_DEFAULT` for merchant-curated order; the root `ProductSortKeys` enum does not — it's not collection-scoped, so there's nothing to curate against. "Featured" (the default, no `?sort=` param) therefore maps to the connection's own default ordering, not real curation. This is an honest, documented simplification, not an oversight — a genuinely curated "Featured" ordering for category pages would need either a per-category Collection (which would conflate Category and Collection, violating D-007) or a metafield-based ranking system, neither justified until a real merchandising need exists. `PROJECT.md` §34's exact four sort options (Featured, Newest, Price Low→High, Price High→Low) are still all implemented and selectable, honoring the product spec's vocabulary even though "Featured" isn't yet doing more than the API default.

### File structure

```
app/(storefront)/
  new/page.tsx
  tops/page.tsx
  tops/[subcategory]/page.tsx
  bottoms/page.tsx
  bottoms/[subcategory]/page.tsx
  etc/page.tsx
  etc/[subcategory]/page.tsx

components/catalog/
  CategoryListing.tsx   — Server Component shared by all 7 routes: resolves taxonomy, parses filters, calls getProducts, renders FilterBar + ProductGrid + empty/no-match states
  ProductGrid.tsx        — Server Component: periodic large/standard layout over ProductListItem[]
  ProductCard.tsx        — Server Component: image (+ hover crossfade to a 2nd image via pure CSS), name, SOLD OUT badge, links to /products/[handle]
  FilterBar.tsx           — Server Component: Sort as plain links (aria-current on the active one), Availability + Price as one native GET <form>

lib/catalog/
  taxonomy.ts     — getCategoryProductTypes(category), getSubcategoryProductType(category, subcategory), derived from NAVIGATION
  filters.ts       — parseCatalogFilters(searchParams, defaultSort), buildProductSearchQuery(...), buildFilterHref(...), hasActiveFilters(...)
  grid-layout.ts    — getGridItemLayout(index): 'featured' | 'standard'

lib/shopify/
  queries/products.ts   — ADD: GET_PRODUCTS_QUERY (new export; GET_PRODUCT_QUERY/GET_PRODUCTS_BY_COLLECTION_QUERY untouched)
  products.ts             — ADD: ProductListItem interface + getProducts() (new exports; ProductSummary/ProductDetail/getProduct/getProductsByCollection untouched — different query shape, no shared consumer yet, safer to keep fully independent)
```

`ProductListItem` differs deliberately from the existing `ProductSummary` (used only by the untouched `getProductsByCollection`): it carries `availableForSale: boolean` (for the Availability filter and the SOLD OUT badge — `PROJECT.md` §40 requires sold-out products to stay visible with that treatment *regardless* of whether the Availability filter is active) and `images: ProductImage[]` (0–2, for the card's hover crossfade), rather than a single `image`.

### Filters are zero-JavaScript: Links and a native GET form, not a client component

Sort, Availability, and Price are all expressed as URL search params (`?sort=newest&available=1&minPrice=50&maxPrice=200`), parsed server-side in `CategoryListing` from the page's `searchParams` prop. Because every option is either a small fixed set (Sort) or a two-field numeric range (Price) plus one boolean (Availability), the entire `FilterBar` is buildable with:

- **Sort:** four plain `<Link>`s (Featured/Newest/Price ↑/Price ↓), each pointing to the current path with `sort` set and every *other* active param preserved (`buildFilterHref`, a pure, unit-tested function). The active one gets `aria-current="true"` and a forest-green underline — a deliberate, sparing use of the accent color for a genuine selection state, per `DESIGN_SYSTEM.md` §5's "green should often indicate selection" guidance, not decoration.
- **Availability + Price:** one native `<form method="get">` — a checkbox (`available`) and two number inputs (`minPrice`/`maxPrice`, reusing the existing `Input` component) plus a hidden input carrying the current `sort` so applying price/availability doesn't reset it, and a submit `Button` (`variant="secondary"`, existing component). No `onChange`/`onSubmit` handler at all — the browser's own GET-form navigation updates the URL and the server re-renders.

This needs zero client components, zero new JavaScript bundle weight, works with JavaScript disabled, and is fully keyboard/screen-reader native (real `<form>`/`<input>`/checkbox semantics) — directly serving `CLAUDE.md`'s "avoid unnecessary client-side JavaScript"/"avoid unnecessary client components" guidance about as completely as this feature allows, and reusing `Button`/`Input` rather than inventing new form primitives. `ProductCard`'s hover crossfade is likewise pure CSS (`group`/`group-hover` opacity, matching D-013's "cheapest tier that satisfies the need"), so it stays a Server Component too. **This phase adds no new client components at all.**

`DESIGN_SYSTEM.md` §51's mobile "bottom sheet" treatment is not built this pass — seeded reasoning in DECISIONS.md D-024: a bottom sheet's value is hiding a *large* control set from a small screen, and three simple controls (a handful of links, a checkbox, two number fields) don't yet justify that complexity or its JS cost; it's the natural next step once Size/Color/Collection expand the control set later.

### Empty and no-match states

Two distinct zero-result conditions, using different, deliberately-chosen copy:

- **Genuinely empty category** (no filters active, zero products exist for this category/subcategory): new copy, `NOTHING HERE YET.` — CONTENT.md doesn't enumerate this exact case; this follows its §1 voice rules (concise, confident, restrained, uppercase for editorial-style statements) rather than inventing an off-voice line.
- **Filtered down to zero** (any filter active — sort other than default doesn't count, but availability/min/max price do — and zero results): reuses CONTENT.md §9's existing `NOTHING MATCHES.` (its documented use is "search, no results," which a filtered-to-zero listing is close enough to, in kind, to extend rather than invent a third line) plus a `CLEAR FILTERS` link back to the bare category path.

`hasActiveFilters` (in `lib/catalog/filters.ts`) is the pure, unit-tested predicate that decides which state applies.

### `generateMetadata` uses no Shopify data

Each route's metadata (`<title>${Label} — Esque</title>` + a short static description) is derived purely from the taxonomy (category/subcategory label), not from a product fetch — so metadata correctness never depends on Shopify being configured or reachable, and is genuinely E2E-testable in this pass's no-live-store environment. Full SEO treatment (structured data, canonical URLs, Open Graph images) is Phase 12's job, per Non-Goals.

## Error Handling

Unconfigured/unreachable Shopify calls propagate to the existing `app/error.tsx` boundary — the same, now three-times-established pattern (Shopify commerce-foundation spec's Error Handling section; the access-gate spec's Klaviyo-not-configured handling; its own E2E test explicitly proving this is "the correct, honest behavior, not a workaround"). No new fallback/"catalog unavailable" UI is built here for the same reason it wasn't built for either prior case: it would be redundant with what already exists and already works. An unknown subcategory (`getSubcategoryProductType` returns `null`) calls Next.js's `notFound()` before any Shopify call is attempted — this is a real 404, not an error, and doesn't touch `error.tsx` at all.

## Testing

No live store exists — identical constraint to D-016, applied honestly rather than worked around:

- **Unit (Vitest), fixture-driven:**
  - `lib/catalog/taxonomy.ts` — every real category/subcategory from `NAVIGATION` maps correctly; an unknown category/subcategory returns `null`.
  - `lib/catalog/filters.ts` — `parseCatalogFilters` against missing/malformed/boundary query params (non-numeric price, `minPrice > maxPrice`, unknown `sort` value, `/new`'s different default), `buildProductSearchQuery` against every filter combination (single product type, multiple joined with `OR`, availability, price bounds alone and combined — asserting the exact search-string shape verified against Shopify's real syntax above), `buildFilterHref` preserves untouched params while changing the target one, `hasActiveFilters` true/false cases.
  - `lib/catalog/grid-layout.ts` — `getGridItemLayout` boundary indices (first item, the item just before/at/after the periodic "featured" position).
  - `lib/shopify/products.ts`'s new `getProducts()` — mirrors `getProductsByCollection`'s existing test shape exactly: maps a real-shaped fixture response to `ProductListItem[]`, defaults a missing 2nd image gracefully, throws (not silently empty) on a Storefront API `errors` response, throws the "not configured" error without attempting a request, and — since this function's whole job is translating filter options into query variables — asserts the variables passed to `client.request()` for a given `getProducts` call match what the filter functions above would build.
- **E2E (Playwright)**, everything genuinely reachable without a store:
  - All seven routes exist and are reachable.
  - Each route family, with Shopify unconfigured (the actual current E2E environment — `playwright.config.ts`'s `webServer.env` sets no `SHOPIFY_*` vars), surfaces the `SOMETHING WENT WRONG.` boundary rather than crashing uncleanly or rendering wrong content — mirrors the existing Klaviyo-not-configured test precedent exactly.
  - An unknown subcategory (e.g. `/tops/not-a-real-subcategory`) shows the branded 404 — fully testable, since taxonomy resolution happens before any Shopify call.
  - `Header`/`FullScreenMenu`'s `TOPS`/`BOTTOMS`/`ETC.`/`NEW` links now navigate to the real routes (extending the existing "clicking NEW navigates" test to the other three, which previously had nowhere real to go).
  - Each route's `<title>` reflects its static, Shopify-independent metadata.
- **Explicitly out of reach this pass** (same shape of limitation D-016 already established for cart/checkout, applied here rather than worked around): whether the grid actually shows the right products in the right order, whether a filter genuinely narrows a real result set, and the two empty/no-match states are not E2E-verifiable without a real, configured, populated Shopify store — an unconfigured store always throws before any of that UI can render. Unit tests carry the correctness burden for the query-building/mapping logic in the meantime; this gap closes naturally once a real store exists, with no rework anticipated (the same fixture shapes already mirror the real generated types).

## New Architectural Decisions to Record

- **D-023**: Category pages query Shopify's root `products` connection filtered by `product_type` search-syntax clauses (not a Shopify Collection), preserving D-007's Category/Collection separation; the category→product-type taxonomy is derived from the existing `NAVIGATION` data rather than duplicated; "Featured" sort has no true curation at the root-query level and maps to the connection's default ordering as a documented simplification.
- **D-024**: Filters narrowed to Sort, Availability, and Price range this pass; Size, Color, and Collection filters deferred (no real size/color taxonomy exists yet; only one real collection exists to filter against); the mobile bottom-sheet filter treatment is likewise deferred until a larger control set justifies it. Filters are implemented as zero-JavaScript Links/a native GET form rather than a client component.
- **D-025**: Predictive full-screen search (ROADMAP.md Phase 4) deferred in full — its correctness is fundamentally about relevance/ranking quality against a real catalog (unlike a category grid's correctness, which is fully specified by "does it show the right products" and is verifiable with a handful of fixtures), so it cannot be meaningfully verified without a live, populated store.

## Explicitly Open / Out of Scope for This Spec

- Confirming the real Shopify store's `productType` field values match `NAVIGATION`'s subcategory labels exactly — cannot be verified without a live store; flagged as a risk to check when one exists, mirroring the existing metafield-namespace caveat.
- Search, Size/Color/Collection filters, Collection identity pages, PDP, Quick Add, the custom cursor, structured data/sitemap — see Non-Goals above; each belongs to a later, already-named ROADMAP phase.
- Whether `products(query:)`'s implicit-`AND`-via-juxtaposition behaves identically to an explicit `AND` in every edge case — this pass always emits explicit `AND`/`OR`/parentheses in `buildProductSearchQuery`, never relying on the implicit form, precisely to avoid needing to resolve that ambiguity.

# Esque — Search (predictive, full-screen overlay)

Resolves ROADMAP.md Phase 4's "Search (predictive, full-screen overlay)" — deferred in full by DECISIONS.md D-025. Companion docs: [PROJECT.md §33](../../../PROJECT.md#33-search) (what search must support), [DESIGN_SYSTEM.md §50](../../../DESIGN_SYSTEM.md#50-search) (the overlay/interaction spec), [CONTENT.md §9](../../../CONTENT.md#9-search-copy) (copy), [DECISIONS.md D-025](../../../DECISIONS.md) (what was deferred and why), D-023/D-024 (the query-architecture and zero-JS-filter precedents this either follows or deliberately departs from), D-038/D-039 (shared-element transitions — a real collision risk this spec must avoid), D-055 (analytics taxonomy), D-057 (Demo Mode).

## Context

D-025 deferred search in full because "predictive search's entire value proposition — relevance/ranking quality against a real catalog... is fundamentally about live-store interaction," while noting the mechanism itself — a real, typed query against Shopify's `predictiveSearch` root query — "could be wired and type-verified without a store." No real Shopify store exists now either (same constraint every phase has faced). This spec builds that real mechanism: a full-screen overlay, a debounced input, a real Shopify predictive-search query, real local taxonomy matching, keyboard operability matching `FullScreenMenu`'s proven accessibility mechanics, and honest loading/empty/error states — verified against a typed client and fixture data. Ranking/relevance quality against a real, populated catalog remains unverifiable here, exactly as D-025 said, and this spec does not claim otherwise.

## Goals

- Header's `SEARCH` control opens a real full-screen search overlay (DESIGN_SYSTEM.md §50), replacing `ComingSoonNotice`'s "ARRIVING SOON." stub for that one control.
- Results populate as the visitor types (PROJECT.md §33: "should feel instantaneous"; example: "hoo" → Hoodie matches), grouped as DESIGN_SYSTEM.md §50 specifies: **PRODUCTS** (image + name) and **CATEGORIES** (e.g. "Tops / Hoodies").
- A real, typed Storefront API query (`predictiveSearch`) backs the PRODUCTS group. A real, local, taxonomy-derived match backs CATEGORIES.
- Full keyboard operability, focus trap, Escape-to-close, reduced-motion, and an inert background — mirroring `FullScreenMenu.tsx`'s already-reviewed mechanics rather than reinventing them.
- Loading, empty (`NOTHING MATCHES.`), error (network/API failure), and populated states, each real and independently correct.
- Real `trackEvent` calls for PROJECT.md §82's Discovery category ("Search queries, no-result searches").
- Demo Mode (`PREVIEW_DEMO_MODE`) covers the new product-search path, so the project owner's local preview can demonstrate a working, populated search.

## Explicit Non-Goals (deferred, or out of scope, with reasons)

- **COLLECTIONS as a third result group.** DESIGN_SYSTEM.md §50 lists a `COLLECTIONS — Collection 001` group; this is not built. Two independent, sufficient reasons: (1) no `/collections/[handle]` route exists anywhere in this codebase (ARCHITECTURE.md §3 still lists it unbuilt) — a collection result would have no honest destination to link to, and (2) only one real collection exists in the committed launch catalog, the same "nothing to prove this isn't just returning everything" reasoning D-024 already used to defer a Collection *filter*. Building a result group that either 404s or always resolves to "the whole catalog" is worse than not building it. `predictiveSearch` is queried with `types: [PRODUCT]` only — Collections/Pages/Articles are never requested, not silently dropped after the fact.
- **A dedicated `/search` results page.** DESIGN_SYSTEM.md's spec is exclusively about the full-screen overlay; nothing describes a "press Enter to see a full results page" pattern, and PROJECT.md never asks for search-engine-indexable search-results pages (which would raise their own thin-content SEO questions). The overlay is the complete experience. Enter does not submit/navigate; there is no `<form>`.
- **Relevance/ranking quality.** Per D-025 and this task's own framing: unverifiable without a real, populated catalog. What's verified here is that the real query is constructed correctly and the typed client maps its response correctly — not that Shopify's own relevance scoring is "good" against six placeholder SKUs.
- **Search history / recent searches / query suggestions.** `predictiveSearch` exposes a `queries` (query-suggestion) result type; not requested. No spec text asks for it, and it has no obvious destination UI without inventing one.
- **Debounce via a new dependency (SWR, react-query, lodash).** No data-fetching library exists anywhere in this codebase. A single debounced `fetch` with `AbortController` is a well-understood, dependency-free pattern and is the only call site that would use one — introducing a library for it would be the kind of "dependency merely for convenience" CLAUDE.md warns against.

## Architecture

### Trigger: Header's SEARCH control, state owned by ShellClient

`ShellClient.tsx` already owns `menuOpen`/`menuTriggerRef` for `FullScreenMenu`. It gains the identical pair for search: `searchOpen`/`searchTriggerRef`, passed to `Header` (which gains `searchOpen`, `onSearchOpen`, `searchTriggerRef` props, mirroring `menuOpen`/`onMenuOpen`/`menuTriggerRef` exactly) and to the new `<SearchOverlay>`, rendered as a sibling to `<FullScreenMenu>`.

The background wrapper's `inert={menuOpen}` becomes `inert={menuOpen || searchOpen}`. This is not just consistency with the existing pattern — it is the mechanism that keeps Menu and Search mutually exclusive: whichever overlay is open, Header's *other* trigger button sits inside the now-inert wrapper and cannot be reached by mouse, touch, or keyboard. No separate "close the other overlay first" logic is needed.

**Header's SEARCH button** stops calling `setComingSoonFeature('SEARCH')` and instead calls `onSearchOpen`, gaining `aria-expanded={searchOpen}`/`aria-controls="esque-search-overlay"` — the same pattern already on the MENU button. `ComingSoonFeature` narrows from `'SEARCH' | 'ACCOUNT' | 'BAG'` to `'ACCOUNT' | 'BAG'`. Verified before making this change: the only other references to the `'SEARCH'` literal in the codebase are two Playwright tests asserting the button's accessible *name* (`getByRole('button', { name: 'SEARCH' })`, in `smoke.spec.ts` and `responsive-audit.spec.ts`) — both keep passing unmodified, since the button's visible text/accessible name is unchanged, only its behavior. One test (`smoke.spec.ts`'s "SEARCH, ACCOUNT, and BAG show an on-brand 'arriving soon' notice when clicked") explicitly asserts SEARCH still shows the stub notice — this assertion is removed (ACCOUNT/BAG keep it) and replaced with real search-overlay coverage in the new `search.spec.ts`. `ComingSoonNotice.tsx`'s file-header comment (which currently says "SEARCH... lands in ROADMAP.md Phase 4") is updated to drop the now-inaccurate claim.

### Overlay mechanics: mirror `FullScreenMenu`, don't reinvent

`components/navigation/SearchOverlay.tsx` reuses the exact accessibility mechanics `FullScreenMenu.tsx` already has (reviewed and hardened across D-035/D-037/D-043):

- `role="dialog"` `aria-modal="true"` `aria-label="Search"` `id="esque-search-overlay"` `data-open={open}` on the container, always mounted (never conditionally rendered) so its own open/close CSS transition and focus-management effects behave identically to `FullScreenMenu`'s.
- The same `hasOpenedRef`-gated open/close effect — but focusing the `<input>` on open (DESIGN_SYSTEM.md §50: "input receives immediate focus"), not a link, and returning focus to `searchTriggerRef` on a genuine open→close transition, never on mount.
- The same `useEffectEvent`-based pathname-close effect (closing on client-side navigation, e.g. a result link's own route change reaching this component via back/forward, exactly mirroring why `FullScreenMenu` needs this — see its own code comment).
- The same hand-rolled Tab-cycle focus trap over `containerRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')` (widened to include `input`, since this dialog's first focusable element is a text field, not a link/button) and the same Escape-to-close `keydown` listener.
- A new open/close CSS class pair, `.esque-search-overlay` / `.esque-search-overlay[data-open='true']`, added to `app/globals.css` with the *identical* visibility/opacity/timing mechanics as `.esque-menu` (400ms open, 280ms close, delayed-visibility-on-close). This deliberately duplicates ~15 lines rather than extracting a shared class: `FullScreenMenu.tsx` is already-shipped, independently reviewed code, and renaming its class to share one with an unrelated new dialog is an unrelated refactor with no functional benefit — CLAUDE.md's "do not modify unrelated code" applies directly. The sitewide `@media (prefers-reduced-motion: reduce)` universal-selector rule already zeroes both classes' transitions with no extra work.

**One deliberate addition beyond `FullScreenMenu`'s pattern:** a real, visible `CLOSE` button (plain uppercase text, matching the MENU/SEARCH/ACCOUNT/BAG vocabulary — no new icon). `FullScreenMenu` never needed one because every visible thing in it is a navigable link (clicking any category both navigates and closes); Search's primary content is an input plus result sections that can be empty, loading, or erroring, so there is no guaranteed clickable escape route for a mouse/touch user who hasn't discovered Escape. This is a genuine interaction-model difference, not a second competing close pattern.

### Query mechanism: `predictiveSearch`, verified against this project's own pinned schema

Verified directly against `lib/shopify/storefront-2026-07.schema.json` (this project's actual pinned Storefront API schema — the same file its codegen validates against, a stronger source than generic docs) before writing any query text, and cross-checked against shopify.dev's live docs:

- `predictiveSearch(query: String!, limit: Int, limitScope: PredictiveSearchLimitScope, searchableFields: [SearchableField!], types: [PredictiveSearchType!], unavailableProducts: SearchUnavailableProductsType): PredictiveSearchResult!` is a real, separate root query (confirmed — this is exactly what D-025 said it was, re-verified rather than trusted from a two-month-old entry). `PredictiveSearchResult.products: [Product!]!` is a plain list (not a paginated connection) — correct for "give me the top N as I type."
- **The `query` argument gets the user's raw, trimmed input, unmodified — no wildcard, no `field:"value"` clause syntax.** This is a deliberate, different construction path from `lib/catalog/filters.ts`'s `buildProductSearchQuery` (which builds structured clauses for the *different* root `products(query:)` connection). Evidence: the schema's own field description (present verbatim in the local schema file, not just the public docs) states `predictiveSearch` "returns suggested results as customers type... matches products... based on partial search terms" — partial-term matching is documented as *inherent* to this field, unlike the general search-syntax grammar (`shopify.dev/docs/api/usage/search-syntax`, fetched directly — confirmed it never mentions `predictiveSearch` at all, and confirms prefix matching on the *general* grammar needs an explicit `*`). The plain `search` root query (a different field again, not used here) even has its own separate `prefix` argument for opting into partial-word matching — further confirming that field's default behavior is exact-term matching, unlike `predictiveSearch`'s documented-as-inherent partial matching. Manually appending a wildcard to `predictiveSearch`'s query would be solving a problem this field doesn't have.
- `types: [PRODUCT]` — explicit, always. `searchableFields` and `unavailableProducts` are **not** overridden: the schema's own field description for `searchableFields` says outright "For the best search experience, you should search on the default field set" (TITLE, PRODUCT_TYPE, VARIANT_TITLE, VENDOR — already covers PROJECT.md §33's "product name" and "category" at the product-data level); `unavailableProducts`' documented default, `LAST` ("show unavailable products after all other matching results"), already matches this site's own established never-hide-sold-out-inventory pattern (`ProductCard`'s SOLD OUT badge) better than either alternative. Using the documented defaults instead of guessing our own values is itself the verified-not-assumed choice.
- `limit: 6` (schema max is 10) — a deliberate restraint choice (DESIGN_SYSTEM's minimal aesthetic; "populate instantly" reads better with a small, fast set than a long list), not a limitation of the field.

New query (`lib/shopify/queries/products.ts`, alongside the existing two product queries in that file — a third product-shaped query document, not a new file, matching how that file already groups `GET_PRODUCT_QUERY`/`GET_PRODUCTS_BY_COLLECTION_QUERY`/`GET_PRODUCTS_QUERY` together):

```graphql
query PredictiveSearch($query: String!, $limit: Int) {
  predictiveSearch(query: $query, limit: $limit, types: [PRODUCT]) {
    products {
      id
      handle
      title
      productType
      tags
      availableForSale
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 2) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
}
```

Field selection is byte-for-byte the same shape `GET_PRODUCTS_QUERY` already selects, so the new fetch function maps to the *same* `ProductListItem` interface `getProducts` already returns — no new product-shaped type, and direct `ProductCard` reuse (see below).

`lib/shopify/products.ts` gains `searchProducts(query: string, options?: { limit?: number }): Promise<ProductListItem[]>`, following this file's existing docstring/error-handling conventions exactly: throws via `toRequestError` on a real Storefront API error (never swallowed — this file's established contract), returns `[]` for a blank/whitespace-only query without ever calling `getStorefrontClient()` (so it's never a "Shopify not configured" error for an empty search), and gets the same `PREVIEW_DEMO_MODE` short-circuit `getProduct`/`getProducts` already have (see Demo Mode below). This function's error contract intentionally differs in one respect from every existing fetch function in this file: those are called from Server Components whose thrown errors are meant to propagate to `app/error.tsx`. `searchProducts` is called from a Route Handler (below) with no page-level error boundary to propagate to, and — critically — `SearchOverlay` is mounted on *every* page simultaneously (inside `ShellClient`), so a real design decision is needed about where a Shopify failure surfaces; see Error Handling.

### Categories: real, local, and free — no Shopify round-trip

`lib/catalog/taxonomy.ts` gains `searchCategories(query: string, limit = 6): { label: string; href: string }[]` — pure, synchronous, zero I/O, reusing the *same* `NAVIGATION` data every other taxonomy function already reads. For each `NAVIGATION` entry whose `href` is a real, built route:

- If the entry's own label matches (case-insensitive substring), add `{ label: entry.label, href: entry.href }` (e.g. typing "top" → `TOPS` → `/tops`).
- Independently, for each of its subcategories whose label matches, add `{ label: `${entry.label} / ${sub.label}`, href: sub.href }` (e.g. typing "hoo" → `TOPS / Hoodies` → `/tops/hoodies` — the exact DESIGN_SYSTEM.md §50 worked example, verified to produce exactly this one match and no others against the real `NAVIGATION` data).

"Real, built route" reuses `app/sitemap.ts`'s existing `BUILT_CATEGORY_HREFS` allowlist (`/new`, `/tops`, `/bottoms`, `/etc` — excluding the real-but-unbuilt `/collections`/`/about` entries `NAVIGATION` also lists) rather than a second, independently-drifting copy of the same knowledge. Since `lib/` must not depend on `app/` (D-053's established rule), `BUILT_CATEGORY_HREFS` moves *into* `lib/catalog/taxonomy.ts` (which already owns every other piece of NAVIGATION-derived taxonomy logic — its natural, more-correct home) and `app/sitemap.ts` imports it from there instead of defining its own copy. Pure relocation, no behavior change to the sitemap.

Because this is pure computation with no network dependency, it runs synchronously in the client component on every keystroke (via `useMemo`, not an effect — nothing to derive-in-an-effect here) — genuinely, not just aesthetically, instantaneous, and entirely unaffected by whether Shopify (or Demo Mode) is configured.

### Debouncing and predictive behavior: DESIGN_SYSTEM.md §50's exact model

DESIGN_SYSTEM.md §50 specifies results-as-you-type, not submit-to-search — there is no submit button, no `<form>`, and Enter does nothing. `SearchOverlay` holds `query` as ordinary controlled state (a live-typing field has no discrete "submission moment" to protect the way `AccessForm`'s password field does — D-022's uncontrolled-input-plus-`FormData` pattern solves a different problem, a race at one atomic submission instant, that doesn't exist here; a controlled input is the correct tool for a value that must react to every keystroke, not a second competing pattern for the same responsibility).

- `MIN_QUERY_LENGTH = 2` — below this, no fetch fires and no result sections render at all (just the initial `SEARCH ESQUE` state). A one-character query is not yet a real search attempt; this is a judgment call in the same spirit as D-028's scarcity thresholds (the spec doesn't pin an exact number, so one is chosen and recorded rather than left implicit).
- `DEBOUNCE_MS = 200` — INTERACTIONS.md §3's "Standard UI" tier is 200-350ms for this exact class of interaction ("filter, menu item, quick add"); 200ms is the tier's fast end, chosen because DESIGN_SYSTEM.md §50 specifically calls for search to "feel instantaneous," a stronger framing than ordinary UI transitions.
- Only the **PRODUCTS** section is debounced/network-backed. **CATEGORIES** results are derived synchronously on every render via `useMemo(() => searchCategories(trimmedQuery), [trimmedQuery])` — they appear with zero latency, a beat ahead of PRODUCTS, which is the correct and better UX (the free, local part of the answer shouldn't wait on the network-backed part), not an inconsistency.
- The debounced product fetch: a `setTimeout` (cleared on every keystroke) wrapping a `fetch('/api/search?q=...')` bound to an `AbortController`, whose cleanup both clears the timer and aborts any in-flight request — so a fast typist never has an earlier, slower response clobber a later, faster one. An aborted fetch's rejection is distinguished from a genuine failure via `controller.signal.aborted` before setting an error state.
- Closing the overlay resets `query` to `''`, so reopening always starts fresh (matching this project's few other modal-like surfaces, none of which persist state across a close/reopen) and — as a direct side effect of `trimmedQuery` dropping below `MIN_QUERY_LENGTH` — correctly aborts any in-flight request and returns the products section to idle with no extra code.

### UI: overlay layout and `ProductCard` reuse

```
[dialog, fixed inset-0]
  CLOSE (top-right, plain uppercase text button)
  <input type="search"> — large typography, placeholder "SEARCH ESQUE" (CONTENT.md §9),
    a real sr-only <label> ("Search") for its accessible name (a placeholder alone is not
    a label), autoComplete="off" (suppresses the browser's own competing autocomplete list)
  [results region, aria-live="polite" aria-atomic="true"]
    CATEGORIES  (small uppercase utility-weight label, only rendered if non-empty)
      - list of <Link>s, one per searchCategories() match
    PRODUCTS  (same label style, only rendered once a fetch has actually started)
      - loading: 3 pulsing skeleton blocks (aspect-[4/5] bg-esque-surface animate-pulse,
        matching ProductCard's own image-container shape — PROJECT.md §88's "skeleton
        states", a materially better fit here than a page-wide pulsing ESQUE wordmark,
        which is app/loading.tsx's *route-transition* treatment, not an inline-widget one)
      - error: "SOMETHING WENT WRONG." (app/error.tsx's exact established copy — this
        project's one real "network failure" phrase, PROJECT.md §87) + a Retry button
        that re-runs the current query
      - loaded: a small grid of real <ProductCard> instances (layout="standard",
        enableSharedTransition deliberately omitted/false — see below), one per result
    "NOTHING MATCHES." (CategoryListing.tsx's exact existing treatment — font-display
      text-heading-3 uppercase text-esque-text, centered — reused verbatim, not
      reinvented) — shown only once products has genuinely settled to zero results
      AND categories is empty; never shown while products is still loading or erroring
```

**`ProductCard` is reused directly for PRODUCTS results, not a new component.** DESIGN_SYSTEM.md §50 wants "image + name" per result, and `ProductCard`'s default state is exactly that (PROJECT.md §37: "Price does not have to be visible" — already the default). Reusing it gets a real, already-tested, already-accessible `<Link>` (focus ring, `data-cursor="VIEW"`, alt text, the SOLD OUT badge for `unavailableProducts: LAST` results) for free, and is squarely what CLAUDE.md's "reuse existing components" calls for.

**`enableSharedTransition` is deliberately left at its default (`false`) here — this is a real, concrete collision, not a hypothetical one.** `SearchOverlay` is mounted inside `ShellClient`, present on *every* page. If a visitor opens Search while already on, say, `/tops` (whose `ProductGrid` renders every card with `enableSharedTransition` on, per D-038), and a predictive result resolves to the *same* product already visible in that page's own (still-mounted, merely `inert`-covered, not unmounted) grid, enabling the transition on the search result too would mount two `<ViewTransition>` components with the *same* `name` at the same time — exactly the failure D-038 already reproduced and designed `ProductCard`'s opt-in default around ("There are two `<ViewTransition name=...>` components with the same name mounted at the same time... will cause View Transitions to error"). `SearchOverlay` is a second, new case of the same risk D-038 first found for `SelectedPieces`/the Interactive Model — see Decisions.

### Route: `app/api/search/route.ts` (this codebase's first Route Handler)

A client component cannot call `getStorefrontClient()`/`searchProducts()` directly — Shopify access lives server-side only, exactly like every other fetch function in this codebase, called only from Server Components or Server Actions today. A live, debounced, cancelable, per-keystroke read is a different responsibility from this project's existing Server-Action call sites (`AccessForm`/`RequestAccessForm`'s discrete, single-submission mutations) — a plain `GET` Route Handler, fetched from the client with a real `AbortSignal`, is the idiomatic tool for a cancelable on-demand read, and is exactly what `proxy.ts`'s matcher already anticipates: `/api` (and any sub-path) is *already* excluded from the access-gate redirect, with a comment reading "route handlers, if any need to bypass the gate" — this is that need, arriving on schedule, with zero changes required to `proxy.ts`.

Confirmed directly against this project's installed Next 16.3.1 (`node_modules/next/dist/docs/.../route.md`): "`v15.0.0-RC` | The default caching for `GET` handlers was changed from static to dynamic" — so no `export const dynamic` override is needed; reading `request.nextUrl.searchParams` on every request is already dynamic-by-default behavior at this pinned version, well before Cache Components (confirmed disabled, D-052) would change that story.

```ts
// app/api/search/route.ts
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) return NextResponse.json({ products: [] });
  try {
    const products = await searchProducts(query);
    return NextResponse.json({ products });
  } catch (error) {
    console.error('[api/search]', error);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}
```

`MAX_QUERY_LENGTH` (100) is defensive input hygiene (CLAUDE.md: "treat all external input as untrusted... validate and sanitize"), not a security boundary in the injection sense — `query` is a real GraphQL variable, not string-concatenated into the query document, so there is no query-injection surface here regardless. The caught error's real message is logged server-side only (`console.error`) and never forwarded to the client response, matching `app/error.tsx`'s own "never show the user the real error, always log it" pattern (CLAUDE.md: "do not expose sensitive internal details to end users").

## Error Handling

Two genuinely different failure surfaces exist, and this spec keeps them genuinely different rather than collapsing them:

1. **A category-page/PDP Shopify failure today** propagates to `app/error.tsx`, taking over the whole page — correct there, because the commerce data *is* that page's entire reason for existing (ARCHITECTURE.md §1).
2. **A search-products failure** is caught inside `SearchOverlay` and rendered as a small, scoped, in-place error message with Retry — deliberately *not* allowed to propagate to `app/error.tsx`. `SearchOverlay` is mounted on every page at once; letting a search failure crash whatever page the visitor happened to have open (the homepage, a legal page, anywhere) would be a wildly disproportionate blast radius for a self-contained utility widget failing, and is not what "never swallow a real error" is actually protecting against. This is not the same shape of exception as D-033's (which suppresses a real error into a *silent*, indistinguishable-from-empty result) — the error here stays fully visible, distinguishable from "no results," and actionable (Retry), it is simply scoped to the failing subtree instead of the whole document, which is the correct layer for an always-mounted, cross-page widget (the nearest real equivalent of a page-level error boundary, applied at the right boundary for this component's actual lifetime).

`NOTHING MATCHES.` and the error state are mutually exclusive and never conflated, per PROJECT.md §87's own explicit distinction between "no results" and "network failure" copy — `NOTHING MATCHES.` renders only once the products fetch has genuinely settled to zero results (not while loading, not while erroring).

## Analytics

`lib/analytics/events.ts` gains one new event, reusing GA4's own standard recommended event **exactly** where it's an honest match — the same test D-055 already established for `view_item` (use the standard name when nothing is misrepresented; invent a custom one when it would be, as with `add_to_bag_click`). Verified directly against Google's current GA4 recommended-events reference before choosing this: `search` is a real, standard GA4 event with one required parameter, `search_term: string`. No mismatch exists here — a real search genuinely was performed — so the standard name and parameter are used rather than invented:

```ts
search: {
  search_term: string;
  // Folds "no-result searches" (PROJECT.md §82) into this event's own
  // payload rather than a second event — the same minimal-modeling
  // choice D-055 made for view_item's `sold_out` boolean.
  result_count: number;
}
```

Fired once per settled (debounced, resolved) query — not per keystroke — with `result_count` equal to `products.length + categoryResults.length`, matching exactly what the UI itself treats as "nothing matches" (`result_count === 0`), so the analytics signal and the visible empty state can never disagree. This directly satisfies PROJECT.md §82's Discovery category line ("Search queries, no-result searches") without inventing a second event for the second half of that line.

## Demo Mode

`searchProducts` gets the same `PREVIEW_DEMO_MODE` short-circuit `getProduct`/`getProducts` already have, filtering `PREVIEW_PRODUCTS` by a case-insensitive substring match against `title`/`productType` (mirroring `getProducts`' own existing Demo Mode filter style) rather than leaving Search silently non-functional in Demo Mode — this is the "fast, obviously-correct follow-on" the task anticipated, done now rather than deferred, since it is a small, mechanical extension of an already-established pattern in the same file. `searchCategories` needs no Demo Mode branch at all — it has no Shopify dependency in either mode, real or demo.

## Testing

- **Unit (`lib/catalog/taxonomy.test.ts`, extended):** `searchCategories` — the exact DESIGN_SYSTEM.md "hoo" → `TOPS / Hoodies` example; a top-level-only match (e.g. "new" → `NEW`); no match; case-insensitivity; a query below `MIN_QUERY_LENGTH`'s effective floor returns `[]`; `/collections`/`/about` never match despite being real `NAVIGATION` entries.
- **Unit (`lib/shopify/products.test.ts`, extended):** `searchProducts` — variables passed to `client.request` (query trimmed, `limit`, no `searchableFields`/`unavailableProducts` override), response mapping to `ProductListItem[]`, throws via `toRequestError` on a real GraphQL error, returns `[]` for blank input without calling `getStorefrontClient()` at all (mirrors this file's existing "never calls the client" assertions for other short-circuit branches), and the two new Demo Mode cases (a real substring match against fixture titles/types; no match falls back to `[]`, not the full fixture list — deliberately the opposite fallback from `getProducts`' Demo Mode, which returns everything on a non-matching filter, because a real "no results" is exactly a state search must be able to demonstrate).
- **Unit (`app/api/search/route.test.ts`, new):** mocks `searchProducts`; asserts the `q` param is parsed/trimmed/length-capped, a blank query short-circuits to `{ products: [] }` without calling `searchProducts`, a thrown error becomes a `500` with a generic body (never the real error message), and a success becomes `{ products }` at `200`.
- **E2E (`tests/e2e/search.spec.ts`, new):** opens via the real SEARCH button; `role="dialog"`/`aria-modal`/immediate input focus; Escape closes and returns focus to the SEARCH trigger; Tab-cycle focus trap; Menu and Search are mutually exclusive (opening one makes the other's trigger unreachable); a category-matching query (e.g. "hoodie") shows a real, correct, clickable `TOPS / Hoodies` result — genuinely verifiable end-to-end in this Shopify-unconfigured environment, since category matching has no Shopify dependency; the products section shows its scoped error state (not the page-level `SOMETHING WENT WRONG.` boundary) given this environment's genuinely unconfigured Shopify client, and Retry re-attempts; a query below `MIN_QUERY_LENGTH` shows neither section; reduced-motion is respected (mirrors `reduced-motion-audit.spec.ts`'s existing technique). What this suite cannot verify, honestly: real product-search relevance/ranking against a populated catalog (D-025's own original limitation, unchanged) — only that the mechanism is wired, typed, and fails/succeeds honestly.
- **Existing tests updated:** `smoke.spec.ts`'s combined "arriving soon" test drops its SEARCH assertion (ACCOUNT/BAG unchanged).

## New Architectural Decisions to Record

DECISIONS.md entries starting at D-058 (continuing after D-057):

- Predictive search built via `predictiveSearch` (not `products(query:)`/`search`), raw query text (no manual wildcard), `types: [PRODUCT]` only, documented defaults kept for `searchableFields`/`unavailableProducts` — resolving D-025.
- COLLECTIONS result group deliberately not built (no destination route, single-collection catalog) — same reasoning class as D-024's deferred Collection filter, applied to a new surface.
- `enableSharedTransition` deliberately omitted on search-result `ProductCard`s — a second, concrete instance of the exact collision D-038 first identified, now reproducible via a second always-mounted surface.
- Search-products errors are caught and scoped inside `SearchOverlay`, deliberately not propagated to `app/error.tsx` — distinguished from D-033's different "swallow into silent empty" exception.
- `BUILT_CATEGORY_HREFS` relocated from `app/sitemap.ts` into `lib/catalog/taxonomy.ts` (single source of truth, `lib/` must not depend on `app/`) — a small, directly-necessitated move, not a speculative refactor.
- Demo Mode extended to `searchProducts`.

## Explicitly Open / Out of Scope for This Spec

- Real relevance/ranking verification (needs a real, populated store — D-025's own unchanged limitation).
- A `/collections/[handle]` route and the COLLECTIONS result group it would unlock.
- Query suggestions (`predictiveSearch.queries`) and search history/recent-searches.
- Rate-limiting `/api/search` — a low-severity concern for a pre-launch, six-SKU catalog with no other precedent anywhere in this codebase; revisit if real traffic patterns ever justify it.

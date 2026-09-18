# Search Implementation Plan

Implements `docs/superpowers/specs/2026-09-18-search-design.md`. Read that spec in full before starting — it resolves every open question below (query construction, why `enableSharedTransition` stays off, why errors are scoped locally, why COLLECTIONS isn't built). This plan is task-by-task execution detail, not a re-derivation of the reasoning.

## Global Constraints

- Follow existing file/module conventions exactly: colocated `.test.ts` next to every new pure module, the same docstring style already in `lib/shopify/products.ts`/`lib/catalog/taxonomy.ts`.
- No new dependencies. No jsdom/component-testing harness — this codebase's unit tests run in a Node-only vitest environment (no DOM); component/interaction behavior is Playwright-only.
- Every new/changed file must pass `pnpm format:check`, `pnpm lint`, `pnpm typecheck` individually as you go — don't wait until the end to discover a systemic issue.
- Run `pnpm graphql-codegen` after adding the new query document (Task 2) and commit the regenerated `lib/shopify/storefront.generated.d.ts` (per DECISIONS.md D-017 — `storefront.types.d.ts` and the `.schema.json` cache should be unaffected since the schema itself hasn't changed, only the set of documents; if `storefront.types.d.ts` changes anyway, that's fine, commit it too — do not hand-edit either generated file).

---

### Task 1: Category search (`lib/catalog/taxonomy.ts`)

1. Move `app/sitemap.ts`'s `BUILT_CATEGORY_HREFS` constant into `lib/catalog/taxonomy.ts`, exported, comment carried over (adjusted for its new home — it's no longer "which NAVIGATION entries are in the sitemap," it's "which NAVIGATION entries correspond to a route that actually exists," used by both the sitemap and search):

```ts
// Which top-level NAVIGATION entries correspond to a route that actually
// exists this far into the roadmap — NAVIGATION also lists /collections
// and /about (ROADMAP.md Phase 10/11+, not built yet). Read by
// app/sitemap.ts (which routes to list) and searchCategories below (which
// routes a search result may link to) — a single source of truth rather
// than two lists that could drift. Needs a new entry the day either of
// those ships as a real route.
export const BUILT_CATEGORY_HREFS = new Set(['/new', '/tops', '/bottoms', '/etc']);
```

Update `app/sitemap.ts` to `import { BUILT_CATEGORY_HREFS } from '@/lib/catalog/taxonomy'` instead of defining its own copy. No other change to `sitemap.ts` — same filter logic, same output. Re-run `catalog.spec.ts`/existing sitemap Playwright coverage mentally: nothing about the sitemap's *content* changes, only where the constant lives.

2. Add to `lib/catalog/taxonomy.ts`:

```ts
export interface CategorySearchResult {
  label: string;
  href: string;
}

/**
 * Local, zero-I/O category/subcategory search — matches the user's typed
 * query against real, already-built NAVIGATION routes only (see
 * BUILT_CATEGORY_HREFS above). Case-insensitive substring match, checked
 * independently against a category's own label and each of its
 * subcategory labels, so both can match the same query (e.g. "s" could
 * match many things; callers are expected to gate on a minimum query
 * length before calling this — see SearchOverlay.tsx). Deliberately no
 * Shopify dependency: this never needs Demo Mode or a real store to work
 * correctly. See DECISIONS.md D-0XX and the design spec's Architecture
 * section for why this exists instead of a Shopify-side category concept.
 */
export function searchCategories(query: string, limit = 6): CategorySearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: CategorySearchResult[] = [];
  for (const entry of NAVIGATION) {
    if (!BUILT_CATEGORY_HREFS.has(entry.href)) continue;
    if (entry.label.toLowerCase().includes(q)) {
      results.push({ label: entry.label, href: entry.href });
    }
    for (const sub of entry.subcategories ?? []) {
      if (sub.label.toLowerCase().includes(q)) {
        results.push({ label: `${entry.label} / ${sub.label}`, href: sub.href });
      }
    }
  }
  return results.slice(0, limit);
}
```

3. Tests in `lib/catalog/taxonomy.test.ts` (new `describe('searchCategories', ...)` block, alongside the existing ones — don't touch the existing tests): the "hoo" → exactly one result, `{ label: 'TOPS / Hoodies', href: '/tops/hoodies' }`; "new" → exactly one result, `{ label: 'NEW', href: '/new' }`; "top" → includes `{ label: 'TOPS', href: '/tops' }` (top-level match) and does not spuriously also match unrelated subcategories; a query matching nothing real (e.g. "zzz") → `[]`; case-insensitivity ("HOO" behaves like "hoo"); `''`/whitespace-only → `[]`; a query that would textually match "COLLECTIONS" or "ABOUT" (e.g. "collect", "abo") → `[]`, proving the `BUILT_CATEGORY_HREFS` gate actually excludes them, not just that no test happens to try them; `limit` is respected (construct a query loose enough to match more than `limit` entries and assert the array length).

---

### Task 2: Predictive product search (`lib/shopify/queries/products.ts`, `lib/shopify/products.ts`)

1. Add to `lib/shopify/queries/products.ts` (after the existing three queries, same file):

```ts
// predictiveSearch — a distinct root query from the plain `products`
// connection above, purpose-built for type-ahead: its own field
// description states it matches results "based on partial search terms"
// as inherent behavior, so `$query` below receives the raw, trimmed,
// user-typed string, never a field:"value" clause. types: [PRODUCT] is
// hardcoded (not a variable) since this call site never varies it —
// Collections/Pages/Articles are deliberately never requested (see
// DECISIONS.md D-0XX). searchableFields/unavailableProducts are
// deliberately omitted to use Shopify's own documented defaults — see the
// design spec's Architecture section for why. Field selection mirrors
// GET_PRODUCTS_QUERY's node shape exactly so both map to the same
// ProductListItem interface.
export const GET_PREDICTIVE_SEARCH_QUERY = `#graphql
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
`;
```

2. Run `pnpm graphql-codegen` now (before writing `searchProducts`) so its generated types exist to write against — matching this codebase's real workflow, not writing the consumer first and hoping the types line up.

3. Add to `lib/shopify/products.ts` (after `getProducts`, same file — import `GET_PREDICTIVE_SEARCH_QUERY` alongside the existing two query imports at the top):

```ts
export interface SearchProductsOptions {
  limit?: number;
}

/**
 * Predictive product search for the full-screen search overlay — a
 * distinct query path from getProducts (see DECISIONS.md D-0XX and the
 * design spec). Returns [] for a blank/whitespace-only query without ever
 * calling getStorefrontClient() — an empty search is not a "Shopify not
 * configured" error. Throws via toRequestError on a real Storefront API
 * error, exactly like every other fetch function in this file — never
 * swallowed here; the caller (app/api/search/route.ts) decides how to
 * surface that to its own client, since this function has no page-level
 * error boundary to rely on the way a Server Component caller would.
 */
export async function searchProducts(
  query: string,
  options: SearchProductsOptions = {},
): Promise<ProductListItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const limit = options.limit ?? 6;

  // Demo Mode short-circuit — DECISIONS.md D-057, extended by D-0XX. Same
  // never-calls-getStorefrontClient() contract as getProduct/getProducts.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const q = trimmed.toLowerCase();
    return PREVIEW_PRODUCTS.filter(
      (p) => p.title.toLowerCase().includes(q) || p.productType.toLowerCase().includes(q),
    ).slice(0, limit);
  }

  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_PREDICTIVE_SEARCH_QUERY, {
    variables: { query: trimmed, limit },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const products = data?.predictiveSearch?.products ?? [];
  return products.map((node) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    productType: node.productType,
    tags: node.tags,
    minPrice: node.priceRange.minVariantPrice,
    availableForSale: node.availableForSale,
    images: node.images.edges.map(({ node: image }) => ({
      url: image.url,
      altText: image.altText ?? null,
      width: image.width ?? null,
      height: image.height ?? null,
    })),
  }));
}
```

Double-check the generated type for `predictiveSearch`'s return shape matches this mapping exactly (field names, nullability) — adjust the mapping, not the generated file, if anything differs from `GET_PRODUCTS_QUERY`'s shape.

4. Tests — extend `lib/shopify/products.test.ts` with two new `describe` blocks, mirroring the file's existing style precisely (look at the existing `getProducts` and `getProducts — Demo Mode` blocks immediately above where you're adding these, for the exact mocking pattern used):
   - `describe('searchProducts', ...)`: asserts `client.request` is called with `GET_PREDICTIVE_SEARCH_QUERY` and `{ query: <trimmed>, limit: 6 }` (and a custom `limit` when passed); maps a mocked response to the correct `ProductListItem[]`; throws via the same error path on `errors`; a blank/whitespace query returns `[]` **without** `getStorefrontClient` having been called (assert via the shared spy's call count, same technique the file's own Demo Mode blocks already use, per D-057's note about this file having no `restoreMocks`/`clearMocks`).
   - `describe('searchProducts — Demo Mode', ...)`: `vi.stubEnv('PREVIEW_DEMO_MODE', '1')`; a query matching a real fixture title (e.g. "trouser") returns both trouser fixtures; a query matching a fixture's `productType` (e.g. "jackets") returns the jacket fixture; a query matching nothing real returns `[]` (**not** the full fixture list — this is the opposite fallback from `getProducts`' Demo Mode branch, and deliberately so: a real "no results" state is exactly what this feature must be able to demonstrate); never calls `getStorefrontClient`.

---

### Task 3: Analytics (`lib/analytics/events.ts`)

Add `'search'` to `ANALYTICS_EVENT_NAMES` (under a new `// Discovery` grouping comment if one doesn't already mark `category_nav_click` — check the existing file first) and to `EventPropertiesMap`:

```ts
search: {
  search_term: string;
  result_count: number;
};
```

Extend `lib/analytics/events.test.ts` with the same style of coverage the file already has for other events (accepted by `isKnownAnalyticsEvent`, dispatches through `dispatchAnalyticsEvent` correctly). No PII-denylist change needed — `search_term` is not a denylisted key and shouldn't become one (see the design spec).

---

### Task 4: Route Handler (`app/api/search/route.ts`)

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { searchProducts } from '@/lib/shopify/products';

const MAX_QUERY_LENGTH = 100;

// This project's first Route Handler. Deliberately GET + query param, not
// a Server Action — a live, debounced, cancelable-via-AbortSignal read is
// a different responsibility from this codebase's existing Server-Action
// call sites (discrete form submissions). Already excluded from the
// access gate: proxy.ts's matcher excludes /api unconditionally, with a
// comment anticipating exactly this. GET handlers default to dynamic
// rendering since Next 15.0.0-RC (confirmed against this project's
// installed Next 16.3.1 docs) — reading searchParams needs no additional
// `export const dynamic` override.
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await searchProducts(query);
    return NextResponse.json({ products });
  } catch (error) {
    // Logged, never forwarded to the client response — mirrors
    // app/error.tsx's own "log the real error, never show it" contract.
    console.error('[api/search]', error);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}
```

Test in `app/api/search/route.test.ts` (new — first test file under `app/`; colocate it exactly like every `lib/` module does): `vi.mock('@/lib/shopify/products')`, then assert: a request with no `q` param → `{ products: [] }`, `200`, `searchProducts` never called; `?q=%20%20` (whitespace only) → same, never called; a request with a real `q` → `searchProducts` called with the trimmed value, response echoes its resolved array at `200`; a `q` longer than 100 chars → `searchProducts` called with exactly the first 100 characters; `searchProducts` rejecting → `500`, body is `{ error: 'search_failed' }` (not the real error message), and `console.error` was called (spy it, don't let it print noise during the test run — restore afterward). Construct the request via `new NextRequest('http://localhost/api/search?q=hoodie')` (or the plain `Request`/`NextRequest` constructor pattern already idiomatic for Next 16 route handler unit tests) — no Next test server needed, this is a plain function call.

---

### Task 5: Overlay open/close CSS (`app/globals.css`)

Add immediately after the existing `.esque-menu`/`.esque-menu[data-open='true']` block (same file, same section — do not touch the existing rules):

```css
/* SearchOverlay open/close — identical mechanics to .esque-menu above
   (DESIGN_SYSTEM.md §26's timing, reused for this second full-screen
   dialog). Deliberately a separate class rather than sharing .esque-menu:
   FullScreenMenu.tsx is already-shipped, independently reviewed code: a
   new, unrelated dialog reusing (and implicitly coupling to) its class
   name is a worse trade than ~15 duplicated lines. See the design spec's
   Architecture section. */
.esque-search-overlay {
  visibility: hidden;
  opacity: 0;
  transition:
    opacity 280ms var(--ease-esque),
    visibility 0s linear 280ms;
}

.esque-search-overlay[data-open='true'] {
  visibility: visible;
  opacity: 1;
  transition:
    opacity 400ms var(--ease-esque),
    visibility 0s linear 0s;
}
```

The sitewide `@media (prefers-reduced-motion: reduce)` rule at the top of the file already zeroes these — confirm this by inspection, don't add a redundant reduced-motion override here.

---

### Task 6: `SearchOverlay.tsx` (the main component)

`components/navigation/SearchOverlay.tsx`. Read `FullScreenMenu.tsx` immediately before writing this — mirror its structure (refs, effects, comments explaining *why*, not just what) rather than writing a divergent implementation that happens to produce similar behavior. Props:

```ts
interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}
```

Structure, in order:

1. **Refs/state:** `containerRef`, `inputRef` (focused on open instead of `FullScreenMenu`'s `firstLinkRef`), `hasOpenedRef` (identical purpose/comment to `FullScreenMenu`'s), `query` (`useState('')`), `productsState` (a discriminated union — see below).

```ts
type ProductsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; results: ProductListItem[] };
```

2. **Derived values (render-time, no effect):**

```ts
const trimmedQuery = query.trim();
const isQueryLongEnough = trimmedQuery.length >= MIN_QUERY_LENGTH;
const categoryResults = useMemo(
  () => (isQueryLongEnough ? searchCategories(trimmedQuery) : []),
  [trimmedQuery, isQueryLongEnough],
);
```

3. **Open/close effect** — mirrors `FullScreenMenu`'s exactly, focuses `inputRef` instead of a link, and additionally resets `query` on the close transition:

```ts
useEffect(() => {
  if (open) {
    hasOpenedRef.current = true;
    inputRef.current?.focus();
  } else if (hasOpenedRef.current) {
    triggerRef.current?.focus();
    setQuery('');
  }
}, [open, triggerRef]);
```

4. **Pathname-close effect** — identical to `FullScreenMenu`'s `useEffectEvent`-based one (same import, same reasoning comment — copy it, don't paraphrase into something subtly different).

5. **Keydown effect (Escape + Tab-trap)** — identical to `FullScreenMenu`'s, with the focusable-selector widened to include `input:not([disabled])`:

```ts
const focusable = containerRef.current.querySelectorAll<HTMLElement>(
  'a[href], button:not([disabled]), input:not([disabled])',
);
```

6. **Debounced product-search effect:**

```ts
useEffect(() => {
  if (!open || !isQueryLongEnough) {
    setProductsState({ status: 'idle' });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    setProductsState({ status: 'loading' });
    fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('search request failed');
        return res.json() as Promise<{ products: ProductListItem[] }>;
      })
      .then(({ products }) => {
        setProductsState({ status: 'loaded', results: products });
        trackEvent('search', {
          search_term: trimmedQuery,
          result_count: products.length + categoryResults.length,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setProductsState({ status: 'error' });
      });
  }, DEBOUNCE_MS);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
  // categoryResults is intentionally read but not a reactive dependency of
  // *when* this effect re-runs (only trimmedQuery/open/isQueryLongEnough
  // should re-trigger the network request) — capture it via a ref if lint
  // insists on exhaustive-deps rather than adding it as a dependency,
  // which would re-fire the fetch on every category-only recomputation.
}, [open, trimmedQuery, isQueryLongEnough]);
```

Read the `react-hooks/exhaustive-deps` lint output on this effect once written — if it flags `categoryResults`/`trackEvent`, resolve it the way `RecentlyViewed.tsx`/`ProductPurchasePanel.tsx` already resolve equivalent cases in this codebase (a ref holding the latest value, read inside the effect, not added as a dependency that would change *when* the effect fires) rather than reaching for `eslint-disable`. A **Retry** action for the error state is just re-invoking the same fetch for the current `trimmedQuery` — the simplest correct implementation is incrementing a small `retryToken` state included in the effect's dependency array, so clicking Retry re-runs the identical effect body without duplicating its logic in a second function.

7. **Render** — dialog container, `CLOSE` button, `<label htmlFor="esque-search-input" className="sr-only">Search</label>` + `<input id="esque-search-input" ref={inputRef} type="search" autoComplete="off" placeholder="SEARCH ESQUE" value={query} onChange={...} className="font-display text-heading-3 md:text-heading-1 tracking-display text-esque-text placeholder:text-esque-text-secondary ...">`, then the `aria-live="polite" aria-atomic="true"` results region containing:
   - CATEGORIES section (only if `categoryResults.length > 0`): `<h2>` labeled "CATEGORIES" (`text-utility uppercase tracking-metadata text-esque-text-secondary`), a list of `<Link>`s over `categoryResults`, each `onClick` calling `onClose()` directly (mirroring `FullScreenMenu`'s category-link `onClick` pattern exactly) — do not rely solely on the pathname-close effect for this case, mirror the existing belt-and-suspenders approach.
   - PRODUCTS section (only rendered once `productsState.status !== 'idle'`): heading "PRODUCTS", then a `switch`/conditional over `productsState.status`:
     - `loading`: 3 pulsing skeletons, `<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">` of `<div className="aspect-[4/5] animate-pulse bg-esque-surface" />`.
     - `error`: `<p className="font-display text-heading-3 uppercase text-esque-text">SOMETHING WENT WRONG.</p>` + a `Button` (secondary variant, matching `app/error.tsx`'s) labeled `Retry`, `onClick` bumps `retryToken`.
     - `loaded` with `results.length > 0`: `<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">` of `<ProductCard product={p} layout="standard" key={p.id} />` (no `enableSharedTransition`, no `priority`).
     - `loaded` with `results.length === 0`: render nothing here (the shared `NOTHING MATCHES.` block below covers this case; don't duplicate copy in two places).
   - `NOTHING MATCHES.` block — `<p className="font-display text-heading-3 uppercase text-esque-text">NOTHING MATCHES.</p>`, centered, matching `CategoryListing.tsx`'s exact existing markup/classes for this phrase — rendered only when `isQueryLongEnough && categoryResults.length === 0 && productsState.status === 'loaded' && productsState.results.length === 0`.
   - When `!isQueryLongEnough` (includes the initial empty-query state): render none of the above — just the input with its placeholder visible.

Import `ProductListItem` as a type from `@/lib/shopify/products`, `searchCategories`/`CategorySearchResult` from `@/lib/catalog/taxonomy`, `ProductCard` from `@/components/catalog/ProductCard`, `Button` from `@/components/ui/Button`, `trackEvent` from `@/lib/analytics/gtag`.

---

### Task 7: Wiring (`Header.tsx`, `ShellClient.tsx`, `ComingSoonNotice.tsx`)

1. **`Header.tsx`:** add `searchOpen: boolean`, `onSearchOpen: () => void`, `searchTriggerRef: RefObject<HTMLButtonElement | null>` to `HeaderProps`. SEARCH button: `ref={searchTriggerRef}`, `aria-expanded={searchOpen}`, `aria-controls="esque-search-overlay"`, `onClick={onSearchOpen}` (replacing `() => setComingSoonFeature('SEARCH')`). Update `ComingSoonFeature` import/usage to the narrowed type. Update the file's own comment above `compactUtilityButton`/the `comingSoonFeature` state (currently frames SEARCH as one of the not-yet-wired controls) to reflect that SEARCH is now real and only ACCOUNT/BAG remain stubbed.

2. **`ComingSoonNotice.tsx`:** narrow `export type ComingSoonFeature = 'ACCOUNT' | 'BAG';`. Update the file's header comment (currently: "SEARCH/ACCOUNT/BAG in Header.tsx have no real behavior yet — SEARCH lands in ROADMAP.md Phase 4...") to drop the SEARCH reference.

3. **`ShellClient.tsx`:** add `const [searchOpen, setSearchOpen] = useState(false);` and `const searchTriggerRef = useRef<HTMLButtonElement>(null);` alongside the existing menu state. Change `inert={menuOpen}` to `inert={menuOpen || searchOpen}` (update its explanatory comment to mention both overlays, not just the menu). Pass the three new props to `<Header>`. Render `<SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} triggerRef={searchTriggerRef} />` as a sibling immediately after `<FullScreenMenu>`.

---

### Task 8: E2E coverage (`tests/e2e/search.spec.ts`, new) and `smoke.spec.ts` update

New file, mirroring `catalog.spec.ts`/`legal.spec.ts`'s existing structure/`beforeEach` access-cookie pattern:

- Opens via `page.getByRole('button', { name: 'SEARCH' }).click()`; asserts the dialog (`role="dialog"`, accessible name "Search") becomes visible and the search `<input>` has focus.
- Escape closes it; focus returns to the SEARCH button.
- Tab-cycle: focus the input, Shift+Tab from it wraps to the last focusable element in the dialog (mirror `smoke.spec.ts`'s existing "Tab cycles focus within the open menu" test technique for `FullScreenMenu`).
- Opening MENU while... actually: assert the *reverse* — with Search open, the MENU button is not reachable (its container is `inert`); a simple, robust check is that `page.getByRole('button', { name: 'MENU' })` is present but fails an interactability check, or more simply assert `document.querySelector('[inert]')` is truthy while Search is open. Pick whichever this codebase's existing `inert` tests elsewhere (check `smoke.spec.ts`/`homepage.spec.ts` for how the existing `menuOpen` inert behavior is already asserted, if it is, and mirror that exact technique).
- Typing "hoodie" (or "hoo") shows a real `TOPS / Hoodies` link under a "CATEGORIES" heading; clicking it navigates to `/tops/hoodies` and closes the overlay.
- Typing a query long enough to search (`>= 2` chars) shows the PRODUCTS section's error state (`SOMETHING WENT WRONG.` + a `Retry` button) given this environment's genuinely unconfigured Shopify client — assert this explicitly, the same honest-about-the-environment approach `catalog.spec.ts` already takes, and assert the *page-level* `SOMETHING WENT WRONG.` heading (`app/error.tsx`'s) is **not** what's showing (scope your locator inside the dialog, or assert the underlying page's own heading, if any, is unaffected) — this is the one assertion that most directly proves the scoped-error design decision actually works, not just that some error text exists somewhere.
- A single-character query (e.g. "h") shows neither CATEGORIES nor PRODUCTS sections.
- `reduced-motion-audit.spec.ts`-style check: under `emulateMedia({ reducedMotion: 'reduce' })`, opening/closing produces no console error (mirrors that file's existing technique — add to that file if it's the more natural home for a cross-cutting reduced-motion assertion, or to `search.spec.ts` if the rest of that file's assertions are feature-specific; use your judgment, but don't skip this check).

Update `smoke.spec.ts`'s "SEARCH, ACCOUNT, and BAG show an on-brand 'arriving soon' notice when clicked" test: remove the SEARCH assertion and its `page.getByRole('button', { name: 'SEARCH' }).click()` line; keep ACCOUNT/BAG exactly as they are; rename the test if "SEARCH, ACCOUNT, and BAG" in its title is no longer accurate (e.g. "ACCOUNT and BAG show an on-brand 'arriving soon' notice when clicked").

---

### Task 9: Self-check before handing back

Before considering this done, confirm — don't assume:

- `pnpm format:check && pnpm lint && pnpm typecheck` all pass.
- `pnpm test:unit` passes, including every new test above.
- `pnpm exec playwright test` passes across all four projects (`chromium`, `mobile-safari`, `tablet`, `laptop`) — including the new `search.spec.ts` and the modified `smoke.spec.ts`. If a pre-existing, already-documented flake (DECISIONS.md D-046/D-047/D-050 — pointer-move/timing-sensitive tests unrelated to this change) reappears, don't chase it; confirm via `--repeat-each` isolation that it's the same known class before moving on, exactly as those entries document doing.
- `pnpm build` succeeds, and `/api/search` appears in the build's route output as a real, dynamic (`ƒ`) route, not statically prerendered.
- Grep the diff for anything left over from manual verification (a temporary probe route, a stray `console.log`) — this codebase's established convention (D-026, D-034, D-045, D-048, D-053, D-055) is to verify PDP/Interactive-Model-only code via a temporary fixture probe route when this Shopify-unconfigured environment can't reach it through normal navigation, then delete the probe before committing. If you used one to hand-verify the loaded/populated PRODUCTS grid state (which this CI environment's Shopify-unconfigured client will never naturally reach), delete it and confirm via `git status --short`.

Report back to the engineering lead with: files changed, the exact validation command output (not "should pass" — actually run them), and anything you found that this plan didn't anticipate (a real Next.js behavior that differs from what's described above, a lint rule that fires somewhere unexpected, etc.) — do not silently deviate from the spec's architecture (query construction, error scoping, `enableSharedTransition` staying off) without flagging it first; those are load-bearing decisions, not implementation details.

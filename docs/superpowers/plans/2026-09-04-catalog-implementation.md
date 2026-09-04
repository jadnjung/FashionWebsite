# Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ROADMAP.md Phase 4 (Catalog), narrowed per the design spec: seven category listing routes (`/new`, `/tops`, `/tops/[subcategory]`, `/bottoms`, `/bottoms/[subcategory]`, `/etc`, `/etc/[subcategory]`), the product grid, and Sort/Availability/Price filters as zero-JavaScript URL state — verified with fixture-driven unit tests against the typed Shopify client, plus E2E coverage of everything genuinely reachable without a live store (routing, 404s, the error boundary, static metadata, nav integration).

**Architecture:** Category pages query Shopify's root `products` connection filtered by `product_type` search-syntax clauses (never a Shopify Collection — preserves D-007). Three new pure, independently-tested modules (`lib/catalog/taxonomy.ts`, `filters.ts`, `grid-layout.ts`) hold all the logic that doesn't need Shopify's generated types. `lib/shopify/products.ts` gets one new function (`getProducts`) and one new interface (`ProductListItem`) — fully additive; `ProductSummary`/`getProductsByCollection` are untouched. Every catalog UI component is a Server Component; filtering uses plain `<Link>`s and one native GET `<form>`, so this phase adds zero client-side JavaScript.

**Tech Stack:** No new dependencies. Reuses `@shopify/storefront-api-client` (already installed), the existing `Button`/`Input` components, and `next/image`/`next/link`.

**Spec:** `docs/superpowers/specs/2026-09-04-catalog-design.md` — read it in full before starting; this plan assumes its Architecture/Non-Goals sections as given and doesn't re-justify them.

## Global Constraints

- TypeScript strict mode stays on; no `@ts-ignore`/`@ts-nocheck`/`any`.
- pnpm only.
- No client components this pass — every new component is a Server Component. If a step seems to need `'use client'`, stop and reconsider against the spec's Architecture section before adding one.
- No changes to `lib/shopify/collections.ts`, `lib/shopify/products.ts`'s existing `ProductSummary`/`getProduct`/`getProductsByCollection`, or their query documents/tests — this pass is additive only there.
- No changes to `lib/navigation-data.ts` — it's consumed (read-only) by `lib/catalog/taxonomy.ts`, never modified.
- After **every** task: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm build` — fix any failure the task caused before moving on, then commit.
- Do not modify `CLAUDE.md` under any circumstance.
- Record DECISIONS.md D-023/D-024/D-025 and update ROADMAP.md Phase 4 as specified in Task 9 — not deferred past it.

---

### Task 1: Category/subcategory taxonomy (`lib/catalog/taxonomy.ts`)

**Files:**
- Create: `lib/catalog/taxonomy.ts`
- Create: `lib/catalog/taxonomy.test.ts`

**Interfaces:**
- Consumes: `NAVIGATION` from `lib/navigation-data.ts` (read-only).
- Produces: `CategorySlug` type (`'new' | 'tops' | 'bottoms' | 'etc'`), `getCategoryProductTypes(category)`, `getSubcategoryProductType(category, subcategory)`, `getCategoryLabel(category)`, `getSubcategoryLabel(category, subcategory)` — all exported from `lib/catalog/taxonomy.ts`. Tasks 4 and 7 both depend on these.

- [ ] **Step 1: Write the failing test**

Create `lib/catalog/taxonomy.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import {
  getCategoryLabel,
  getCategoryProductTypes,
  getSubcategoryLabel,
  getSubcategoryProductType,
} from '@/lib/catalog/taxonomy';

describe('getCategoryProductTypes', () => {
  test('returns the real Tops subcategory labels as product types', () => {
    expect(getCategoryProductTypes('tops')).toEqual([
      'T-Shirts',
      'Shirts',
      'Hoodies',
      'Sweaters',
      'Jackets',
    ]);
  });

  test('returns the real Bottoms subcategory labels as product types', () => {
    expect(getCategoryProductTypes('bottoms')).toEqual([
      'Jeans',
      'Trousers',
      'Shorts',
      'Sweatpants',
    ]);
  });

  test('returns the real Etc. subcategory labels as product types', () => {
    expect(getCategoryProductTypes('etc')).toEqual(['Hats', 'Jewelry']);
  });

  test('returns null for New — it has no product-type filter, only a sort default', () => {
    expect(getCategoryProductTypes('new')).toBeNull();
  });
});

describe('getSubcategoryProductType', () => {
  test('maps a real subcategory slug to its product type', () => {
    expect(getSubcategoryProductType('tops', 'hoodies')).toBe('Hoodies');
    expect(getSubcategoryProductType('bottoms', 'jeans')).toBe('Jeans');
    expect(getSubcategoryProductType('etc', 'jewelry')).toBe('Jewelry');
  });

  test('returns null for an unknown subcategory slug', () => {
    expect(getSubcategoryProductType('tops', 'not-a-real-subcategory')).toBeNull();
  });

  test('returns null when asked for a subcategory under a category that has none', () => {
    expect(getSubcategoryProductType('new', 'anything')).toBeNull();
  });
});

describe('getCategoryLabel', () => {
  test('returns the real NAVIGATION label for each category', () => {
    expect(getCategoryLabel('new')).toBe('NEW');
    expect(getCategoryLabel('tops')).toBe('TOPS');
    expect(getCategoryLabel('bottoms')).toBe('BOTTOMS');
    expect(getCategoryLabel('etc')).toBe('ETC.');
  });
});

describe('getSubcategoryLabel', () => {
  test('returns the real subcategory label', () => {
    expect(getSubcategoryLabel('tops', 'hoodies')).toBe('Hoodies');
  });

  test('returns null for an unknown subcategory slug', () => {
    expect(getSubcategoryLabel('tops', 'not-a-real-subcategory')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/catalog/taxonomy.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/catalog/taxonomy.ts`:

```typescript
// Derives the category/subcategory -> Shopify product-type taxonomy from
// lib/navigation-data.ts's NAVIGATION — the single source of truth for
// this mapping (it already drives Header/FullScreenMenu) — rather than a
// second, parallel taxonomy table that could drift from it.
//
// Caveat (see DECISIONS.md D-023): this assumes the real Shopify store's
// `productType` field values will exactly equal these NAVIGATION labels
// ("Hoodies", "T-Shirts", ...) once it exists. If a real merchandiser uses
// different product-type strings, the affected category page will return
// zero results rather than error — confirm/align this when a real store
// is provisioned, mirroring ARCHITECTURE.md §5's existing metafield-
// namespace caveat.

import { NAVIGATION } from '@/lib/navigation-data';

export type CategorySlug = 'new' | 'tops' | 'bottoms' | 'etc';

function findCategoryEntry(category: CategorySlug) {
  return NAVIGATION.find((c) => c.href === `/${category}`);
}

/**
 * Product types belonging to a top-level category, derived from its
 * NAVIGATION subcategories. Null for 'new' (NAVIGATION's NEW entry has no
 * subcategories — New is sorted by recency instead, see lib/catalog/filters.ts)
 * and for any category that unexpectedly has none.
 */
export function getCategoryProductTypes(category: CategorySlug): string[] | null {
  const entry = findCategoryEntry(category);
  if (!entry?.subcategories?.length) return null;
  return entry.subcategories.map((s) => s.label);
}

/**
 * The single product type for a subcategory route segment (e.g.
 * ('tops', 'hoodies') -> 'Hoodies'). Null if the category or subcategory
 * doesn't exist — callers use this to trigger notFound().
 */
export function getSubcategoryProductType(
  category: CategorySlug,
  subcategory: string,
): string | null {
  const entry = findCategoryEntry(category);
  const href = `/${category}/${subcategory}`;
  return entry?.subcategories?.find((s) => s.href === href)?.label ?? null;
}

/** Display label for a category slug (NAVIGATION's own casing), for headings and <title>. */
export function getCategoryLabel(category: CategorySlug): string {
  return findCategoryEntry(category)?.label ?? category;
}

/** Display label for a subcategory slug. Null if it doesn't exist. */
export function getSubcategoryLabel(category: CategorySlug, subcategory: string): string | null {
  const entry = findCategoryEntry(category);
  const href = `/${category}/${subcategory}`;
  return entry?.subcategories?.find((s) => s.href === href)?.label ?? null;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`
Expected: all pass (E2E/build are unaffected by this pure-logic addition — this confirms it, not assumes it).

```bash
git add lib/catalog/taxonomy.ts lib/catalog/taxonomy.test.ts
git commit -m "Add category/subcategory taxonomy, derived from NAVIGATION"
```

---

### Task 2: Catalog filters (`lib/catalog/filters.ts`)

**Files:**
- Create: `lib/catalog/filters.ts`
- Create: `lib/catalog/filters.test.ts`

**Interfaces:**
- Consumes: nothing (pure — deliberately independent of both `lib/catalog/taxonomy.ts` and any Shopify-generated type, per the design spec's Architecture section).
- Produces: `CatalogSearchParams` type, `SortValue` type, `SORT_OPTIONS`, `CatalogFilters` interface, `parseCatalogFilters(searchParams, defaultSort?)`, `getSortVariables(sort)`, `buildProductSearchQuery(options)`, `hasActiveFilters(filters, defaultSort)`, `buildFilterHref(pathname, currentParams, changes)` — all exported. Tasks 4, 6, 7 depend on these.

- [ ] **Step 1: Write the failing test**

Create `lib/catalog/filters.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import {
  buildFilterHref,
  buildProductSearchQuery,
  getSortVariables,
  hasActiveFilters,
  parseCatalogFilters,
} from '@/lib/catalog/filters';

describe('parseCatalogFilters', () => {
  test('defaults to the given defaultSort, unavailable, and no price bounds', () => {
    expect(parseCatalogFilters({}, 'featured')).toEqual({
      sort: 'featured',
      available: false,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  test('honors a category-specific default sort (e.g. New defaults to newest)', () => {
    expect(parseCatalogFilters({}, 'newest').sort).toBe('newest');
  });

  test('reads a valid sort param', () => {
    expect(parseCatalogFilters({ sort: 'price-desc' }, 'featured').sort).toBe('price-desc');
  });

  test('falls back to defaultSort for an unrecognized sort value', () => {
    expect(parseCatalogFilters({ sort: 'bogus' }, 'featured').sort).toBe('featured');
  });

  test('reads available=1 as true, and its absence as false', () => {
    expect(parseCatalogFilters({ available: '1' }, 'featured').available).toBe(true);
    expect(parseCatalogFilters({}, 'featured').available).toBe(false);
    expect(parseCatalogFilters({ available: '0' }, 'featured').available).toBe(false);
  });

  test('parses valid min/max price', () => {
    expect(parseCatalogFilters({ minPrice: '50', maxPrice: '200' }, 'featured')).toMatchObject({
      minPrice: 50,
      maxPrice: 200,
    });
  });

  test('ignores a non-numeric price param', () => {
    expect(parseCatalogFilters({ minPrice: 'free' }, 'featured').minPrice).toBeUndefined();
  });

  test('ignores a negative price param', () => {
    expect(parseCatalogFilters({ minPrice: '-10' }, 'featured').minPrice).toBeUndefined();
  });

  test('drops a contradictory range (max below min) rather than silently returning zero results', () => {
    const filters = parseCatalogFilters({ minPrice: '200', maxPrice: '50' }, 'featured');
    expect(filters.minPrice).toBe(200);
    expect(filters.maxPrice).toBeUndefined();
  });

  test('takes the first value when a param is given more than once', () => {
    expect(parseCatalogFilters({ sort: ['newest', 'price-asc'] }, 'featured').sort).toBe('newest');
  });
});

describe('getSortVariables', () => {
  test('featured has no sortKey (no true curation at the root-query level — see D-023)', () => {
    expect(getSortVariables('featured')).toEqual({ sortKey: undefined, reverse: false });
  });

  test('newest sorts by CREATED_AT, reversed', () => {
    expect(getSortVariables('newest')).toEqual({ sortKey: 'CREATED_AT', reverse: true });
  });

  test('price-asc sorts by PRICE, not reversed', () => {
    expect(getSortVariables('price-asc')).toEqual({ sortKey: 'PRICE', reverse: false });
  });

  test('price-desc sorts by PRICE, reversed', () => {
    expect(getSortVariables('price-desc')).toEqual({ sortKey: 'PRICE', reverse: true });
  });
});

describe('buildProductSearchQuery', () => {
  test('returns undefined when nothing is being filtered', () => {
    expect(buildProductSearchQuery({})).toBeUndefined();
  });

  test('a single product type is not wrapped in parentheses', () => {
    expect(buildProductSearchQuery({ productTypes: ['Hoodies'] })).toBe('product_type:"Hoodies"');
  });

  test('multiple product types are OR-joined and parenthesized', () => {
    expect(buildProductSearchQuery({ productTypes: ['T-Shirts', 'Shirts'] })).toBe(
      '(product_type:"T-Shirts" OR product_type:"Shirts")',
    );
  });

  test('availability alone', () => {
    expect(buildProductSearchQuery({ available: true })).toBe('available_for_sale:true');
  });

  test('price bounds alone, and together', () => {
    expect(buildProductSearchQuery({ minPrice: 50 })).toBe('variants.price:>=50');
    expect(buildProductSearchQuery({ maxPrice: 200 })).toBe('variants.price:<=200');
    expect(buildProductSearchQuery({ minPrice: 50, maxPrice: 200 })).toBe(
      'variants.price:>=50 AND variants.price:<=200',
    );
  });

  test('every clause combines with explicit AND, in a stable order', () => {
    expect(
      buildProductSearchQuery({
        productTypes: ['Hoodies', 'Jackets'],
        available: true,
        minPrice: 50,
        maxPrice: 200,
      }),
    ).toBe(
      '(product_type:"Hoodies" OR product_type:"Jackets") AND available_for_sale:true AND variants.price:>=50 AND variants.price:<=200',
    );
  });

  test('an explicit empty productTypes array is treated the same as none', () => {
    expect(buildProductSearchQuery({ productTypes: [] })).toBeUndefined();
  });
});

describe('hasActiveFilters', () => {
  test('false when sort matches the default and nothing else is set', () => {
    expect(
      hasActiveFilters(
        { sort: 'featured', available: false, minPrice: undefined, maxPrice: undefined },
        'featured',
      ),
    ).toBe(false);
  });

  test('false for New\'s own default sort (newest) with nothing else set', () => {
    expect(
      hasActiveFilters(
        { sort: 'newest', available: false, minPrice: undefined, maxPrice: undefined },
        'newest',
      ),
    ).toBe(false);
  });

  test('true when sort differs from the default', () => {
    expect(
      hasActiveFilters(
        { sort: 'newest', available: false, minPrice: undefined, maxPrice: undefined },
        'featured',
      ),
    ).toBe(true);
  });

  test('true when availability or a price bound is set, even with the default sort', () => {
    expect(
      hasActiveFilters({ sort: 'featured', available: true, minPrice: undefined, maxPrice: undefined }, 'featured'),
    ).toBe(true);
    expect(
      hasActiveFilters({ sort: 'featured', available: false, minPrice: 50, maxPrice: undefined }, 'featured'),
    ).toBe(true);
  });
});

describe('buildFilterHref', () => {
  test('adds a param to a path with none', () => {
    expect(buildFilterHref('/tops', {}, { sort: 'newest' })).toBe('/tops?sort=newest');
  });

  test('preserves existing params while changing one', () => {
    expect(buildFilterHref('/tops', { sort: ['featured'] }, { available: '1' })).toBe(
      '/tops?sort=featured&available=1',
    );
  });

  test('removes a param when the change value is undefined', () => {
    expect(buildFilterHref('/tops', { sort: ['newest'], available: ['1'] }, { available: undefined })).toBe(
      '/tops?sort=newest',
    );
  });

  test('returns the bare path when no params remain', () => {
    expect(buildFilterHref('/tops', {}, {})).toBe('/tops');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/catalog/filters.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/catalog/filters.ts`:

```typescript
// URL-driven catalog filters — sort, availability, and price range — parsed
// from a category page's searchParams and translated into a Shopify
// Storefront API search-query string plus sort variables. See the design
// spec's Architecture section and DECISIONS.md D-023/D-024 for the
// reasoning behind what's built here and what's deferred (size, color,
// collection).
//
// Deliberately independent of lib/catalog/taxonomy.ts (product types are
// passed in, not looked up here) and of any Shopify-generated type
// (sortKey uses hand-written literals verified against the real Storefront
// API schema — see lib/shopify/products.ts, where they're actually passed
// into a typed client.request() call, which is where a mismatch would be
// caught).

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export type SortValue = 'featured' | 'newest' | 'price-asc' | 'price-desc';

// PROJECT.md §34's exact four sort options — kept even though 'featured'
// has no true curation at the root products-query level (see D-023).
export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));

const SORT_KEY_BY_VALUE: Record<SortValue, { sortKey?: 'CREATED_AT' | 'PRICE'; reverse: boolean }> = {
  featured: { reverse: false },
  newest: { sortKey: 'CREATED_AT', reverse: true },
  'price-asc': { sortKey: 'PRICE', reverse: false },
  'price-desc': { sortKey: 'PRICE', reverse: true },
};

export interface CatalogFilters {
  sort: SortValue;
  available: boolean;
  minPrice?: number;
  maxPrice?: number;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseNonNegativeNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Parses a category page's searchParams into typed filter values.
 * `defaultSort` lets /new default to 'newest' while every other category
 * defaults to 'featured', without either hardcoding the other's behavior.
 */
export function parseCatalogFilters(
  searchParams: CatalogSearchParams,
  defaultSort: SortValue = 'featured',
): CatalogFilters {
  const sortParam = firstValue(searchParams.sort);
  const sort = sortParam && SORT_VALUES.has(sortParam as SortValue) ? (sortParam as SortValue) : defaultSort;

  const available = firstValue(searchParams.available) === '1';
  const minPrice = parseNonNegativeNumber(firstValue(searchParams.minPrice));
  const maxPriceRaw = parseNonNegativeNumber(firstValue(searchParams.maxPrice));
  // A max below min is a contradictory range, not a valid filter — drop it
  // rather than silently querying a range no visitor intended (which would
  // read as "no products" instead of "ignored your typo").
  const maxPrice =
    maxPriceRaw !== undefined && minPrice !== undefined && maxPriceRaw < minPrice ? undefined : maxPriceRaw;

  return { sort, available, minPrice, maxPrice };
}

/** Shopify sortKey/reverse variables for a parsed sort value. */
export function getSortVariables(sort: SortValue): { sortKey?: 'CREATED_AT' | 'PRICE'; reverse: boolean } {
  return SORT_KEY_BY_VALUE[sort];
}

/**
 * Builds a Shopify Storefront API search-query string (verified against
 * shopify.dev/docs/api/usage/search-syntax — see the design spec's
 * Architecture section) from resolved product types and the parsed
 * availability/price filters. Always emits explicit AND/OR/parentheses,
 * never relies on implicit-AND-via-juxtaposition. Returns undefined when
 * there's nothing to filter by, so callers pass no `query` argument at all
 * for an unfiltered listing rather than an empty string.
 */
export function buildProductSearchQuery(options: {
  productTypes?: string[] | null;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
}): string | undefined {
  const clauses: string[] = [];

  if (options.productTypes?.length) {
    const typeClause = options.productTypes.map((t) => `product_type:"${t}"`).join(' OR ');
    clauses.push(options.productTypes.length > 1 ? `(${typeClause})` : typeClause);
  }
  if (options.available) {
    clauses.push('available_for_sale:true');
  }
  if (options.minPrice !== undefined) {
    clauses.push(`variants.price:>=${options.minPrice}`);
  }
  if (options.maxPrice !== undefined) {
    clauses.push(`variants.price:<=${options.maxPrice}`);
  }

  return clauses.length ? clauses.join(' AND ') : undefined;
}

/** True when any filter narrows the result set relative to the category's own default. */
export function hasActiveFilters(filters: CatalogFilters, defaultSort: SortValue): boolean {
  return (
    filters.sort !== defaultSort ||
    filters.available ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined
  );
}

/**
 * Builds an href for the current path with one or more query params
 * changed, preserving every other currently-active param. A `changes`
 * value of `undefined` removes that param (e.g. clearing a filter).
 */
export function buildFilterHref(
  pathname: string,
  currentParams: CatalogSearchParams,
  changes: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentParams)) {
    const v = firstValue(value);
    if (v !== undefined) params.set(key, v);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/catalog/filters.ts lib/catalog/filters.test.ts
git commit -m "Add URL-driven catalog filters (sort, availability, price range)"
```

---

### Task 3: Grid layout rhythm (`lib/catalog/grid-layout.ts`)

**Files:**
- Create: `lib/catalog/grid-layout.ts`
- Create: `lib/catalog/grid-layout.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces: `GridItemLayout` type, `getGridItemLayout(index)` — exported. Task 5 (`ProductGrid`) depends on this.

- [ ] **Step 1: Write the failing test**

Create `lib/catalog/grid-layout.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { getGridItemLayout } from '@/lib/catalog/grid-layout';

describe('getGridItemLayout', () => {
  test('the first item, and every third item after it, is featured', () => {
    expect(getGridItemLayout(0)).toBe('featured');
    expect(getGridItemLayout(3)).toBe('featured');
    expect(getGridItemLayout(6)).toBe('featured');
  });

  test('every other item is standard', () => {
    expect(getGridItemLayout(1)).toBe('standard');
    expect(getGridItemLayout(2)).toBe('standard');
    expect(getGridItemLayout(4)).toBe('standard');
    expect(getGridItemLayout(5)).toBe('standard');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/catalog/grid-layout.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/catalog/grid-layout.ts`:

```typescript
// Periodic large/standard visual rhythm for the product grid —
// DESIGN_SYSTEM.md §36-38's "unconventional...grid...may vary product
// presentation while maintaining alignment and rhythm" — implemented as a
// simple repeating pattern that works for any category size, not a fixed
// layout hand-tuned to exactly 6 products. The large editorial-image
// insert from DESIGN_SYSTEM's illustrative example sequence is
// deliberately not implemented here — see the design spec's Non-Goals (it
// needs real campaign photography that doesn't exist yet).

export type GridItemLayout = 'featured' | 'standard';

const FEATURED_INTERVAL = 3;

export function getGridItemLayout(index: number): GridItemLayout {
  return index % FEATURED_INTERVAL === 0 ? 'featured' : 'standard';
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/catalog/grid-layout.ts lib/catalog/grid-layout.test.ts
git commit -m "Add periodic featured/standard grid layout rhythm"
```

---

### Task 4: `getProducts` — root products query, filtered by product type

**Files:**
- Modify: `lib/shopify/queries/products.ts` (add `GET_PRODUCTS_QUERY`; `GET_PRODUCT_QUERY`/`GET_PRODUCTS_BY_COLLECTION_QUERY` untouched)
- Modify: `lib/shopify/products.ts` (add `ProductListItem`, `GetProductsOptions`, `getProducts`; everything existing untouched)
- Modify: `lib/shopify/products.test.ts` (add tests for the new function; existing tests untouched)

**Interfaces:**
- Consumes: `getStorefrontClient`/`toRequestError` from `lib/shopify/client.ts` (existing).
- Produces: `getProducts(options?: GetProductsOptions): Promise<{ products: ProductListItem[]; hasNextPage: boolean; endCursor: string | null }>`, exported from `lib/shopify/products.ts`. Task 7 (`CategoryListing`) depends on this.

- [ ] **Step 1: Add the query document**

In `lib/shopify/queries/products.ts`, append (do not modify the two existing exports):

```typescript
export const GET_PRODUCTS_QUERY = `#graphql
  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        cursor
        node {
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
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
```

- [ ] **Step 2: Regenerate codegen against the live schema**

Run: `pnpm graphql-codegen`
Expected: succeeds; `lib/shopify/storefront.generated.d.ts`/`storefront.types.d.ts` now also cover `GetProductsQuery`/`GetProductsQueryVariables`. If it fails, the error names the specific invalid field/type — fix Step 1 and rerun before continuing (this is the concrete proof the query is valid against Shopify's real current schema, per the established D-015/D-016 precedent).

- [ ] **Step 3: Write the failing tests**

In `lib/shopify/products.test.ts`, add (below the existing `describe` blocks, using the same `mockClient` helper already defined at the top of the file):

```typescript
import { getProducts } from '@/lib/shopify/products';
```

(add to the existing top-of-file import from `@/lib/shopify/products`, alongside `getProduct`/`getProductsByCollection`)

```typescript
describe('getProducts', () => {
  test('maps a page of products, including availableForSale and up to two images', () => {
    return (async () => {
      mockClient({
        data: {
          products: {
            edges: [
              {
                cursor: 'c1',
                node: {
                  id: 'gid://shopify/Product/1',
                  handle: 'hoodie-01',
                  title: 'Hoodie 01',
                  productType: 'Hoodies',
                  tags: ['new'],
                  availableForSale: true,
                  priceRange: { minVariantPrice: { amount: '180.00', currencyCode: 'USD' } },
                  images: {
                    edges: [
                      { node: { url: 'https://cdn.example/hoodie-01-a.jpg', altText: null, width: 800, height: 1000 } },
                      { node: { url: 'https://cdn.example/hoodie-01-b.jpg', altText: 'Back view', width: 800, height: 1000 } },
                    ],
                  },
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'c1' },
          },
        },
      });

      const result = await getProducts();

      expect(result).toEqual({
        products: [
          {
            id: 'gid://shopify/Product/1',
            handle: 'hoodie-01',
            title: 'Hoodie 01',
            productType: 'Hoodies',
            tags: ['new'],
            minPrice: { amount: '180.00', currencyCode: 'USD' },
            availableForSale: true,
            images: [
              { url: 'https://cdn.example/hoodie-01-a.jpg', altText: null, width: 800, height: 1000 },
              { url: 'https://cdn.example/hoodie-01-b.jpg', altText: 'Back view', width: 800, height: 1000 },
            ],
          },
        ],
        hasNextPage: false,
        endCursor: 'c1',
      });
    })();
  });

  test('defaults to an empty images array when a product has none', () => {
    return (async () => {
      mockClient({
        data: {
          products: {
            edges: [
              {
                cursor: 'c1',
                node: {
                  id: 'gid://shopify/Product/2',
                  handle: 'sold-out-item',
                  title: 'Sold Out Item',
                  productType: 'Hoodies',
                  tags: [],
                  availableForSale: false,
                  priceRange: { minVariantPrice: { amount: '150.00', currencyCode: 'USD' } },
                  images: { edges: [] },
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'c1' },
          },
        },
      });

      const result = await getProducts();
      expect(result.products[0].images).toEqual([]);
      expect(result.products[0].availableForSale).toBe(false);
    })();
  });

  test('defaults first to 24 and after/query/sortKey/reverse to null when no options given', () => {
    return (async () => {
      const request = vi.fn().mockResolvedValue({ data: { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } } });
      vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({ request } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);

      await getProducts();

      expect(request).toHaveBeenCalledWith(
        expect.any(String),
        { variables: { first: 24, after: null, query: null, sortKey: null, reverse: null } },
      );
    })();
  });

  test('passes given query/sortKey/reverse/first/after through as request variables', () => {
    return (async () => {
      const request = vi.fn().mockResolvedValue({ data: { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } } });
      vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({ request } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);

      await getProducts({
        query: 'product_type:"Hoodies"',
        sortKey: 'PRICE',
        reverse: true,
        first: 12,
        after: 'cursor-1',
      });

      expect(request).toHaveBeenCalledWith(
        expect.any(String),
        {
          variables: {
            first: 12,
            after: 'cursor-1',
            query: 'product_type:"Hoodies"',
            sortKey: 'PRICE',
            reverse: true,
          },
        },
      );
    })();
  });

  test('returns an empty page rather than throwing when products is unexpectedly absent from data', () => {
    return (async () => {
      mockClient({ data: {} });
      const result = await getProducts();
      expect(result).toEqual({ products: [], hasNextPage: false, endCursor: null });
    })();
  });

  test('throws when the response includes errors, rather than returning an empty page', () => {
    return (async () => {
      mockClient({
        data: undefined,
        errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
      });
      await expect(getProducts()).rejects.toThrow('Throttled by Shopify');
    })();
  });

  test('propagates the client\'s "not configured" error rather than attempting a request', () => {
    return (async () => {
      vi.spyOn(clientModule, 'getStorefrontClient').mockImplementation(() => {
        throw new Error(
          'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
        );
      });
      await expect(getProducts()).rejects.toThrow('Shopify Storefront API is not configured');
    })();
  });
});
```

Note: the `return (async () => { ... })();` wrapper above is only there because this plan inserts these tests as a block into an existing file without repeating its imports/setup — when actually writing the file, use plain `test('...', async () => { ... })` bodies exactly like the file's existing tests, not this wrapper. `vi` and `clientModule` are already imported at the top of the existing `products.test.ts`.

- [ ] **Step 4: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `getProducts` doesn't exist yet.

- [ ] **Step 5: Implement**

In `lib/shopify/products.ts`, add the import (extend the existing import line) and append after the existing code:

```typescript
import {
  GET_PRODUCT_QUERY,
  GET_PRODUCTS_BY_COLLECTION_QUERY,
  GET_PRODUCTS_QUERY,
} from '@/lib/shopify/queries/products';
```

```typescript
export interface ProductListItem {
  id: string;
  handle: string;
  title: string;
  productType: string;
  tags: string[];
  minPrice: { amount: string; currencyCode: string };
  availableForSale: boolean;
  images: ProductImage[];
}

export interface GetProductsOptions {
  query?: string;
  sortKey?: 'CREATED_AT' | 'PRICE';
  reverse?: boolean;
  first?: number;
  after?: string;
}

/**
 * Fetches a page of products from Shopify's root `products` connection,
 * filtered/sorted by the given search-query string and sort variables.
 * Used by category listing pages, which filter by product type rather
 * than a specific Collection (DECISIONS.md D-023, ARCHITECTURE.md §5) —
 * lib/catalog/taxonomy.ts and lib/catalog/filters.ts build the `query`/
 * `sortKey`/`reverse` options this function just passes through.
 *
 * Deliberately separate from getProductsByCollection: different query
 * shape (root products vs. a collection's products), different result
 * shape (ProductListItem carries availableForSale, for the Availability
 * filter and the SOLD OUT badge, and up to two images, for the product
 * card's hover crossfade — neither of which ProductSummary needs for its
 * own, unrelated PDP/collection-page use). Throws if the Storefront API
 * response includes `errors` — same contract as every other fetch
 * function in this file.
 */
export async function getProducts(
  options: GetProductsOptions = {},
): Promise<{ products: ProductListItem[]; hasNextPage: boolean; endCursor: string | null }> {
  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_PRODUCTS_QUERY, {
    variables: {
      first: options.first ?? 24,
      after: options.after ?? null,
      query: options.query ?? null,
      sortKey: options.sortKey ?? null,
      reverse: options.reverse ?? null,
    },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const connection = data?.products;

  return {
    products: (connection?.edges ?? []).map(({ node }) => ({
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
    })),
    hasNextPage: connection?.pageInfo?.hasNextPage ?? false,
    endCursor: connection?.pageInfo?.endCursor ?? null,
  };
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all tests pass, including every existing `products.test.ts`/`collections.test.ts` test (untouched, must still pass unchanged).

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors. If `sortKey: 'CREATED_AT' | 'PRICE'` doesn't structurally satisfy the generated `ProductSortKeys` type at the `client.request()` call site, the generated type is the source of truth — adjust the literal spelling here (and in `lib/catalog/filters.ts`'s `SORT_KEY_BY_VALUE`) to match it exactly, rather than casting.

- [ ] **Step 8: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/shopify/queries/products.ts lib/shopify/products.ts lib/shopify/products.test.ts
git commit -m "Add getProducts: root products query filtered by product type"
```

Do not stage `lib/shopify/storefront-*.schema.json` (gitignored) or forget that `storefront.generated.d.ts`/`storefront.types.d.ts` ARE tracked (D-017) — `git status` should show them as modified, not untracked; stage them too if `git status` shows changes there.

---

### Task 5: `ProductCard` and `ProductGrid` components

**Files:**
- Create: `components/catalog/ProductCard.tsx`
- Create: `components/catalog/ProductGrid.tsx`

**Interfaces:**
- Consumes: `ProductListItem` (Task 4), `getGridItemLayout` (Task 3).
- Produces: `ProductCard`, `ProductGrid` — exported. Task 7 (`CategoryListing`) depends on these.

No dedicated unit/component test file — matches this codebase's established pattern (`Header.tsx`/`Footer.tsx`/`FullScreenMenu.tsx` have no Vitest component tests either; there is no jsdom/React Testing Library in this project, and introducing one for two presentational components isn't justified — see `CLAUDE.md`'s dependency guidance). Coverage comes from `pnpm typecheck`/`pnpm build` now and Task 8's E2E tests for what's reachable without live data; full rendering behavior is verified once a real store exists, per the design spec's Testing section.

- [ ] **Step 1: Implement `ProductCard`**

Create `components/catalog/ProductCard.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { ProductListItem } from '@/lib/shopify/products';

const IMAGE_SIZES = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';

// DESIGN_SYSTEM.md §39 — default: image + name, no price. Hover: crossfade
// to a 2nd photograph via pure CSS (group/group-hover opacity) — matches
// D-013's "cheapest motion tier that satisfies the need," and keeps this a
// Server Component (no client JS needed for the hover effect).
// PROJECT.md §40: sold-out products stay visible with a SOLD OUT
// treatment, independent of whether the Availability filter is active.
export function ProductCard({ product }: { product: ProductListItem }) {
  const [primary, secondary] = product.images;

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.altText ?? product.title}
            fill
            sizes={IMAGE_SIZES}
            className="object-cover"
          />
        )}
        {secondary && (
          <Image
            src={secondary.url}
            alt=""
            aria-hidden="true"
            fill
            sizes={IMAGE_SIZES}
            className="object-cover opacity-0 transition-opacity duration-200 ease-esque group-hover:opacity-100"
          />
        )}
        {!product.availableForSale && (
          <span className="absolute left-3 top-3 bg-esque-black px-2 py-1 text-metadata tracking-metadata text-esque-text">
            SOLD OUT
          </span>
        )}
      </div>
      <p className="text-product-name text-esque-text">{product.title}</p>
    </Link>
  );
}
```

- [ ] **Step 2: Implement `ProductGrid`**

Create `components/catalog/ProductGrid.tsx`:

```tsx
import { ProductCard } from '@/components/catalog/ProductCard';
import { getGridItemLayout, type GridItemLayout } from '@/lib/catalog/grid-layout';
import type { ProductListItem } from '@/lib/shopify/products';

const LAYOUT_CLASSES: Record<GridItemLayout, string> = {
  featured: 'col-span-4 md:col-span-8 lg:col-span-8',
  standard: 'col-span-2 md:col-span-4 lg:col-span-4',
};

// DESIGN_SYSTEM.md §15/§36-38 — 12/8/4-column responsive grid (the first
// real implementation of that scale; previously conceptual per
// ROADMAP.md Phase 1) with a periodic large/standard rhythm rather than a
// uniform ecommerce grid. See the design spec's Non-Goals for why this
// doesn't include the editorial-image insert from DESIGN_SYSTEM's
// illustrative example sequence.
export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8">
      {products.map((product, index) => (
        <div key={product.id} className={LAYOUT_CLASSES[getGridItemLayout(index)]}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`
Expected: all pass. `pnpm build` is the meaningful check here — these components aren't imported by any route yet (Task 7 wires that up), so this confirms they at least compile cleanly as dead code, matching the same pattern the original Shopify client validation used.

```bash
git add components/catalog/ProductCard.tsx components/catalog/ProductGrid.tsx
git commit -m "Add ProductCard and ProductGrid components"
```

---

### Task 6: `FilterBar` component

**Files:**
- Create: `components/catalog/FilterBar.tsx`

**Interfaces:**
- Consumes: `SORT_OPTIONS`, `buildFilterHref`, `CatalogFilters`, `CatalogSearchParams` (Task 2); `Button`, `Input` (existing).
- Produces: `FilterBar` — exported. Task 7 depends on it.

- [ ] **Step 1: Implement**

Create `components/catalog/FilterBar.tsx`:

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SORT_OPTIONS,
  buildFilterHref,
  type CatalogFilters,
  type CatalogSearchParams,
} from '@/lib/catalog/filters';

interface FilterBarProps {
  pathname: string;
  searchParams: CatalogSearchParams;
  filters: CatalogFilters;
}

// DESIGN_SYSTEM.md §51 — a compact, minimal, horizontal filter control.
// Every control here is a plain Link or a native GET <form> — no client
// component, no onChange/onSubmit handler. See the design spec's
// Architecture section for why this is the right amount of engineering
// for three filters (sort, availability, price); DECISIONS.md D-024 for
// why the mobile bottom-sheet treatment DESIGN_SYSTEM.md also describes
// is deferred until a larger filter set justifies it.
export function FilterBar({ pathname, searchParams, filters }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-esque-surface pb-6 md:flex-row md:items-end md:justify-between">
      <nav aria-label="Sort" className="flex flex-wrap gap-4">
        {SORT_OPTIONS.map((option) => {
          const active = option.value === filters.sort;
          return (
            <Link
              key={option.value}
              href={buildFilterHref(pathname, searchParams, { sort: option.value })}
              aria-current={active ? 'true' : undefined}
              className={`text-utility uppercase tracking-metadata transition-colors duration-200 ease-esque ${
                active
                  ? 'text-esque-text underline decoration-esque-forest underline-offset-4'
                  : 'text-esque-text-secondary hover:text-esque-text'
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      <form method="get" action={pathname} className="flex flex-wrap items-end gap-4">
        <input type="hidden" name="sort" value={filters.sort} />
        <label className="flex items-center gap-2 text-utility uppercase tracking-metadata text-esque-text-secondary">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={filters.available}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          />
          In Stock Only
        </label>
        <Input
          label="MIN PRICE"
          name="minPrice"
          type="number"
          min={0}
          defaultValue={filters.minPrice ?? ''}
          className="w-24"
        />
        <Input
          label="MAX PRICE"
          name="maxPrice"
          type="number"
          min={0}
          defaultValue={filters.maxPrice ?? ''}
          className="w-24"
        />
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      {(filters.available || filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
        <Link
          href={buildFilterHref(pathname, searchParams, {
            available: undefined,
            minPrice: undefined,
            maxPrice: undefined,
          })}
          className="text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline"
        >
          Clear Filters
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/catalog/FilterBar.tsx
git commit -m "Add FilterBar: zero-JS sort links and an availability/price GET form"
```

---

### Task 7: `CategoryListing` and the seven page routes

**Files:**
- Create: `components/catalog/CategoryListing.tsx`
- Create: `app/(storefront)/new/page.tsx`
- Create: `app/(storefront)/tops/page.tsx`
- Create: `app/(storefront)/tops/[subcategory]/page.tsx`
- Create: `app/(storefront)/bottoms/page.tsx`
- Create: `app/(storefront)/bottoms/[subcategory]/page.tsx`
- Create: `app/(storefront)/etc/page.tsx`
- Create: `app/(storefront)/etc/[subcategory]/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: seven real routes replacing what were previously 404s.

- [ ] **Step 1: Implement `CategoryListing`**

Create `components/catalog/CategoryListing.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FilterBar } from '@/components/catalog/FilterBar';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import {
  buildProductSearchQuery,
  getSortVariables,
  hasActiveFilters,
  parseCatalogFilters,
  type CatalogSearchParams,
  type SortValue,
} from '@/lib/catalog/filters';
import {
  getCategoryLabel,
  getCategoryProductTypes,
  getSubcategoryLabel,
  getSubcategoryProductType,
  type CategorySlug,
} from '@/lib/catalog/taxonomy';
import { getProducts } from '@/lib/shopify/products';

interface CategoryListingProps {
  category: CategorySlug;
  subcategory?: string;
  searchParams: CatalogSearchParams;
}

const DEFAULT_SORT_BY_CATEGORY: Record<CategorySlug, SortValue> = {
  new: 'newest',
  tops: 'featured',
  bottoms: 'featured',
  etc: 'featured',
};

function resolveProductTypes(category: CategorySlug, subcategory: string | undefined): string[] | null {
  if (!subcategory) return getCategoryProductTypes(category);
  const productType = getSubcategoryProductType(category, subcategory);
  if (!productType) notFound();
  return [productType];
}

// Shared by all seven category/subcategory routes — resolves the taxonomy,
// parses URL filters, queries Shopify's root products connection (D-023),
// and renders the filter bar + grid + empty/no-match states. See the
// design spec's Architecture section.
export async function CategoryListing({ category, subcategory, searchParams }: CategoryListingProps) {
  const productTypes = resolveProductTypes(category, subcategory);
  const label = subcategory ? getSubcategoryLabel(category, subcategory) : getCategoryLabel(category);
  if (subcategory && !label) notFound();

  const defaultSort = DEFAULT_SORT_BY_CATEGORY[category];
  const filters = parseCatalogFilters(searchParams, defaultSort);
  const { sortKey, reverse } = getSortVariables(filters.sort);

  const { products } = await getProducts({
    query: buildProductSearchQuery({
      productTypes,
      available: filters.available,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    }),
    sortKey,
    reverse,
  });

  const pathname = subcategory ? `/${category}/${subcategory}` : `/${category}`;
  const filtersActive = hasActiveFilters(filters, defaultSort);

  return (
    <div className="flex flex-col gap-8 px-4 py-12 md:px-8">
      <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">{label}</h1>
      <FilterBar pathname={pathname} searchParams={searchParams} filters={filters} />
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-body text-esque-text-secondary">
            {filtersActive ? 'NOTHING MATCHES.' : 'NOTHING HERE YET.'}
          </p>
          {filtersActive && (
            <Link
              href={pathname}
              className="text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline"
            >
              Clear Filters
            </Link>
          )}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement `/new`**

Create `app/(storefront)/new/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';

export const metadata: Metadata = {
  title: 'New — Esque',
  description: 'The latest additions to the current Esque collection.',
};

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="new" searchParams={await searchParams} />;
}
```

- [ ] **Step 3: Implement `/tops` and `/tops/[subcategory]`**

Create `app/(storefront)/tops/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';

export const metadata: Metadata = {
  title: `${getCategoryLabel('tops')} — Esque`,
  description: 'Shop Tops from the current Esque collection.',
};

export default async function TopsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="tops" searchParams={await searchParams} />;
}
```

Create `app/(storefront)/tops/[subcategory]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getSubcategoryLabel } from '@/lib/catalog/taxonomy';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = getSubcategoryLabel('tops', subcategory);
  if (!label) notFound();
  return { title: `${label} — Esque`, description: `Shop ${label} from the current Esque collection.` };
}

export default async function TopsSubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { subcategory } = await params;
  return <CategoryListing category="tops" subcategory={subcategory} searchParams={await searchParams} />;
}
```

- [ ] **Step 4: Implement `/bottoms` and `/bottoms/[subcategory]`**

Same shape as Step 3, substituting `'bottoms'` for `'tops'` throughout (route files, `category` prop, copy). Create `app/(storefront)/bottoms/page.tsx` and `app/(storefront)/bottoms/[subcategory]/page.tsx`.

- [ ] **Step 5: Implement `/etc` and `/etc/[subcategory]`**

Same shape again, substituting `'etc'` for `'tops'`. Create `app/(storefront)/etc/page.tsx` and `app/(storefront)/etc/[subcategory]/page.tsx`. Use `getCategoryLabel('etc')` (→ `'ETC.'`) for the static title rather than hardcoding, since it includes a period.

- [ ] **Step 6: Run the full validation suite**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

Expected: format/lint/typecheck/unit/build pass. `pnpm test:e2e` — the *existing* suite should still fully pass (nothing here changes prior behavior); this task adds no new E2E specs itself (Task 8 does) but confirms these seven new routes don't break anything already covered, e.g. `smoke.spec.ts`'s "clicking a category link closes the menu and navigates" test for `NEW`, which now hits a real page instead of a 404.

```bash
git add components/catalog/CategoryListing.tsx "app/(storefront)/new" "app/(storefront)/tops" "app/(storefront)/bottoms" "app/(storefront)/etc"
git commit -m "Wire category listing pages to /new, /tops, /bottoms, /etc and their subcategories"
```

---

### Task 8: E2E coverage and nav-link integration

**Files:**
- Create: `tests/e2e/catalog.spec.ts`
- Modify: `tests/e2e/smoke.spec.ts` (extend the existing "clicking a category link closes the menu and navigates" test, or add siblings for `TOPS`/`BOTTOMS`/`ETC.`, alongside the existing `NEW` case)

**Interfaces:**
- Consumes: the seven routes from Task 7.
- Produces: nothing consumed by later tasks — this is coverage.

- [ ] **Step 1: Extend the existing nav-integration test**

In `tests/e2e/smoke.spec.ts`, the `full-screen menu` describe block already has:

```typescript
test('clicking a category link closes the menu and navigates', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'MENU' }).click();
  const menu = page.getByRole('dialog', { name: /menu/i });
  await expect(menu).toBeVisible();

  await page.getByRole('link', { name: 'NEW' }).click();
  await expect(page).toHaveURL(/\/new$/);
  await expect(menu).toBeHidden();
});
```

Add a sibling test in the same block proving `TOPS`/`BOTTOMS`/`ETC.` now navigate to real pages too (previously they'd 404 like everything else did before this phase):

```typescript
test('TOPS, BOTTOMS, and ETC. links also navigate to real pages now', async ({ page }) => {
  await page.goto('/');

  for (const [name, path] of [
    ['TOPS', '/tops'],
    ['BOTTOMS', '/bottoms'],
    ['ETC.', '/etc'],
  ] as const) {
    await page.getByRole('button', { name: 'MENU' }).click();
    await page.getByRole('link', { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    // Not a 404 — the branded not-found heading must not be present.
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toHaveCount(0);
  }
});
```

- [ ] **Step 2: Write the new catalog spec**

Create `tests/e2e/catalog.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env sets only
// the access-gate/Klaviyo fixtures) — every route below therefore calls a
// genuinely unconfigured Shopify client. This mirrors the already-
// established access-gate precedent ("submitting with valid input but
// Klaviyo not configured surfaces the error boundary honestly") and is the
// honest limit of what's E2E-verifiable without a live store — see the
// design spec's Testing section.
const ROUTES = ['/new', '/tops', '/tops/hoodies', '/bottoms', '/bottoms/jeans', '/etc', '/etc/jewelry'];

test.describe('category routes — reachable and fail honestly without a configured store', () => {
  for (const route of ROUTES) {
    test(`${route} surfaces the error boundary rather than crashing uncleanly`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
    });
  }
});

test.describe('category routes — static metadata does not depend on Shopify', () => {
  test('each category has a real, on-brand <title>, independent of the Shopify call failing', async ({
    page,
  }) => {
    await page.goto('/tops');
    await expect(page).toHaveTitle(/Tops/);
    await page.goto('/bottoms');
    await expect(page).toHaveTitle(/Bottoms/);
    await page.goto('/etc');
    await expect(page).toHaveTitle(/Etc/);
    await page.goto('/new');
    await expect(page).toHaveTitle(/New/);
  });
});

test.describe('unknown subcategory', () => {
  test('a nonexistent subcategory shows the branded 404, not the Shopify error boundary', async ({
    page,
  }) => {
    // Taxonomy resolution happens before any Shopify call, so this is
    // fully testable without a store — a real, previously-uncalled path.
    await page.goto('/tops/not-a-real-subcategory');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toHaveCount(0);
  });

  test('an unknown top-level segment under etc also 404s', async ({ page }) => {
    await page.goto('/etc/not-a-real-subcategory');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
  });
});
```

- [ ] **Step 3: Run it to verify it passes**

Run: `pnpm test:e2e`
Expected: all new tests pass, alongside the full existing suite. If a route's error boundary doesn't render as expected, check that `CategoryListing` genuinely calls `getProducts` before returning (a bug that skipped the Shopify call entirely would falsely "pass" by rendering an empty grid instead of erroring — cross-check against `pnpm dev` manually with `SHOPIFY_STORE_DOMAIN` unset if this is ambiguous).

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add tests/e2e/catalog.spec.ts tests/e2e/smoke.spec.ts
git commit -m "Add E2E coverage for category routes, 404s, metadata, and nav integration"
```

---

### Task 9: Record decisions and update the roadmap

**Files:**
- Modify: `DECISIONS.md` (append D-023, D-024, D-025)
- Modify: `ROADMAP.md` (Phase 4 checkboxes)

- [ ] **Step 1: Confirm the next available decision numbers**

Run: `grep -n "^## D-0" DECISIONS.md | tail -3`
Expected: confirms D-022 is the last existing entry. If not, renumber D-023/024/025 to the next free numbers and note it here.

- [ ] **Step 2: Append D-023, D-024, D-025**

At the end of `DECISIONS.md`:

```markdown
## D-023 — Category pages query Shopify's root `products` connection filtered by product type, not a Collection

**Decision:** Category/subcategory listing pages (`/new`, `/tops`, `/tops/[subcategory]`, etc.) query Shopify's root `products(query, sortKey, reverse, first, after)` connection, with `query` built from `product_type:"..."` search-syntax clauses — never `collection(handle).products`. The category→product-type mapping (`lib/catalog/taxonomy.ts`) is derived directly from `lib/navigation-data.ts`'s existing `NAVIGATION` structure, not a second, parallel taxonomy table.

**Reason:** `ARCHITECTURE.md` §5 and `DECISIONS.md` D-007 require Category and Collection to remain independent dimensions — querying a Collection for a category page would conflate them. The root `products` connection's search-syntax filtering (`field:value`, comparisons, `AND`/`OR`, parentheses) was verified directly against Shopify's current Storefront API docs before implementation, not assumed from memory. Deriving the taxonomy from `NAVIGATION` (already the source Header/FullScreenMenu render from) avoids a second mapping that could silently drift from it.

**Caveat:** this assumes the real Shopify store's `productType` field values will exactly equal `NAVIGATION`'s subcategory labels (`"Hoodies"`, `"T-Shirts"`, …) once a store exists — unverifiable without one. If a real merchandiser uses different strings, the affected category page returns zero results rather than erroring. Mirrors the existing, still-open metafield-namespace caveat in `ARCHITECTURE.md` §5; both should be confirmed together when a real store is provisioned.

**Also recorded here:** Shopify's root `ProductSortKeys` enum has no merchant-curated ordering (`MANUAL`/`COLLECTION_DEFAULT` exist only on `ProductCollectionSortKeys`, which is collection-scoped). "Featured" — `PROJECT.md` §34's default sort option — therefore maps to the root connection's own default ordering rather than true curation. All four of `PROJECT.md` §34's sort options (Featured, Newest, Price Low→High, Price High→Low) are still implemented and selectable, honoring the product spec's exact vocabulary even though "Featured" doesn't yet do more than the API default.

---

## D-024 — Phase 4 filters narrowed to Sort, Availability, and Price range; Size, Color, and Collection deferred

**Decision:** This pass builds Sort (all four `PROJECT.md` §34 options), Availability (in-stock toggle), and Price range (min/max) as zero-JavaScript, URL-driven filters — plain `<Link>`s for Sort, one native GET `<form>` for Availability/Price. Size, Color, and Collection filters are not built. `DESIGN_SYSTEM.md` §51's mobile bottom-sheet filter treatment is also not built this pass.

**Reason:** Size/Color have no real taxonomy yet — `PROJECT.md` §101 still lists product sizes/colors as an open decision, the same category of gap `DECISIONS.md` D-012 already named for navigation data before real Shopify data existed. Building a filter against a guessed size/color enum risks the exact wrong-guess problem D-012 avoided. Collection has only one real member in the current catalog (Collection 001) — a Collection filter has no second collection to prove it actually excludes anything, and intersecting a category's product-type query with a specific collection is a different, untested query shape (`collection(handle).products` vs. root `products(query:)`) not needed by anything else this pass. The mobile bottom-sheet treatment's value is hiding a *large* control set from a small screen; three simple controls (a handful of links, one checkbox, two number fields) don't yet justify that complexity or its JS cost — natural to add once Size/Color/Collection expand the control set later.

**Also recorded here:** Filters were deliberately implemented with zero client components — Sort as plain `<Link>`s (each preserving other active params via `buildFilterHref`), Availability/Price as one native GET `<form>` with no `onChange`/`onSubmit` handler. This works with JavaScript disabled, needs no new client-side bundle weight, and reuses the existing `Button`/`Input` components rather than introducing new form primitives.

---

## D-025 — Predictive full-screen search (ROADMAP.md Phase 4) deferred in full

**Decision:** No search functionality — predictive or otherwise — is built this pass. Header's `SEARCH` control remains the no-op it already was.

**Reason:** Unlike a category grid, whose correctness is fully specified by "does it show the right products for this category" (verifiable with a handful of fixtures, exactly as `getProducts` is tested), predictive search's entire value proposition — relevance/ranking quality against a real catalog, `PROJECT.md` §33's "feels instantaneous" — is fundamentally about live-store interaction. A fixture-driven unit test of "does our result-grouping function group a mocked response correctly" would test our own formatting code, not whether Shopify's `predictiveSearch` (confirmed via its current docs to be a real, separate root query from `products(query:)`, with its own `limitScope`/`unavailableProducts` tuning surface) actually behaves usefully against Esque's real, currently nonexistent catalog — which is the actual point of the feature. This mirrors D-016's reasoning for deferring cart/checkout: the mechanism could be wired and type-verified without a store, but its behavior cannot be meaningfully verified without one.
```

- [ ] **Step 3: Update `ROADMAP.md`'s Phase 4 checkboxes**

Change:

```markdown
## Phase 4 — Catalog

- [ ] New / Tops / Bottoms / Etc. category pages
- [ ] Search (predictive, full-screen overlay)
- [ ] Filters (category, size, color, availability, collection, price, sort)
- [ ] Product grid (unconventional layout per [DESIGN_SYSTEM.md §37–38](./DESIGN_SYSTEM.md#37-collection-page))
```

to:

```markdown
## Phase 4 — Catalog

- [x] New / Tops / Bottoms / Etc. category pages — seven routes (`/new`, `/tops(+/[subcategory])`, `/bottoms(+/[subcategory])`, `/etc(+/[subcategory])`), server-rendered against the typed Shopify client; see DECISIONS.md D-023 for the category→product-type query architecture
- [ ] Search (predictive, full-screen overlay) — deferred in full; see DECISIONS.md D-025
- [~] Filters (category, size, color, availability, collection, price, sort) — Category/Subcategory satisfied by routing; Sort (all four PROJECT.md §34 options), Availability, and Price range implemented as zero-JavaScript URL-driven filters, fixture-tested against the typed client; Size, Color, and Collection deferred — see DECISIONS.md D-024
- [x] Product grid (unconventional layout per [DESIGN_SYSTEM.md §37–38](./DESIGN_SYSTEM.md#37-collection-page)) — periodic featured/standard layout across the now-implemented 12/8/4-column responsive grid; the editorial-image insert from DESIGN_SYSTEM's illustrative example sequence is deferred until real campaign photography exists to place there
```

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add DECISIONS.md ROADMAP.md
git commit -m "Record D-023/D-024/D-025; mark Phase 4's completed and narrowed items"
```

---

### Task 10: Final validation pass and whole-branch review

**Files:** None created or modified — this task only runs checks and fixes any findings across everything Tasks 1-9 touched.

- [ ] **Step 1: Full validation suite, one more time, from a clean state**

```bash
rm -rf .next
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
```

Expected: all pass.

- [ ] **Step 2: Confirm codegen is reproducible from a clean state**

```bash
rm lib/shopify/storefront.generated.d.ts lib/shopify/storefront.types.d.ts
pnpm graphql-codegen
git diff --stat lib/shopify/storefront.generated.d.ts lib/shopify/storefront.types.d.ts
```

Expected: regenerates with no diff against what's committed (or, if there is a diff, that it's expected/benign — e.g. a schema-proxy timestamp — not a sign the committed files are stale; if genuinely different, commit the regenerated versions per D-017's routine-maintenance note).

- [ ] **Step 3: Confirm the app still runs correctly with Shopify unconfigured**

```bash
pnpm build && pnpm start &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tops
kill %1
```

Expected: a 307 (the access-gate proxy redirect, since no cookie is set) or, with a cookie, ultimately a 200-rendered error boundary — not a 500 or a hang. This confirms shipping the catalog routes with empty Shopify env vars (the actual current production state) doesn't break the already-running app, mirroring the equivalent check from the commerce-foundation plan.

- [ ] **Step 4: Review the full diff for the whole feature**

```bash
git log --oneline main~10..main
git diff main~10..main --stat
```

Confirm only the files this plan named changed, no stray debug code, no `console.log`, no `any`/`@ts-ignore`.

- [ ] **Step 5: Commit if Step 1-3 produced any changes**

```bash
git add -A
git commit -m "Final validation pass for the catalog phase"
```

If nothing changed, skip this step.

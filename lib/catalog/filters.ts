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

const SORT_KEY_BY_VALUE: Record<SortValue, { sortKey?: 'CREATED_AT' | 'PRICE'; reverse: boolean }> =
  {
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
  const sort =
    sortParam && SORT_VALUES.has(sortParam as SortValue) ? (sortParam as SortValue) : defaultSort;

  const available = firstValue(searchParams.available) === '1';
  const minPrice = parseNonNegativeNumber(firstValue(searchParams.minPrice));
  const maxPriceRaw = parseNonNegativeNumber(firstValue(searchParams.maxPrice));
  // A max below min is a contradictory range, not a valid filter — drop it
  // rather than silently querying a range no visitor intended (which would
  // read as "no products" instead of "ignored your typo").
  const maxPrice =
    maxPriceRaw !== undefined && minPrice !== undefined && maxPriceRaw < minPrice
      ? undefined
      : maxPriceRaw;

  return { sort, available, minPrice, maxPrice };
}

/** Shopify sortKey/reverse variables for a parsed sort value. */
export function getSortVariables(sort: SortValue): {
  sortKey?: 'CREATED_AT' | 'PRICE';
  reverse: boolean;
} {
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

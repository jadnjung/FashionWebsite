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

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

// Which top-level NAVIGATION entries correspond to a route that actually
// exists this far into the roadmap — NAVIGATION also lists /collections
// and /about (ROADMAP.md Phase 10/11+, not built yet). Read by
// app/sitemap.ts (which routes to list) and searchCategories below (which
// routes a search result may link to) — a single source of truth rather
// than two lists that could drift. Needs a new entry the day either of
// those ships as a real route. Relocated here from app/sitemap.ts
// (DECISIONS.md D-053: lib/ must not depend on app/, and this taxonomy
// module already owns every other piece of NAVIGATION-derived logic).
export const BUILT_CATEGORY_HREFS = new Set(['/new', '/tops', '/bottoms', '/etc']);

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

export interface ProductTypeCategory {
  category: CategorySlug;
  categoryLabel: string;
  subcategoryLabel: string;
  subcategoryHref: string;
}

/**
 * Reverse lookup: which category/subcategory a Shopify productType belongs
 * to (e.g. 'Hoodies' -> { category: 'tops', ... }). Used to build the PDP's
 * breadcrumb trail (SEO pass, ROADMAP.md Phase 12) from real taxonomy
 * rather than a fourth parallel mapping. Null when productType doesn't
 * match any known subcategory label — the same D-023 caveat applies (a
 * real store's productType strings might not exactly match NAVIGATION's
 * labels); callers degrade gracefully rather than erroring.
 */
export function getCategoryForProductType(productType: string): ProductTypeCategory | null {
  for (const entry of NAVIGATION) {
    const match = entry.subcategories?.find((s) => s.label === productType);
    if (match) {
      // Only NAVIGATION entries with subcategories ever reach here, and
      // those are exactly the built category routes (tops/bottoms/etc) —
      // narrow-cast at this single point, matching lib/shopify/products.ts's
      // established precedent (D-023) for crossing a string into a
      // narrower type once its provenance is known safe.
      const category = entry.href.slice(1) as CategorySlug;
      return {
        category,
        categoryLabel: entry.label,
        subcategoryLabel: match.label,
        subcategoryHref: match.href,
      };
    }
  }
  return null;
}

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
 * correctly. See DECISIONS.md D-058 and the design spec's Architecture
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

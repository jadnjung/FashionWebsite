import { getProducts, type ProductListItem } from '@/lib/shopify/products';

const SELECTED_PIECES_COUNT = 3;

/**
 * Fetches products for the homepage's Selected Pieces scene (DESIGN_SYSTEM.md
 * §33). Isolates the homepage's one Shopify dependency: a thrown error
 * (unconfigured store, throttled request, a malformed query — anything
 * getProducts itself correctly throws on rather than swallowing) resolves
 * to an empty list here instead of propagating to app/error.tsx. This is a
 * deliberate, narrow exception to this codebase's usual "never swallow a
 * real Shopify error" rule (see lib/shopify/products.ts, lib/product/*.ts):
 * PROJECT.md §22 frames the homepage as primarily a brand-world experience,
 * not a catalog, and six of its seven scenes have no Shopify dependency at
 * all — a transient Shopify failure must not take Collection Statement,
 * Categories, or Drop Status down with it. See DECISIONS.md D-033. Logs so
 * the failure stays operationally visible even though the page degrades
 * gracefully — no availability filtering: PROJECT.md §40 requires sold-out
 * products to remain visible, not hidden, so a sold-out piece may still be
 * "selected"; ProductCard's existing SOLD OUT badge already handles that.
 */
export async function getSelectedPieces(limit = SELECTED_PIECES_COUNT): Promise<ProductListItem[]> {
  try {
    const { products } = await getProducts({ first: limit });
    return products;
  } catch (error) {
    console.error('[home] Selected Pieces: Shopify fetch failed, omitting the section.', error);
    return [];
  }
}

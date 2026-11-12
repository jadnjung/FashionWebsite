import { getCategoryForProductType } from '@/lib/catalog/taxonomy';

export type PlaceholderShape = 'tee' | 'longsleeve' | 'pants' | 'generic';

// Subcategory labels (lib/navigation-data.ts) whose garments have long
// sleeves — every other top hangs as a tee.
const LONG_SLEEVE_TYPES = new Set(['Shirts', 'Hoodies', 'Sweaters', 'Jackets']);

/**
 * Picks the placeholder 3D garment silhouette for a product that has no
 * real GLB model yet (DECISIONS.md D-089), derived from the same
 * product-type taxonomy the catalog routes use (D-023) rather than a
 * parallel list. Anything outside TOPS/BOTTOMS (Hats, Jewelry, an
 * unrecognized type) gets a neutral generic form instead of a wrong guess.
 */
export function getPlaceholderShape(productType: string): PlaceholderShape {
  const match = getCategoryForProductType(productType);
  if (!match) return 'generic';
  if (match.category === 'bottoms') return 'pants';
  if (match.category === 'tops')
    return LONG_SLEEVE_TYPES.has(match.subcategoryLabel) ? 'longsleeve' : 'tee';
  return 'generic';
}

const GARMENT_TEXTURE_WIDTH = 768;

/**
 * Requests a texture-sized rendition of a Shopify CDN image for the
 * placeholder garment's front face — Shopify's image CDN resizes on its own
 * `width` parameter, and a full-resolution product photo would cost far
 * more bandwidth and GPU memory than a ~1-unit-wide garment ever displays.
 * Any other URL (Demo Mode's local fixtures) is returned unchanged.
 */
export function getGarmentTextureUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== 'cdn.shopify.com') return url;
  parsed.searchParams.set('width', String(GARMENT_TEXTURE_WIDTH));
  return parsed.toString();
}

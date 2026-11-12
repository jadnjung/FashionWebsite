import { getCategoryForProductType } from '@/lib/catalog/taxonomy';
import { isShopifyCdnUrl } from '@/lib/shopify/cdn';

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

// Demo Mode's local fixture photos (lib/shopify/preview-demo-fixtures.ts).
const DEMO_FIXTURE_PREFIX = '/preview-demo/';

/**
 * The URL the placeholder garment loads its front-face photo from, or null
 * when the image isn't from an allowed origin (the garment then renders
 * untextured). Fail-closed allowlist: Shopify's CDN — requested at a
 * texture-sized `width`, since a full-resolution product photo costs far
 * more bandwidth and GPU memory than a ~1-unit-wide garment ever displays —
 * or Demo Mode's local fixtures. three.js's TextureLoader fetches directly,
 * bypassing next/image's own remotePatterns check, so this is that check.
 */
export function getGarmentTextureUrl(url: string): string | null {
  if (url.startsWith(DEMO_FIXTURE_PREFIX) && !url.includes('..')) return url;
  if (!isShopifyCdnUrl(url)) return null;
  const parsed = new URL(url);
  parsed.searchParams.set('width', String(GARMENT_TEXTURE_WIDTH));
  return parsed.toString();
}

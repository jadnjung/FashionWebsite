import { buildProductSearchQuery } from '@/lib/catalog/filters';
import { getCategoryProductTypes, type CategorySlug } from '@/lib/catalog/taxonomy';
import { getProduct, getProducts, type ProductDetail } from '@/lib/shopify/products';

export type HotspotRegion = 'top' | 'bottom';

export interface InteractiveModelGarment {
  region: HotspotRegion;
  regionLabel: string;
  product: ProductDetail;
}

interface RegionConfig {
  region: HotspotRegion;
  regionLabel: string;
  category: CategorySlug;
}

// DECISIONS.md D-034 — each hotspot region binds to one representative
// real product of its garment category (the same product-type query
// mechanism category pages already use, D-023), not a curated per-photo
// "look." Exactly two regions for Collection 001's real catalog (Tops,
// Bottoms) — see the design spec's Non-Goals for why not a third "Etc."
// region; adding one later is one more entry here.
export const HOTSPOT_REGIONS: readonly RegionConfig[] = [
  { region: 'top', regionLabel: 'Top', category: 'tops' },
  { region: 'bottom', regionLabel: 'Bottom', category: 'bottoms' },
];

async function resolveRegion(config: RegionConfig): Promise<InteractiveModelGarment | null> {
  const productTypes = getCategoryProductTypes(config.category);
  const { products } = await getProducts({
    query: buildProductSearchQuery({ productTypes }),
    first: 1,
  });
  const summary = products[0];
  if (!summary) return null;

  const product = await getProduct(summary.handle);
  if (!product) return null;

  return { region: config.region, regionLabel: config.regionLabel, product };
}

/**
 * Resolves the Interactive Model's current "look": one real product per
 * hotspot region. Regions are resolved concurrently (independent queries —
 * no reason to serialize them). Isolates this feature's Shopify dependency
 * exactly like getSelectedPieces (DECISIONS.md D-033): a thrown error
 * (unconfigured store, throttled request, a malformed query) is logged and
 * resolved to an empty list rather than propagating. A region with no
 * matching product is simply omitted, not an error — the caller
 * (InteractiveModel) falls back to the existing static placeholder unless
 * every configured region resolved (see DECISIONS.md D-034).
 */
export async function getInteractiveModelLook(): Promise<InteractiveModelGarment[]> {
  try {
    const resolved = await Promise.all(HOTSPOT_REGIONS.map(resolveRegion));
    return resolved.filter((garment): garment is InteractiveModelGarment => garment !== null);
  } catch (error) {
    console.error(
      '[interactive-model] Look: Shopify fetch failed, falling back to the placeholder.',
      error,
    );
    return [];
  }
}

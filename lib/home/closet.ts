import { getDropPhase } from '@/lib/collections/drop-phase';
import { getCollections } from '@/lib/shopify/collections';
import { getClosetProducts, type ClosetProduct } from '@/lib/shopify/products';

export interface ClosetCollection {
  handle: string;
  title: string;
  products: ClosetProduct[];
}

/**
 * Fetches the current collection and its products for the homepage's
 * Collection Closet (Scene 01, DECISIONS.md D-089). "Current" is the first
 * collection getDropPhase classifies as neither upcoming nor archived — the
 * same lifecycle rule /collections and /archive already use, so the closet
 * can never hang an upcoming drop's withheld pieces before its date.
 *
 * Same isolation contract as getSelectedPieces (DECISIONS.md D-033): any
 * Shopify failure resolves to null and is logged, so the hero falls back
 * to its static poster rather than taking the homepage down.
 */
export async function getClosetCollection(
  now: Date = new Date(),
): Promise<ClosetCollection | null> {
  try {
    const { collections } = await getCollections();
    const current = collections.find((collection) => getDropPhase(collection, now) === 'current');
    if (!current) return null;

    const products = await getClosetProducts(current.handle);
    if (!products || products.length === 0) return null;

    return { handle: current.handle, title: current.title, products };
  } catch (error) {
    console.error(
      '[home] Collection Closet: Shopify fetch failed, showing the static hero.',
      error,
    );
    return null;
  }
}

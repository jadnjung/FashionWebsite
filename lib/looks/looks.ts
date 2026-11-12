import { getLooks, type Look } from '@/lib/shopify/looks';

/**
 * The homepage "Shop the Look" ring's looks (DECISIONS.md D-091). Same
 * isolation contract as getSelectedPieces (D-033): any Shopify failure is
 * logged and resolves to an empty list, so the section falls back to its
 * placeholder instead of taking the homepage down.
 */
export async function getHomepageLooks(): Promise<Look[]> {
  try {
    return await getLooks();
  } catch (error) {
    console.error('[home] Shop the Look: Shopify fetch failed, showing the placeholder.', error);
    return [];
  }
}

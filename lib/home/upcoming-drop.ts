import { isCollectionUpcoming } from '@/lib/collections/drop-phase';
import { getCollections } from '@/lib/shopify/collections';

export interface UpcomingDrop {
  handle: string;
  title: string;
  dropDate: string;
}

/**
 * Fetches the one upcoming collection (if any) for the homepage's Drop
 * Status scene (DESIGN_SYSTEM.md §35). Mirrors
 * lib/home/selected-pieces.ts's getSelectedPieces shape exactly
 * (DECISIONS.md D-033's swallow-to-safe-fallback exception): a thrown
 * error (unconfigured store, throttled request) resolves to null here
 * instead of propagating to app/error.tsx, since the homepage's Drop
 * Status copy already renders correctly with nothing extra when there's
 * no upcoming drop — the same honest default this environment already
 * produces today. Logs so the failure stays operationally visible.
 *
 * PROJECT.md §7's business model is strictly sequential (never more than
 * one upcoming collection in practice), so the first match is returned
 * without needing to disambiguate multiple candidates.
 */
export async function getUpcomingDrop(): Promise<UpcomingDrop | null> {
  try {
    const { collections } = await getCollections();
    const upcoming = collections.find((collection) => isCollectionUpcoming(collection));
    if (!upcoming?.dropDate) return null;
    return { handle: upcoming.handle, title: upcoming.title, dropDate: upcoming.dropDate };
  } catch (error) {
    console.error(
      '[home] Drop Status: Shopify fetch failed, omitting the upcoming-drop link.',
      error,
    );
    return null;
  }
}

import { getCollections, type CollectionSummary } from '@/lib/shopify/collections';

const COLLECTION_SCAN_PAGES = 50;
const COLLECTION_SCAN_DEADLINE_MS = 10_000;

/** First eligible collection in source order, within one bounded discovery request. */
export async function findHomeCollection(
  eligible: (collection: CollectionSummary) => boolean,
): Promise<CollectionSummary | null> {
  const controller = new AbortController();
  const deadline = setTimeout(
    () => controller.abort(new Error('Shopify collection discovery timed out.')),
    COLLECTION_SCAN_DEADLINE_MS,
  );
  const cursors = new Set<string>();
  const ids = new Set<string>();
  let after: string | undefined;
  try {
    for (let pageNumber = 0; pageNumber < COLLECTION_SCAN_PAGES; pageNumber++) {
      controller.signal.throwIfAborted();
      const page = await getCollections(20, after, controller.signal);
      controller.signal.throwIfAborted();
      if (page.hasNextPage && (!page.endCursor || cursors.has(page.endCursor))) {
        throw new Error('Shopify collection pagination did not advance.');
      }
      for (const collection of page.collections) {
        if (ids.has(collection.id)) continue;
        ids.add(collection.id);
        if (eligible(collection)) return collection;
      }
      if (!page.hasNextPage) return null;
      cursors.add(page.endCursor!);
      after = page.endCursor!;
    }
    throw new Error('Shopify collection discovery exceeded its page budget.');
  } finally {
    controller.abort();
    clearTimeout(deadline);
  }
}

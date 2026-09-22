import { getCollection, getCollections } from '@/lib/shopify/collections';
import type { CollectionDetail, CollectionSummary } from '@/lib/shopify/collections';

/**
 * True when a collection is archived. Either signal alone is sufficient
 * (an OR, not an AND) — deliberately defensive: `dropStatus` (the
 * `custom.drop_status` metafield) is the named, primary status field;
 * `archivedAt` (`custom.archived_at`) is corroborating date evidence. A
 * real merchandiser who sets one without the other (forgets to flip the
 * status flag, or vice versa) is still detected correctly. Case-
 * insensitive on `dropStatus` — the real store's exact string values are
 * unverified (same caveat as DECISIONS.md D-023's productType strings).
 * A pure function, unit-tested directly.
 */
export function isCollectionArchived(
  collection: Pick<CollectionSummary, 'dropStatus' | 'archivedAt'>,
): boolean {
  return collection.dropStatus?.toLowerCase() === 'archived' || collection.archivedAt !== null;
}

/**
 * Fetches every archived collection (ROADMAP.md Phase 11's `/archive`
 * index). Deliberately does NOT catch a thrown error the way
 * lib/home/selected-pieces.ts's getSelectedPieces does (DECISIONS.md
 * D-033) — that exception is justified specifically because six of the
 * homepage's seven scenes have no Shopify dependency at all, so one
 * failing curated section shouldn't take the rest of the page down.
 * `/archive` has no such other content: the commerce data (which
 * collections are archived) *is* the page's entire reason for existing,
 * exactly like category pages and the PDP, so a thrown error (unconfigured
 * store, throttled request) correctly propagates to app/error.tsx.
 */
export async function getArchivedCollections(first = 20): Promise<CollectionSummary[]> {
  const { collections } = await getCollections(first);
  return collections.filter(isCollectionArchived);
}

/**
 * Fetches one archived collection by handle, for `/archive/[handle]`.
 * Returns null both when no collection matches the handle AND when the
 * handle resolves to a real, non-archived collection (e.g. the current,
 * purchasable collection) — a deliberate correctness decision, not an
 * oversight: without it, `/archive/collection-001` could render with a
 * fabricated UNAVAILABLE treatment for a collection that is, in fact,
 * fully purchasable via /products/[handle] today. Treating "exists but
 * isn't archived" the same as "doesn't exist" mirrors DECISIONS.md D-026's
 * honest not-found handling rather than inventing a third response type.
 * Deliberately does NOT catch a thrown error — same reasoning as
 * getArchivedCollections above.
 */
export async function getArchivedCollection(handle: string): Promise<CollectionDetail | null> {
  const collection = await getCollection(handle);
  if (!collection || !isCollectionArchived(collection)) return null;
  return collection;
}

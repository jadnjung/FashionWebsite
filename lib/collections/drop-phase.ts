import { isCollectionArchived } from '@/lib/archive/collections';
import type { CollectionSummary } from '@/lib/shopify/collections';

export type DropPhase = 'current' | 'upcoming' | 'archived';

type DropPhaseInput = Pick<CollectionSummary, 'dropStatus' | 'archivedAt'> & {
  dropDate?: string | null;
};

/**
 * Classifies a collection's lifecycle phase for the drop-gate route
 * (app/(storefront)/collections/[handle]/page.tsx) and the homepage's
 * upcoming-drop link (lib/home/upcoming-drop.ts). Deliberately introduces
 * no new metafield/status value: "upcoming" is derived purely from
 * `dropDate` being in the future — the field already exists on both
 * CollectionSummary/CollectionDetail and already flows through both
 * queries, so a second, redundant signal (a `dropStatus === 'upcoming'`
 * value) would just be another string a merchandiser could forget to set
 * correctly.
 *
 * `now` is an injected parameter (defaults to `new Date()`) — mirrors this
 * codebase's established injected-dependency-for-testability pattern
 * (lib/motion/media.ts's injected matchMedia, lib/analytics/events.ts's
 * injected sink) so "is this collection upcoming" is deterministically
 * unit-testable against a fixed reference time, not real wall-clock time.
 *
 * Archived wins over upcoming: an internally-contradictory data state (a
 * collection marked archived but still carrying a future dropDate) should
 * never be treated as a live teaser. isCollectionArchived is imported
 * from lib/archive/collections.ts, not reimplemented — this module is a
 * sibling domain to it (both derive a lifecycle fact from the same
 * metafields), not a replacement.
 */
export function getDropPhase(collection: DropPhaseInput, now: Date = new Date()): DropPhase {
  if (isCollectionArchived(collection)) return 'archived';
  if (collection.dropDate && new Date(collection.dropDate) > now) return 'upcoming';
  return 'current';
}

export function isCollectionUpcoming(collection: DropPhaseInput, now: Date = new Date()): boolean {
  return getDropPhase(collection, now) === 'upcoming';
}

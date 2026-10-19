import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCollectionHref, getDropPhase } from '@/lib/collections/drop-phase';
import { buildBreadcrumbJsonLd } from '@/lib/seo/structured-data';
import { getCollections } from '@/lib/shopify/collections';

// Mirrors app/(storefront)/collections/[handle]/DropCountdown.tsx's own
// formatTargetDate exactly (UTC pinned deliberately — see its comment: the
// value must render byte-identical between the server and the client's
// first hydration pass, which matters there because that component is
// interactive). This index has no hydration boundary of its own (no 'use
// client' anywhere in this file) and needs only a static string from a
// raw ISO date, not a live ticking countdown — not worth importing from or
// restructuring that client component's exports for one line of shared
// formatting logic. A real behavior change to one must be considered for
// the other, but they're deliberately not wired together.
function formatDropDate(dropDate: string): string {
  return new Date(dropDate)
    .toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

// Async Server Component for /collections — the index of every real
// collection: current, upcoming, AND archived alike (PROJECT.md §90 lists
// this as its own sitemap entry, distinct from /collections/[handle]).
// Fetches getCollections(); the Shopify error path is not caught here
// (matching ArchiveIndex's identical precedent for /archive), so a thrown
// error correctly propagates to app/error.tsx, like every other
// Shopify-dependent route.
export async function CollectionsIndex() {
  const { collections } = await getCollections();

  return (
    <div className="flex flex-col gap-8 px-4 py-12 md:px-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Collections', path: '/collections' },
        ])}
      />
      <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
        COLLECTIONS
      </h1>
      {collections.length === 0 ? (
        // An unlikely edge case (no Shopify collections exist at all),
        // handled defensively rather than rendering an empty list. CONTENT.md
        // §7 has no dedicated phrase for this situation, so this reuses
        // CollectionView.tsx/ArchivedCollectionView.tsx's exact existing
        // "NOTHING HERE YET." empty-state treatment for consistency, rather
        // than inventing new copy.
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="font-display text-heading-3 uppercase text-esque-text">NOTHING HERE YET.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {collections.map((collection) => {
            const phase = getDropPhase(collection);
            return (
              <li key={collection.id} className="flex flex-col gap-1">
                <Link
                  href={getCollectionHref(collection)}
                  className="font-display text-heading-2 uppercase tracking-display text-esque-text hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
                >
                  {collection.title}
                </Link>
                {/* `current` is the default, "shop now" state — no badge,
                    matching ArchiveIndex's own restraint (its entries carry
                    no status text either, since its heading already implies
                    it). Only the two non-default phases get a status line. */}
                {phase === 'upcoming' && collection.dropDate && (
                  <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
                    LAUNCHES {formatDropDate(collection.dropDate)}
                  </p>
                )}
                {phase === 'archived' && (
                  // PROJECT.md §40's established "SOLD OUT or ARCHIVED"
                  // status vocabulary — not invented copy.
                  <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
                    ARCHIVED
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

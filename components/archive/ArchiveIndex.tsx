import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { getArchivedCollections } from '@/lib/archive/collections';
import { buildBreadcrumbJsonLd } from '@/lib/seo/structured-data';

// Async Server Component for /archive — the index of archived collections
// (like CategoryListing). Fetches getArchivedCollections(); the Shopify
// error path is not caught here (nor in lib/archive/collections.ts — see
// its own comments), so a thrown error correctly propagates to
// app/error.tsx, matching every other Shopify-dependent route.
export async function ArchiveIndex() {
  const collections = await getArchivedCollections();

  return (
    <div className="flex flex-col gap-8 px-4 py-12 md:px-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Archive', path: '/archive' },
        ])}
      />
      <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
        ARCHIVE
      </h1>
      {collections.length === 0 ? (
        // CONTENT.md §7's exact empty-state copy — no additional copy or
        // CTA is invented beyond what's specified there.
        <p className="font-display text-heading-3 uppercase tracking-display text-esque-text">
          THE ARCHIVE BEGINS HERE.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                href={`/archive/${collection.handle}`}
                className="font-display text-heading-2 uppercase tracking-display text-esque-text hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
              >
                {collection.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

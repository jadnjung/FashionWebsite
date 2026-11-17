import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { getArchivedCollections } from '@/lib/archive/collections';
import { buildBreadcrumbJsonLd } from '@/lib/seo/structured-data';
import { CollectionsPagination } from '@/components/catalog/CollectionsPagination';

// Async Server Component for /archive — the index of archived collections
// (like CategoryListing). Fetches getArchivedCollections(); the Shopify
// error path is not caught here (nor in lib/archive/collections.ts — see
// its own comments), so a thrown error correctly propagates to
// app/error.tsx, matching every other Shopify-dependent route.
export async function ArchiveIndex({ after }: { after?: string } = {}) {
  const page = await getArchivedCollections(20, after);
  const { collections } = page;

  return (
    <div className="flex flex-col gap-8 px-4 py-12 md:px-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Archive', path: '/archive' },
        ])}
      />
      <h1
        id="collection-results"
        tabIndex={-1}
        className="scroll-mt-6 font-display text-display-l uppercase tracking-display text-esque-text"
      >
        ARCHIVE
      </h1>
      {collections.length === 0 ? (
        <p className="font-display text-heading-3 uppercase tracking-display text-esque-text">
          {after || page.hasNextPage
            ? 'NO ARCHIVED COLLECTIONS ON THIS PAGE.'
            : 'THE ARCHIVE BEGINS HERE.'}
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
      <CollectionsPagination pathname="/archive" after={after} page={page} />
    </div>
  );
}

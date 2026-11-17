import Link from 'next/link';
import type { CollectionsPage } from '@/lib/shopify/collections';

export function CollectionsPagination({
  pathname,
  after,
  page,
}: {
  pathname: '/collections' | '/archive';
  after?: string;
  page: CollectionsPage;
}) {
  const count = page.collections.length;
  return (
    <div className="flex flex-col gap-4 text-utility text-esque-text-secondary">
      <p role="status">
        {count} {count === 1 ? 'collection' : 'collections'} on this page.
      </p>
      <nav aria-label="Collection pages" className="flex flex-wrap items-center gap-6">
        {after && (
          <Link
            className="inline-flex min-h-11 items-center underline"
            href={`${pathname}#collection-results`}
          >
            First page
          </Link>
        )}
        {page.hasNextPage && page.endCursor ? (
          <Link
            className="inline-flex min-h-11 items-center underline"
            href={`${pathname}?${new URLSearchParams({ after: page.endCursor })}#collection-results`}
          >
            Next collections
          </Link>
        ) : (
          count > 0 && <p>End of results.</p>
        )}
      </nav>
    </div>
  );
}

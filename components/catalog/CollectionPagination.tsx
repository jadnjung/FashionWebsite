import Link from 'next/link';

export function CollectionPagination({
  pathname,
  after,
  count,
  hasNextPage,
  endCursor,
}: {
  pathname: string;
  after?: string;
  count: number;
  hasNextPage: boolean;
  endCursor?: string | null;
}) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-10 text-utility text-esque-text-secondary md:px-8">
      <p role="status">
        {count} {count === 1 ? 'piece' : 'pieces'} on this page.
      </p>
      <nav aria-label="Collection product pages" className="flex flex-wrap items-center gap-6">
        {after && (
          <Link className="inline-flex min-h-11 items-center underline" href={pathname}>
            First page
          </Link>
        )}
        {hasNextPage && endCursor ? (
          <Link
            className="inline-flex min-h-11 items-center underline"
            href={`${pathname}?${new URLSearchParams({ after: endCursor })}#collection-results`}
          >
            Next products
          </Link>
        ) : (
          count > 0 && <p>End of results.</p>
        )}
      </nav>
    </div>
  );
}

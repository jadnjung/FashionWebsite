import Link from 'next/link';
import { buildSearchHref } from '@/lib/search/links';
import type { SearchState, SearchPage } from '@/lib/search/results';

export function SearchPagination({
  group,
  state,
  page,
}: {
  group: 'products' | 'collections';
  state: SearchState;
  page: Pick<SearchPage<unknown>, 'hasNextPage' | 'endCursor'>;
}) {
  const key = group === 'products' ? 'productAfter' : 'collectionAfter';
  const anchor = `#search-${group}`;
  return (
    <nav
      aria-label={`${group === 'products' ? 'Product' : 'Collection'} search pages`}
      className="flex min-h-11 flex-wrap items-center gap-6 text-utility text-esque-text-secondary"
    >
      {state[key] && (
        <Link
          className="inline-flex min-h-11 items-center underline"
          href={`${buildSearchHref(state.query, { ...state, [key]: undefined })}${anchor}`}
        >
          First {group} page
        </Link>
      )}
      {page.hasNextPage && page.endCursor && (
        <Link
          className="inline-flex min-h-11 items-center underline"
          href={`${buildSearchHref(state.query, { ...state, [key]: page.endCursor })}${anchor}`}
        >
          Next {group}
        </Link>
      )}
    </nav>
  );
}

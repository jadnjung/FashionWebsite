import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { SearchPagination } from '@/components/search/SearchPagination';
import { getCollectionHref } from '@/lib/collections/drop-phase';
import { searchCategories } from '@/lib/catalog/taxonomy';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildSearchHref } from '@/lib/search/links';
import {
  getFullSearchResults,
  parseSearchState,
  type FullSearchResults,
} from '@/lib/search/results';
import { MIN_SEARCH_QUERY_LENGTH, MAX_SEARCH_QUERY_LENGTH } from '@/lib/search-query';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Search — Esque',
    description: 'Search Esque products and collections.',
    path: '/search',
  }),
  robots: { index: false, follow: true },
  referrer: 'origin',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = parseSearchState(await searchParams);
  const categories = state.valid ? searchCategories(state.query) : [];
  let results: FullSearchResults | null = null;
  let failed = false;
  if (state.valid) {
    try {
      results = await getFullSearchResults(state);
    } catch {
      console.error('[search] Results lookup failed.');
      failed = true;
    }
  }
  const invalid = state.repeatedQuery || Boolean(state.query && !state.valid);
  const empty =
    results &&
    !results.products.items.length &&
    !results.collections.items.length &&
    !categories.length &&
    !results.products.hasNextPage &&
    !results.collections.hasNextPage &&
    !state.productAfter &&
    !state.collectionAfter;

  return (
    <div className="flex min-w-0 flex-col gap-10 px-4 py-12 md:px-8">
      <h1
        id="search-results"
        tabIndex={-1}
        className="scroll-mt-6 font-display text-display-l uppercase tracking-display text-esque-text"
      >
        SEARCH
      </h1>
      <form action="/search" method="get" role="search" className="flex flex-col items-start gap-4">
        <label
          htmlFor="full-search-query"
          className="text-utility uppercase tracking-metadata text-esque-text-secondary"
        >
          Search query
        </label>
        <input
          key={state.query}
          id="full-search-query"
          type="search"
          name="q"
          defaultValue={state.query}
          required
          minLength={MIN_SEARCH_QUERY_LENGTH}
          maxLength={MAX_SEARCH_QUERY_LENGTH}
          autoComplete="off"
          aria-invalid={invalid || undefined}
          aria-describedby="full-search-guidance"
          className="w-full max-w-3xl border border-esque-text-secondary bg-transparent px-4 py-3 text-body text-esque-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        />
        <p
          id="full-search-guidance"
          className="text-utility text-esque-text-secondary"
          role={invalid ? 'alert' : undefined}
        >
          {state.repeatedQuery
            ? 'Enter one search query.'
            : `Enter ${MIN_SEARCH_QUERY_LENGTH}–${MAX_SEARCH_QUERY_LENGTH} characters to search.`}
        </p>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center border border-esque-text px-6 py-3 text-utility uppercase tracking-nav text-esque-text hover:bg-esque-text hover:text-esque-black"
        >
          Search
        </button>
      </form>

      {categories.length > 0 && (
        <section aria-labelledby="search-categories">
          <h2
            id="search-categories"
            className="mb-4 text-utility uppercase tracking-metadata text-esque-text-secondary"
          >
            Categories
          </h2>
          <ul className="flex flex-col gap-3">
            {categories.map((category) => (
              <li key={category.href}>
                <Link
                  href={category.href}
                  className="inline-flex min-h-11 items-center text-body text-esque-text underline"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {failed && (
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="font-display text-heading-3 uppercase text-esque-text">
            COULD NOT LOAD RESULTS.
          </p>
          <a
            href={`${buildSearchHref(state.query, state)}#search-results`}
            className="inline-flex min-h-11 items-center text-utility text-esque-text underline"
          >
            Retry
          </a>
        </div>
      )}

      {results && (
        <>
          <p role="status" className="text-utility text-esque-text-secondary">
            {results.products.items.length} products and {results.collections.items.length}{' '}
            collections on this page.
          </p>
          {empty && (
            <p className="font-display text-heading-3 uppercase text-esque-text">
              NOTHING MATCHES.
            </p>
          )}
          <section aria-labelledby="search-products" className="flex flex-col gap-6">
            <h2
              id="search-products"
              tabIndex={-1}
              className="scroll-mt-6 font-display text-heading-2 uppercase tracking-display text-esque-text"
            >
              Products
            </h2>
            <p className="text-utility text-esque-text-secondary">
              {results.products.items.length} products on this page.
            </p>
            <p className="text-utility text-esque-text-secondary">
              Product search shows up to 1,000 matches. Refine your query to narrow the results.
            </p>
            {results.products.items.length ? (
              <ProductGrid products={results.products.items} priorityFirstImage />
            ) : (
              !empty && (
                <p className="text-body text-esque-text-secondary">
                  {state.productAfter || results.products.hasNextPage
                    ? 'NO PRODUCTS ON THIS PAGE.'
                    : 'NO MATCHING PRODUCTS.'}
                </p>
              )
            )}
            <SearchPagination group="products" state={state} page={results.products} />
          </section>
          <section aria-labelledby="search-collections" className="flex flex-col gap-6">
            <h2
              id="search-collections"
              tabIndex={-1}
              className="scroll-mt-6 font-display text-heading-2 uppercase tracking-display text-esque-text"
            >
              Collections
            </h2>
            <p className="text-utility text-esque-text-secondary">
              {results.collections.items.length} collections on this page.
            </p>
            {results.collections.items.length ? (
              <ul className="flex flex-col gap-3">
                {results.collections.items.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      href={getCollectionHref(collection)}
                      className="inline-flex min-h-11 items-center font-display text-heading-3 uppercase tracking-display text-esque-text hover:text-esque-text-secondary"
                    >
                      {collection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              !empty && (
                <p className="text-body text-esque-text-secondary">
                  {state.collectionAfter || results.collections.hasNextPage
                    ? 'NO COLLECTIONS ON THIS PAGE.'
                    : 'NO MATCHING COLLECTIONS.'}
                </p>
              )
            )}
            <SearchPagination group="collections" state={state} page={results.collections} />
          </section>
        </>
      )}
    </div>
  );
}

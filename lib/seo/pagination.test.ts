import { afterEach, expect, test, vi } from 'vitest';
import { generateMetadata as newMetadata } from '@/app/(storefront)/new/page';
import { generateMetadata as collectionMetadata } from '@/app/(storefront)/collections/[handle]/page';
import { generateMetadata as archiveMetadata } from '@/app/(storefront)/archive/[handle]/page';
import { getCatalogPage } from '@/lib/catalog/products';
import { parseCatalogFilters, type CatalogSearchParams } from '@/lib/catalog/filters';
import type { Metadata } from 'next';

afterEach(() => vi.unstubAllEnvs());

test('new inventory continuation has a distinct canonical and ignores tracking and facet pagination', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  const first = await getCatalogPage(null, parseCatalogFilters({}, 'newest'));
  const cursor = first.endCursor!;
  const metadata = await newMetadata({
    searchParams: Promise.resolve({ after: cursor, utm_source: 'test', optionsAfter: 'unused' }),
  });
  expect(metadata.alternates?.canonical).toBe(`/new?after=${encodeURIComponent(cursor)}`);
  expect(metadata.openGraph?.url).toBe(`/new?after=${encodeURIComponent(cursor)}`);
});

test('filtered and alternative-sort continuations retain the parameter-free category canonical', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  for (const criteria of [{ available: '1' }, { sort: 'price-asc' }, { size: 'M' }]) {
    const first = await getCatalogPage(null, parseCatalogFilters(criteria, 'newest'));
    expect(
      (
        await newMetadata({
          searchParams: Promise.resolve({ ...criteria, after: first.endCursor! }),
        })
      ).alternates?.canonical,
    ).toBe('/new');
  }
});

test('malformed and query-mismatched category cursors canonicalize the restarted first page', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  const changedQuery = await getCatalogPage(
    null,
    parseCatalogFilters({ sort: 'featured' }, 'newest'),
  );
  for (const after of ['malformed', changedQuery.endCursor!, 'x'.repeat(4097)]) {
    expect(
      (await newMetadata({ searchParams: Promise.resolve({ after }) })).alternates?.canonical,
    ).toBe('/new');
  }
});

test.each([
  ['collections', 'collection-001', collectionMetadata],
  ['archive', 'collection-000', archiveMetadata],
] as const)(
  '%s continuation canonical matches its actual cursor and malformed cursors restart',
  async (section, handle, generate) => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const metadata = generate as (props: {
      params: Promise<{ handle: string }>;
      searchParams: Promise<CatalogSearchParams>;
    }) => Promise<Metadata>;
    for (const [after, suffix] of [
      ['preview:2', '?after=preview%3A2'],
      ['malformed', ''],
      ['preview:0', ''],
    ] as const) {
      const result = await metadata({
        params: Promise.resolve({ handle }),
        searchParams: Promise.resolve({ after, utm_source: 'test' }),
      });
      expect(result.alternates?.canonical).toBe(`/${section}/${handle}${suffix}`);
    }
  },
);

import { afterEach, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getFullSearchResults, parseSearchState, buildCollectionSearchQuery } from './results';
import { buildSearchHref } from './links';
import { SearchPagination } from '@/components/search/SearchPagination';
import { PREVIEW_PRODUCTS, getPreviewCollections } from '@/lib/shopify/preview-demo-fixtures';
import * as client from '@/lib/shopify/client';
import SearchPage, { metadata } from '@/app/(storefront)/search/page';

afterEach(() => vi.restoreAllMocks());

function liveResponse() {
  const product = structuredClone(PREVIEW_PRODUCTS[0]);
  return {
    data: {
      products: {
        edges: [
          {
            cursor: 'product-next',
            node: {
              __typename: 'Product',
              ...product,
              priceRange: { minVariantPrice: product.minPrice },
              images: { edges: product.images.map((node) => ({ node })) },
            },
          },
        ],
        pageInfo: { hasNextPage: true, endCursor: 'product-next' },
      },
      collections: {
        edges: [
          {
            cursor: 'collection-next',
            node: {
              id: 'archived',
              handle: 'collection-000',
              title: 'Collection 000',
              dropStatus: { value: 'archived' },
              dropDate: null,
              archivedAt: { value: '2026-01-01T00:00:00Z' },
            },
          },
        ],
        pageInfo: { hasNextPage: true, endCursor: 'collection-next' },
      },
    },
  };
}

test.each([
  'product-id',
  'product-handle',
  'product-title',
  'product-money',
  'product-media',
  'collection-id',
  'collection-handle',
  'collection-title',
])('malformed %s fails the combined page and a fresh valid read recovers', async (field) => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  const malformed = liveResponse();
  const product = malformed.data.products.edges[0].node;
  const collection = malformed.data.collections.edges[0].node;
  if (field === 'product-id') product.id = '';
  if (field === 'product-handle') product.handle = '';
  if (field === 'product-title') product.title = '';
  if (field === 'product-money') product.priceRange.minVariantPrice.amount = 'invalid';
  if (field === 'product-media') product.images.edges[0].node.url = '';
  if (field === 'collection-id') collection.id = '';
  if (field === 'collection-handle') collection.handle = '';
  if (field === 'collection-title') collection.title = '';
  const request = vi.fn().mockResolvedValueOnce(malformed).mockResolvedValueOnce(liveResponse());
  vi.spyOn(client, 'getStorefrontClient').mockReturnValue({ request } as unknown as ReturnType<
    typeof client.getStorefrontClient
  >);
  const state = parseSearchState({ q: 'crewneck' });
  await expect(getFullSearchResults(state)).rejects.toThrow('malformed');
  expect((await getFullSearchResults(state))?.products.items).toHaveLength(1);
});

test('actual SDK transport maps both live groups and forwards each decoded continuation independently', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'synthetic.myshopify.com');
  vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'synthetic-public-token');
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(liveResponse()))
    .mockResolvedValueOnce(
      Response.json({
        data: {
          products: { edges: [], pageInfo: { hasNextPage: false } },
          collections: { edges: [], pageInfo: { hasNextPage: false } },
        },
      }),
    );
  vi.stubGlobal('fetch', fetch);
  try {
    const first = (await getFullSearchResults(parseSearchState({ q: 'crewneck' })))!;
    expect(first.products.items).toEqual([PREVIEW_PRODUCTS[0]]);
    expect(first.collections.items).toEqual([
      {
        id: 'archived',
        handle: 'collection-000',
        title: 'Collection 000',
        dropStatus: 'archived',
        dropDate: null,
        archivedAt: '2026-01-01T00:00:00Z',
      },
    ]);
    await getFullSearchResults(
      parseSearchState({
        q: 'crewneck',
        productAfter: first.products.endCursor!,
        collectionAfter: first.collections.endCursor!,
      }),
    );
    expect(JSON.parse(String(fetch.mock.calls[1][1].body)).variables).toEqual({
      query: 'crewneck',
      collectionQuery: 'title:crewneck*',
      first: 20,
      productAfter: 'product-next',
      collectionAfter: 'collection-next',
    });
  } finally {
    vi.unstubAllGlobals();
  }
});

test('the combined SDK request has a ten-second budget, preserves cancellation, and recovers to populated groups', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'synthetic.myshopify.com');
  vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'synthetic-public-token');
  vi.useFakeTimers();
  const fetch = vi
    .fn()
    .mockImplementationOnce(() => new Promise<Response>(() => {}))
    .mockResolvedValueOnce(Response.json(liveResponse()));
  vi.stubGlobal('fetch', fetch);
  try {
    const outcome = expect(
      getFullSearchResults(parseSearchState({ q: 'crewneck' })),
    ).rejects.toThrow('Shopify Storefront API request failed');
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
    expect(
      (await getFullSearchResults(parseSearchState({ q: 'crewneck' })))?.products.items,
    ).toHaveLength(1);
    const controller = new AbortController();
    controller.abort(new Error('Synthetic search cancellation'));
    await expect(
      getFullSearchResults(parseSearchState({ q: 'crewneck' }), controller.signal),
    ).rejects.toThrow('Synthetic search cancellation');
    expect(fetch).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});

test('invalid or repeated queries never perform a Storefront lookup and metadata remains generic', async () => {
  const read = vi.spyOn(client, 'getStorefrontClient');
  for (const q of [undefined, '', 'x', 'a'.repeat(101), ['demo', 'preview']]) {
    const state = parseSearchState({ q });
    expect(state.valid).toBe(false);
    expect(await getFullSearchResults(state)).toBeNull();
    await SearchPage({ searchParams: Promise.resolve({ q }) });
  }
  expect(read).not.toHaveBeenCalled();
  expect(metadata.robots).toEqual({ index: false, follow: true });
  expect(metadata.alternates?.canonical).toBe('/search');
  expect(metadata.openGraph?.url).toBe('/search');
  expect(metadata.title).toBe('Search — Esque');
});

test.each(['demo', 'preview'])(
  'full %s search reaches every expected canonical product exactly once',
  async (q) => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const expected =
      q === 'demo'
        ? PREVIEW_PRODUCTS.filter((product) => product.title.toLowerCase().includes(q))
        : PREVIEW_PRODUCTS;
    expect(expected.length).toBeGreaterThanOrEqual(q === 'demo' ? 7 : 30);
    const ids: string[] = [];
    let productAfter: string | undefined;
    do {
      const results = (await getFullSearchResults(parseSearchState({ q, productAfter })))!;
      ids.push(...results.products.items.map((product) => product.id));
      productAfter = results.products.hasNextPage ? results.products.endCursor! : undefined;
    } while (productAfter);
    expect(ids).toEqual(expected.map((product) => product.id));
    expect(new Set(ids).size).toBe(expected.length);
    expect(ids).toContain('preview-scenario-21');
  },
);

test('both group cursors preserve their independent page while each collection remains reachable', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  vi.stubEnv('PREVIEW_COLLECTION_SCENARIO', 'continuation-45');
  const first = (await getFullSearchResults(parseSearchState({ q: 'demo' })))!;
  const productAfter = first.products.endCursor!;
  let collectionAfter: string | undefined;
  const ids: string[] = [];
  do {
    const state = parseSearchState({ q: 'demo', productAfter, collectionAfter });
    const result = (await getFullSearchResults(state))!;
    expect(result.products.items).toHaveLength(4);
    ids.push(...result.collections.items.map((collection) => collection.id));
    const html = renderToStaticMarkup(
      SearchPagination({ group: 'collections', state, page: result.collections }),
    );
    if (result.collections.hasNextPage) {
      expect(html).toContain(`productAfter=${productAfter}`);
      expect(html).toContain('q=demo');
      expect(html).toContain('Next collections');
    }
    collectionAfter = result.collections.hasNextPage ? result.collections.endCursor! : undefined;
  } while (collectionAfter);
  expect(ids).toEqual(getPreviewCollections().map((collection) => collection.id));
  expect(new Set(ids).size).toBe(45);
  expect(buildSearchHref('next query')).toBe('/search?q=next+query');
});

test('stale, cross-group, malformed and repeated cursors restart only their own group', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  vi.stubEnv('PREVIEW_COLLECTION_SCENARIO', 'continuation-45');
  const first = (await getFullSearchResults(parseSearchState({ q: 'demo' })))!;
  for (const productAfter of [
    first.collections.endCursor!,
    'invalid',
    ['one', 'two'],
    'x'.repeat(8193),
  ]) {
    const state = parseSearchState({
      q: 'demo',
      productAfter,
      collectionAfter: first.collections.endCursor!,
    });
    expect(state.productAfter).toBeUndefined();
    expect(state.collectionAfter).toBe(first.collections.endCursor);
    expect((await getFullSearchResults(state))?.products.items).toHaveLength(20);
  }
  expect(
    parseSearchState({ q: 'preview', productAfter: first.products.endCursor! }).productAfter,
  ).toBeUndefined();
  expect(
    parseSearchState({ q: ' demo ', productAfter: first.products.endCursor! }).productAfter,
  ).toBe(first.products.endCursor);
});

test('the live operation carries bounded independent cursors and intentional collection title syntax', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  const request = vi.fn().mockResolvedValue({
    data: {
      products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
      collections: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
    },
  });
  vi.spyOn(client, 'getStorefrontClient').mockReturnValue({ request } as unknown as ReturnType<
    typeof client.getStorefrontClient
  >);
  const result = await getFullSearchResults(parseSearchState({ q: '  winter snow  ' }));
  expect(result?.products.items).toEqual([]);
  expect(request).toHaveBeenCalledWith(expect.stringContaining('types: [PRODUCT]'), {
    variables: {
      query: 'winter snow',
      collectionQuery: 'title:winter AND title:snow*',
      first: 20,
      productAfter: null,
      collectionAfter: null,
    },
  });
  expect(buildCollectionSearchQuery('red OR title:(blue)')).toBe(
    'title:red AND title:OR AND title:title\\:\\(blue\\)*',
  );
});

test.each([
  { data: undefined },
  { data: { products: { edges: [], pageInfo: { hasNextPage: false } } } },
  {
    data: {
      products: { edges: [], pageInfo: { hasNextPage: true, endCursor: 'next' } },
      collections: { edges: [], pageInfo: { hasNextPage: false } },
    },
  },
  { errors: { message: 'Synthetic lookup failed' } },
])(
  'live errors and malformed partial responses fail the combined request, then a fresh attempt recovers',
  async (response) => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '');
    const request = vi
      .fn()
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({
        data: {
          products: { edges: [], pageInfo: { hasNextPage: false } },
          collections: { edges: [], pageInfo: { hasNextPage: false } },
        },
      });
    vi.spyOn(client, 'getStorefrontClient').mockReturnValue({ request } as unknown as ReturnType<
      typeof client.getStorefrontClient
    >);
    const state = parseSearchState({ q: 'demo' });
    await expect(getFullSearchResults(state)).rejects.toThrow();
    expect((await getFullSearchResults(state))?.products.items).toEqual([]);
  },
);

test('a combined lookup failure is visible with query retained and does not log raw input or upstream detail', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(client, 'getStorefrontClient').mockImplementation(() => {
    throw new Error('private@example.com');
  });
  const tree = await SearchPage({ searchParams: Promise.resolve({ q: 'private@example.com' }) });
  const html = renderToStaticMarkup(tree);
  expect(html).toContain('COULD NOT LOAD RESULTS.');
  expect(html).toContain('value="private@example.com"');
  expect(html).toContain('Retry');
  expect(html).not.toContain('NOTHING MATCHES.');
  expect(log).toHaveBeenCalledWith('[search] Results lookup failed.');
  expect(JSON.stringify(log.mock.calls)).not.toContain('private@example.com');
});

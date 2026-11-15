import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getCatalogPage, matchesCatalogVariant } from './products';
import { parseCatalogFilters } from './filters';
import { getPreviewProductDetail } from '@/lib/shopify/preview-demo-fixtures';
import { getProduct } from '@/lib/shopify/products';
import { getLooks } from '@/lib/shopify/looks';
import { FilterBar } from '@/components/catalog/FilterBar';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
test('pages through every fixture exactly once and scopes cursors to the query', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  const filters = parseCatalogFilters({});
  const first = await getCatalogPage(null, filters);
  expect(first.products).toHaveLength(24);
  expect(first.hasNextPage).toBe(true);
  const second = await getCatalogPage(null, filters, first.endCursor!);
  expect(second.products).toHaveLength(6);
  expect(second.hasNextPage).toBe(false);
  expect(new Set([...first.products, ...second.products].map((item) => item.id)).size).toBe(30);
  const changed = await getCatalogPage(
    null,
    parseCatalogFilters({ sort: 'newest' }),
    first.endCursor!,
  );
  expect(changed.isContinuation).toBe(false);
});

interface SyntheticVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}

function variant(id: string, size = 'M'): SyntheticVariant {
  return {
    id,
    title: size,
    availableForSale: true,
    quantityAvailable: 3,
    price: { amount: '100.00', currencyCode: 'USD' },
    selectedOptions: [{ name: 'Size', value: size }],
  };
}

function node(index: number, size = 'M') {
  return {
    id: `synthetic-${index}`,
    handle: `synthetic-${index}`,
    title: `Synthetic piece ${index}`,
    description: '',
    productType: 'Sweaters',
    tags: [],
    availableForSale: true,
    priceRange: { minVariantPrice: { amount: '100.00', currencyCode: 'USD' } },
    images: { edges: [] },
    options: [{ id: 'size', name: 'Size', optionValues: [{ id: `size-${size}`, name: size }] }],
    variants: {
      edges: [{ node: variant(`variant-${index}`, size) }],
      pageInfo: { hasNextPage: false, endCursor: null as string | null },
    },
    collections: {
      nodes: [{ handle: 'synthetic-collection', title: 'Synthetic collection' }],
      pageInfo: { hasNextPage: false, endCursor: null as string | null },
    },
  };
}

describe('bounded production catalog transport', () => {
  const requests: {
    query: string;
    variables: { first?: number; after?: string; handle?: string };
  }[] = [];
  let catalog: ReturnType<typeof node>[];
  let respond: (
    query: string,
    variables: { first?: number; after?: string; handle?: string },
  ) => unknown;

  beforeEach(() => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '');
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'synthetic.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'synthetic-public-token');
    requests.length = 0;
    catalog = Array.from({ length: 125 }, (_, index) => node(index));
    respond = (query, variables) => {
      const offset = variables.after ? Number(variables.after.slice(1)) : 0;
      const items = catalog.slice(offset, offset + (variables.first ?? 24));
      const end = offset + items.length;
      return {
        data: {
          products: {
            edges: items.map((product, index) => ({
              cursor: `c${offset + index + 1}`,
              node: product,
            })),
            pageInfo: {
              hasNextPage: end < catalog.length,
              endCursor: items.length ? `c${end}` : null,
            },
          },
        },
      };
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const { query, variables } = JSON.parse(String(init.body));
        requests.push({ query, variables });
        return Response.json(respond(query, variables));
      }),
    );
  });

  test('unmatched facets inspect at most 96 candidates with exactly four fixed result batches and one facet query', async () => {
    const result = await getCatalogPage(null, parseCatalogFilters({ size: 'Unknown' }));
    expect(result.products).toEqual([]);
    expect(result.hasNextPage).toBe(true);
    expect(requests).toHaveLength(5);
    const reads = requests.filter((request) => request.query.includes('query GetCatalogProducts('));
    expect(reads.map((read) => [read.variables.first, read.variables.after])).toEqual([
      [24, null],
      [24, 'c24'],
      [24, 'c48'],
      [24, 'c72'],
    ]);
    const next = await getCatalogPage(
      null,
      parseCatalogFilters({ size: 'Unknown' }),
      result.endCursor!,
    );
    expect(next.products).toEqual([]);
    expect(next.hasNextPage).toBe(false);
  });

  test('23 early matches and a later 24th match stay bounded and retain the unconsumed edges', async () => {
    catalog = catalog.map((product, index) =>
      node(index, index < 23 || index >= 124 ? 'Wanted' : 'Other'),
    );
    const filters = parseCatalogFilters({ size: 'Wanted' });
    const first = await getCatalogPage(null, filters);
    expect(first.products).toHaveLength(23);
    expect(first.hasNextPage).toBe(true);
    expect(requests).toHaveLength(5);
    const second = await getCatalogPage(null, filters, first.endCursor!);
    expect(second.products.map((product) => product.id)).toEqual(['synthetic-124']);
    expect(second.hasNextPage).toBe(false);

    // A full result page can end before the fetched candidate batch does.
    catalog = Array.from({ length: 60 }, (_, index) =>
      node(index, index === 0 ? 'Other' : 'Wanted'),
    );
    const page = await getCatalogPage(null, filters);
    const tail = await getCatalogPage(null, filters, page.endCursor!);
    const last = await getCatalogPage(null, filters, tail.endCursor!);
    expect(page.products).toHaveLength(24);
    expect(
      new Set([...page.products, ...tail.products, ...last.products].map((product) => product.id))
        .size,
    ).toBe(59);
    expect(tail.products[0].id).toBe('synthetic-25');
  });

  test('deduplicates repeated IDs within a result page and advances over sparse empty sections', async () => {
    catalog[1] = { ...catalog[1], id: catalog[0].id };
    const first = await getCatalogPage(null, parseCatalogFilters({}));
    expect(first.products).toHaveLength(24);
    expect(new Set(first.products.map((product) => product.id)).size).toBe(24);
    expect(first.products.at(-1)?.id).toBe('synthetic-24');
  });

  test('later-page facet values are reachable independently of full result pages and selected values survive Apply', async () => {
    catalog[30] = node(30, 'Later-only size');
    const first = await getCatalogPage(null, parseCatalogFilters({}));
    expect(first.facets.sizes).not.toContain('Later-only size');
    expect(first.facetEndCursor).toBeTruthy();
    const later = await getCatalogPage(
      null,
      parseCatalogFilters({ collection: 'unknown-collection', color: 'Unknown color' }),
      undefined,
      first.facetEndCursor!,
    );
    expect(later.facets.sizes).toContain('Later-only size');
    expect(later.facets.colors).toContain('Unknown color');
    expect(later.facets.collections).toContainEqual({
      handle: 'unknown-collection',
      title: 'unknown-collection',
    });
    const markup = renderToStaticMarkup(
      createElement(FilterBar, {
        pathname: '/tops',
        searchParams: { collection: 'unknown-collection', optionsAfter: first.facetEndCursor! },
        filters: parseCatalogFilters({ collection: 'unknown-collection' }),
        facets: later.facets,
      }),
    );
    expect(markup).toMatch(
      /name="collection"[^>]*checked=""[^>]*value="unknown-collection"|name="collection"[^>]*value="unknown-collection"[^>]*checked=""/,
    );
    expect(markup).toContain('name="optionsAfter"');
  });

  test('rejects a repeated upstream cursor and allows explicit recovery after a transient error', async () => {
    const initial = respond;
    respond = (query, variables) =>
      query.includes('query GetCatalogProducts(') && variables.after
        ? {
            data: {
              products: {
                edges: [{ node: node(1), cursor: 'c24' }],
                pageInfo: { hasNextPage: true, endCursor: 'c24' },
              },
            },
          }
        : initial(query, variables);
    await expect(getCatalogPage(null, parseCatalogFilters({ size: 'Unknown' }))).rejects.toThrow(
      'pagination did not advance',
    );
    respond = () => ({ errors: [{ message: 'Synthetic catalog failure' }] });
    await expect(getCatalogPage(null, parseCatalogFilters({}))).rejects.toThrow(
      'Synthetic catalog failure',
    );
    respond = initial;
    expect((await getCatalogPage(null, parseCatalogFilters({}))).products).toHaveLength(24);
  });

  test('continues beyond the first variant page only until the matching 101st tuple is found', async () => {
    catalog = [node(0)];
    catalog[0].variants.edges = Array.from({ length: 100 }, (_, index) => ({
      node: variant(`variant-${index}`, 'Other'),
    }));
    catalog[0].variants.pageInfo = { hasNextPage: true, endCursor: 'v100' };
    const initial = respond;
    respond = (query, variables) =>
      query.includes('query GetProductVariants(')
        ? {
            data: {
              product: {
                variants: {
                  edges: [{ node: variant('variant-101', 'Wanted') }],
                  pageInfo: { hasNextPage: true, endCursor: 'v101' },
                },
              },
            },
          }
        : initial(query, variables);
    const page = await getCatalogPage(null, parseCatalogFilters({ size: 'Wanted' }));
    expect(page.products.map((product) => product.id)).toEqual(['synthetic-0']);
    expect(
      requests.filter((request) => request.query.includes('query GetProductVariants(')),
    ).toHaveLength(1);
    requests.length = 0;
    await getCatalogPage(null, parseCatalogFilters({}));
    expect(requests.some((request) => request.query.includes('query GetProductVariants('))).toBe(
      false,
    );
  });

  test('one shared deadline bounds stalled nested reads and fails without classifying an incomplete variant set', async () => {
    catalog = [node(0)];
    catalog[0].variants.pageInfo = { hasNextPage: true, endCursor: 'v100' };
    const initial = respond;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const { query, variables } = JSON.parse(String(init.body));
        requests.push({ query, variables });
        if (query.includes('query GetProductVariants(')) {
          return new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
              once: true,
            });
          });
        }
        return Response.json(initial(query, variables));
      }),
    );
    vi.useFakeTimers();
    try {
      const failure = expect(
        getCatalogPage(null, parseCatalogFilters({ size: 'Wanted' })),
      ).rejects.toThrow('Shopify Storefront API request failed');
      await vi.advanceTimersByTimeAsync(10_000);
      await failure;
      expect(requests).toHaveLength(3);
    } finally {
      vi.useRealTimers();
    }
  });

  test.each(['getProduct', 'getLooks'])(
    '%s uses the real SDK transport for a 101st variant, continuation failure, and repeated cursor',
    async (entrypoint) => {
      const product = node(0);
      product.variants.edges = Array.from({ length: 100 }, (_, index) => ({
        node: variant(`variant-${index}`),
      }));
      product.variants.pageInfo = { hasNextPage: true, endCursor: 'v100' };
      let continuation: unknown = {
        data: {
          product: {
            variants: {
              edges: [{ node: variant('variant-101', 'Wanted') }],
              pageInfo: { hasNextPage: false, endCursor: 'v101' },
            },
          },
        },
      };
      respond = (query) =>
        query.includes('query GetProductVariants(')
          ? continuation
          : query.includes('query GetLooks(')
            ? {
                data: {
                  metaobjects: {
                    nodes: [
                      {
                        handle: 'synthetic-look',
                        title: null,
                        image: null,
                        products: { references: { nodes: [product] } },
                      },
                    ],
                  },
                },
              }
            : { data: { product } };
      const read = async () =>
        entrypoint === 'getProduct'
          ? getProduct('synthetic-0')
          : (await getLooks())[0]?.products[0];
      expect((await read())?.variants.at(-1)?.id).toBe('variant-101');
      continuation = { errors: [{ message: 'Synthetic continuation failure' }] };
      await expect(read()).rejects.toThrow('Synthetic continuation failure');
      continuation = {
        data: {
          product: { variants: { edges: [], pageInfo: { hasNextPage: true, endCursor: 'v100' } } },
        },
      };
      await expect(read()).rejects.toThrow('pagination did not advance');
    },
  );
});
test('matches size, color, stock and price on one actual variant', () => {
  const product = getPreviewProductDetail('preview-featherweight-crewneck')!;
  expect(
    matchesCatalogVariant(
      product,
      parseCatalogFilters({ size: 'S', color: 'Ecru', available: '1' }),
    ),
  ).toBe(false);
  expect(
    matchesCatalogVariant(
      product,
      parseCatalogFilters({ size: 'L', color: 'Ecru', available: '1' }),
    ),
  ).toBe(true);
  expect(
    matchesCatalogVariant(
      product,
      parseCatalogFilters({ size: 'M', color: 'Black', minPrice: '1000' }),
    ),
  ).toBe(false);
});
test('combined collection facets and resettable empty results use canonical fixture membership', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  const result = await getCatalogPage(null, parseCatalogFilters({ collection: 'demo-capsule' }));
  expect(result.products).toHaveLength(15);
  expect(result.hasNextPage).toBe(false);
  const missing = await getCatalogPage(
    null,
    parseCatalogFilters({ collection: 'missing-collection' }),
  );
  expect(missing.products).toEqual([]);
});

test('facet discovery includes collection memberships beyond the first 250', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'synthetic.myshopify.com');
  vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'synthetic-public-token');
  const product = node(0);
  product.collections = {
    nodes: Array.from({ length: 250 }, (_, index) => ({
      handle: `collection-${index}`,
      title: `Collection ${index}`,
    })),
    pageInfo: { hasNextPage: true, endCursor: 'membership-250' },
  };
  const transport = vi.fn(async (_url: unknown, init: RequestInit) => {
    const { query, variables } = JSON.parse(String(init.body));
    if (query.includes('query GetProductCollections')) {
      expect(variables).toEqual({ handle: product.handle, after: 'membership-250' });
      return Response.json({
        data: {
          product: {
            collections: {
              nodes: [{ handle: 'late-collection', title: 'Late collection' }],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      });
    }
    return Response.json({
      data: {
        products: {
          edges: [{ cursor: 'c1', node: product }],
          pageInfo: { hasNextPage: false, endCursor: 'c1' },
        },
      },
    });
  });
  vi.stubGlobal('fetch', transport);
  const result = await getCatalogPage(null, parseCatalogFilters({}));
  expect(result.facets.collections).toContainEqual({
    handle: 'late-collection',
    title: 'Late collection',
  });
  expect(transport).toHaveBeenCalledTimes(3);
});

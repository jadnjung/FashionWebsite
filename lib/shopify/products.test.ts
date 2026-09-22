import { describe, expect, test, vi } from 'vitest';
import {
  getProduct,
  getProducts,
  getProductsByCollection,
  searchProducts,
} from '@/lib/shopify/products';
import * as clientModule from '@/lib/shopify/client';

function mockClient(response: unknown) {
  vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
    request: vi.fn().mockResolvedValue(response),
  } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);
}

describe('getProduct', () => {
  test('returns null when no product matches the handle', async () => {
    mockClient({ data: { product: null } });
    const result = await getProduct('does-not-exist');
    expect(result).toBeNull();
  });

  test('maps a real-shaped response into a ProductDetail', async () => {
    mockClient({
      data: {
        product: {
          id: 'gid://shopify/Product/1',
          handle: 'item-one',
          title: 'Item One',
          description: 'A first piece.',
          productType: 'Tops',
          tags: ['new'],
          priceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'USD' } },
          images: {
            edges: [
              {
                node: {
                  url: 'https://cdn.example/item-one.jpg',
                  altText: null,
                  width: 800,
                  height: 1000,
                },
              },
            ],
          },
          options: [
            {
              id: 'gid://shopify/ProductOption/1',
              name: 'Size',
              optionValues: [
                { id: 'gid://shopify/ProductOptionValue/1', name: 'S' },
                { id: 'gid://shopify/ProductOptionValue/2', name: 'M' },
              ],
            },
          ],
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/1',
                  title: 'M',
                  availableForSale: true,
                  quantityAvailable: 12,
                  price: { amount: '120.00', currencyCode: 'USD' },
                  selectedOptions: [{ name: 'Size', value: 'M' }],
                },
              },
            ],
          },
        },
      },
    });

    const result = await getProduct('item-one');

    expect(result).toEqual({
      id: 'gid://shopify/Product/1',
      handle: 'item-one',
      title: 'Item One',
      description: 'A first piece.',
      productType: 'Tops',
      tags: ['new'],
      minPrice: { amount: '120.00', currencyCode: 'USD' },
      images: [
        { url: 'https://cdn.example/item-one.jpg', altText: null, width: 800, height: 1000 },
      ],
      options: [{ id: 'gid://shopify/ProductOption/1', name: 'Size', values: ['S', 'M'] }],
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          title: 'M',
          availableForSale: true,
          quantityAvailable: 12,
          price: { amount: '120.00', currencyCode: 'USD' },
          selectedOptions: [{ name: 'Size', value: 'M' }],
        },
      ],
    });
  });

  test('maps a product with no options to an empty options array', async () => {
    mockClient({
      data: {
        product: {
          id: 'gid://shopify/Product/2',
          handle: 'simple-item',
          title: 'Simple Item',
          description: 'One size, one color.',
          productType: 'Etc.',
          tags: [],
          priceRange: { minVariantPrice: { amount: '50.00', currencyCode: 'USD' } },
          images: { edges: [] },
          options: [],
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/2',
                  title: 'Default Title',
                  availableForSale: true,
                  quantityAvailable: null,
                  price: { amount: '50.00', currencyCode: 'USD' },
                  selectedOptions: [],
                },
              },
            ],
          },
        },
      },
    });

    const result = await getProduct('simple-item');
    expect(result?.options).toEqual([]);
    expect(result?.variants[0].quantityAvailable).toBeNull();
  });

  test('passes quantityAvailable: null through as null, not coerced to 0', async () => {
    mockClient({
      data: {
        product: {
          id: 'gid://shopify/Product/3',
          handle: 'unknown-inventory-item',
          title: 'Unknown Inventory Item',
          description: '',
          productType: 'Tops',
          tags: [],
          priceRange: { minVariantPrice: { amount: '90.00', currencyCode: 'USD' } },
          images: { edges: [] },
          options: [],
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/3',
                  title: 'Default Title',
                  availableForSale: true,
                  quantityAvailable: null,
                  price: { amount: '90.00', currencyCode: 'USD' },
                  selectedOptions: [],
                },
              },
            ],
          },
        },
      },
    });

    const result = await getProduct('unknown-inventory-item');
    expect(result?.variants[0].quantityAvailable).toBeNull();
  });

  test('throws when the response includes errors, rather than treating it as not-found', async () => {
    mockClient({
      data: { product: null },
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });

    await expect(getProduct('item-one')).rejects.toThrow('Throttled by Shopify');
  });

  test('propagates the client\'s "not configured" error rather than attempting a request', async () => {
    vi.spyOn(clientModule, 'getStorefrontClient').mockImplementation(() => {
      throw new Error(
        'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
      );
    });

    await expect(getProduct('item-one')).rejects.toThrow(
      'Shopify Storefront API is not configured',
    );
  });
});

describe('getProductsByCollection', () => {
  test('maps a page of products, defaulting to no image when none exists', async () => {
    mockClient({
      data: {
        collection: {
          products: {
            edges: [
              {
                cursor: 'c1',
                node: {
                  id: 'gid://shopify/Product/1',
                  handle: 'item-one',
                  title: 'Item One',
                  description: 'A description.',
                  productType: 'Tops',
                  tags: ['new'],
                  priceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'USD' } },
                  images: { edges: [] },
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'c1' },
          },
        },
      },
    });

    const result = await getProductsByCollection('collection-001');

    expect(result).toEqual({
      products: [
        {
          id: 'gid://shopify/Product/1',
          handle: 'item-one',
          title: 'Item One',
          description: 'A description.',
          productType: 'Tops',
          tags: ['new'],
          minPrice: { amount: '120.00', currencyCode: 'USD' },
          image: null,
        },
      ],
      hasNextPage: false,
      endCursor: 'c1',
    });
  });

  test('returns null when the collection handle does not exist', async () => {
    mockClient({ data: { collection: null } });
    const result = await getProductsByCollection('does-not-exist');
    expect(result).toBeNull();
  });

  test('throws when the response includes errors, rather than returning an empty page', async () => {
    mockClient({
      data: undefined,
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });

    await expect(getProductsByCollection('collection-001')).rejects.toThrow('Throttled by Shopify');
  });

  test('propagates the client\'s "not configured" error rather than attempting a request', async () => {
    vi.spyOn(clientModule, 'getStorefrontClient').mockImplementation(() => {
      throw new Error(
        'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
      );
    });

    await expect(getProductsByCollection('collection-001')).rejects.toThrow(
      'Shopify Storefront API is not configured',
    );
  });
});

describe('getProducts', () => {
  test('maps a page of products, including availableForSale and up to two images', async () => {
    mockClient({
      data: {
        products: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: 'gid://shopify/Product/1',
                handle: 'hoodie-01',
                title: 'Hoodie 01',
                productType: 'Hoodies',
                tags: ['new'],
                availableForSale: true,
                priceRange: { minVariantPrice: { amount: '180.00', currencyCode: 'USD' } },
                images: {
                  edges: [
                    {
                      node: {
                        url: 'https://cdn.example/hoodie-01-a.jpg',
                        altText: null,
                        width: 800,
                        height: 1000,
                      },
                    },
                    {
                      node: {
                        url: 'https://cdn.example/hoodie-01-b.jpg',
                        altText: 'Back view',
                        width: 800,
                        height: 1000,
                      },
                    },
                  ],
                },
              },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: 'c1' },
        },
      },
    });

    const result = await getProducts();

    expect(result).toEqual({
      products: [
        {
          id: 'gid://shopify/Product/1',
          handle: 'hoodie-01',
          title: 'Hoodie 01',
          productType: 'Hoodies',
          tags: ['new'],
          minPrice: { amount: '180.00', currencyCode: 'USD' },
          availableForSale: true,
          images: [
            { url: 'https://cdn.example/hoodie-01-a.jpg', altText: null, width: 800, height: 1000 },
            {
              url: 'https://cdn.example/hoodie-01-b.jpg',
              altText: 'Back view',
              width: 800,
              height: 1000,
            },
          ],
        },
      ],
      hasNextPage: false,
      endCursor: 'c1',
    });
  });

  test('defaults to an empty images array when a product has none, and preserves availableForSale: false', async () => {
    mockClient({
      data: {
        products: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: 'gid://shopify/Product/2',
                handle: 'sold-out-item',
                title: 'Sold Out Item',
                productType: 'Hoodies',
                tags: [],
                availableForSale: false,
                priceRange: { minVariantPrice: { amount: '150.00', currencyCode: 'USD' } },
                images: { edges: [] },
              },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: 'c1' },
        },
      },
    });

    const result = await getProducts();
    expect(result.products[0].images).toEqual([]);
    expect(result.products[0].availableForSale).toBe(false);
  });

  test('defaults first to 24 and after/query/sortKey/reverse to null when no options given', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
    });
    vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
      request,
    } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);

    await getProducts();

    expect(request).toHaveBeenCalledWith(expect.any(String), {
      variables: { first: 24, after: null, query: null, sortKey: null, reverse: null },
    });
  });

  test('passes given query/sortKey/reverse/first/after through as request variables', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
    });
    vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
      request,
    } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);

    await getProducts({
      query: 'product_type:"Hoodies"',
      sortKey: 'PRICE',
      reverse: true,
      first: 12,
      after: 'cursor-1',
    });

    expect(request).toHaveBeenCalledWith(expect.any(String), {
      variables: {
        first: 12,
        after: 'cursor-1',
        query: 'product_type:"Hoodies"',
        sortKey: 'PRICE',
        reverse: true,
      },
    });
  });

  test('returns an empty page rather than throwing when products is unexpectedly absent from data', async () => {
    mockClient({ data: {} });
    const result = await getProducts();
    expect(result).toEqual({ products: [], hasNextPage: false, endCursor: null });
  });

  test('throws when the response includes errors, rather than returning an empty page', async () => {
    mockClient({
      data: undefined,
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });
    await expect(getProducts()).rejects.toThrow('Throttled by Shopify');
  });

  test('propagates the client\'s "not configured" error rather than attempting a request', async () => {
    vi.spyOn(clientModule, 'getStorefrontClient').mockImplementation(() => {
      throw new Error(
        'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
      );
    });
    await expect(getProducts()).rejects.toThrow('Shopify Storefront API is not configured');
  });
});

// Demo Mode (DECISIONS.md D-057) — the PREVIEW_DEMO_MODE-gated
// short-circuits in getProduct/getProducts. `vi.stubEnv` is auto-restored
// after each test (vitest.config.ts's `unstubEnvs: true`), so it's safe to
// set per-test without a shared beforeEach/afterEach. The "never touches
// the Storefront client" tests below compare the spy's call count before
// and after, rather than asserting `not.toHaveBeenCalled()` outright: this
// file has no restoreMocks/clearMocks config, so vi.spyOn(clientModule,
// 'getStorefrontClient') returns the same accumulating spy every earlier
// test in this file already called — an absolute-zero assertion would
// depend on run order, not on what this test itself did.
describe('getProduct — Demo Mode', () => {
  test('short-circuits to fixture data and never touches the Storefront client', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const callsBefore = getStorefrontClient.mock.calls.length;
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');

    const result = await getProduct('preview-featherweight-crewneck');

    expect(result?.title).toBe('Featherweight Crewneck Sweater');
    expect(getStorefrontClient.mock.calls.length).toBe(callsBefore);
  });

  test('returns null for a handle with no matching fixture, same as the real not-found contract', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getProduct('does-not-exist');
    expect(result).toBeNull();
  });
});

describe('getProductsByCollection — Demo Mode', () => {
  test('short-circuits to fixture data and never touches the Storefront client', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const callsBefore = getStorefrontClient.mock.calls.length;
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');

    const result = await getProductsByCollection('collection-000');

    expect(result?.products).toHaveLength(2);
    expect(result?.products.every((p) => p.description.length > 0)).toBe(true);
    expect(getStorefrontClient.mock.calls.length).toBe(callsBefore);
  });

  test('returns null for a handle with no matching fixture, same as the real not-found contract', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getProductsByCollection('does-not-exist');
    expect(result).toBeNull();
  });
});

describe('getProducts — Demo Mode', () => {
  test('respects `first` — regression test for a real, reproduced layout bug (SelectedPieces requests 3 and got fed all 6 fixtures when `first` was ignored)', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getProducts({ first: 3 });
    expect(result.products).toHaveLength(3);
    expect(result.hasNextPage).toBe(false);
    expect(result.endCursor).toBeNull();
  });

  test('filters by the same product_type:"X" query string category pages and the Interactive Model build', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getProducts({ query: 'product_type:"Trousers"' });
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products.every((product) => product.productType === 'Trousers')).toBe(true);
  });

  test('does not conflate similarly-named product types via substring matching (e.g. "Shirts" vs "T-Shirts")', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getProducts({ query: 'product_type:"Shirts"' });
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products.every((product) => product.productType === 'Shirts')).toBe(true);
  });

  test('falls back to the full fixture list, rather than an empty page, when no fixture matches the query', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getProducts({ query: 'product_type:"Hats"' });
    expect(result.products.length).toBeGreaterThan(0);
  });

  test('never touches the Storefront client', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const callsBefore = getStorefrontClient.mock.calls.length;
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    await getProducts();
    expect(getStorefrontClient.mock.calls.length).toBe(callsBefore);
  });

  // Regression test for a real, reproduced bug: PRICE: LOW TO HIGH/HIGH TO
  // LOW on /tops and /bottoms silently did nothing, because this
  // short-circuit ignored `sortKey`/`reverse` entirely and always returned
  // PREVIEW_PRODUCTS in its fixed array order.
  test('sorts by price ascending/descending when sortKey is PRICE', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const asc = await getProducts({ sortKey: 'PRICE', reverse: false });
    const ascPrices = asc.products.map((p) => Number(p.minPrice.amount));
    expect(ascPrices).toEqual([...ascPrices].sort((a, b) => a - b));

    const desc = await getProducts({ sortKey: 'PRICE', reverse: true });
    const descPrices = desc.products.map((p) => Number(p.minPrice.amount));
    expect(descPrices).toEqual([...descPrices].sort((a, b) => b - a));
  });
});

// Predictive search (DECISIONS.md D-058) — a distinct query path from
// getProducts. See lib/shopify/queries/products.ts's GET_PREDICTIVE_SEARCH_QUERY
// for why $query receives the raw, trimmed string (no manual wildcard) and
// why searchableFields/unavailableProducts are never overridden.
describe('searchProducts', () => {
  test('calls client.request with GET_PREDICTIVE_SEARCH_QUERY and the trimmed query + default limit', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { predictiveSearch: { products: [] } },
    });
    vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
      request,
    } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);

    await searchProducts('  hoodie  ');

    expect(request).toHaveBeenCalledWith(expect.any(String), {
      variables: { query: 'hoodie', limit: 6 },
    });
  });

  test('passes a custom limit through', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { predictiveSearch: { products: [] } },
    });
    vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
      request,
    } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);

    await searchProducts('hoodie', { limit: 3 });

    expect(request).toHaveBeenCalledWith(expect.any(String), {
      variables: { query: 'hoodie', limit: 3 },
    });
  });

  test('maps a real-shaped predictiveSearch response into ProductListItem[]', async () => {
    mockClient({
      data: {
        predictiveSearch: {
          products: [
            {
              id: 'gid://shopify/Product/1',
              handle: 'hoodie-01',
              title: 'Hoodie 01',
              productType: 'Hoodies',
              tags: ['new'],
              availableForSale: true,
              priceRange: { minVariantPrice: { amount: '180.00', currencyCode: 'USD' } },
              images: {
                edges: [
                  {
                    node: {
                      url: 'https://cdn.example/hoodie-01-a.jpg',
                      altText: null,
                      width: 800,
                      height: 1000,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    const result = await searchProducts('hoo');

    expect(result).toEqual([
      {
        id: 'gid://shopify/Product/1',
        handle: 'hoodie-01',
        title: 'Hoodie 01',
        productType: 'Hoodies',
        tags: ['new'],
        minPrice: { amount: '180.00', currencyCode: 'USD' },
        availableForSale: true,
        images: [
          { url: 'https://cdn.example/hoodie-01-a.jpg', altText: null, width: 800, height: 1000 },
        ],
      },
    ]);
  });

  test('returns [] when predictiveSearch is unexpectedly absent from data', async () => {
    mockClient({ data: {} });
    const result = await searchProducts('hoodie');
    expect(result).toEqual([]);
  });

  test('throws when the response includes errors, rather than returning an empty list', async () => {
    mockClient({
      data: undefined,
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });
    await expect(searchProducts('hoodie')).rejects.toThrow('Throttled by Shopify');
  });

  // Mirrors this file's own established technique (see the Demo Mode
  // describe blocks above) for asserting a short-circuit never touches the
  // client: compares the shared spy's call count before/after, since this
  // file has no restoreMocks/clearMocks and every earlier test's calls
  // otherwise accumulate on the same spy.
  test('returns [] for a blank/whitespace-only query without ever calling getStorefrontClient', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const callsBefore = getStorefrontClient.mock.calls.length;

    expect(await searchProducts('')).toEqual([]);
    expect(await searchProducts('   ')).toEqual([]);

    expect(getStorefrontClient.mock.calls.length).toBe(callsBefore);
  });
});

describe('searchProducts — Demo Mode', () => {
  test('a query matching a real fixture title returns that fixture', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await searchProducts('trouser');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.title.toLowerCase().includes('trouser'))).toBe(true);
  });

  test('a query matching a fixture productType returns that fixture', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await searchProducts('jackets');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.productType.toLowerCase().includes('jackets'))).toBe(true);
  });

  // Deliberately the opposite fallback from getProducts' Demo Mode branch
  // (which returns the full fixture list on a non-matching query): a real
  // "no results" state is exactly what this feature must be able to
  // demonstrate — see the design spec's Demo Mode section.
  test('a query matching nothing real returns [], not the full fixture list', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await searchProducts('zzz-not-a-real-product');
    expect(result).toEqual([]);
  });

  test('never touches the Storefront client', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const callsBefore = getStorefrontClient.mock.calls.length;
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    await searchProducts('trouser');
    expect(getStorefrontClient.mock.calls.length).toBe(callsBefore);
  });
});

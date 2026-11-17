import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getStorefrontClient, toRequestError } from '@/lib/shopify/client';
import { getProduct, getProducts } from '@/lib/shopify/products';
import { getCollections } from '@/lib/shopify/collections';

describe('getStorefrontClient', () => {
  test('throws a clear error when SHOPIFY_STORE_DOMAIN is unset', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', undefined);
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'test-token');
    expect(() => getStorefrontClient()).toThrow(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  });

  test('throws a clear error when SHOPIFY_STOREFRONT_API_TOKEN is unset', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'test-shop.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', undefined);
    expect(() => getStorefrontClient()).toThrow(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  });

  test('returns a configured client when both are set', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'test-shop.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'test-token');
    const client = getStorefrontClient();
    expect(client).toHaveProperty('request');
    expect(typeof client.request).toBe('function');
  });
});

describe('Storefront SDK HTTP transport with synthetic responses', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '');
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'synthetic.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'synthetic-public-token');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_VERSION', '2026-07');
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => {
      throw new Error('Unplanned synthetic transport request');
    });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  test('collection discovery cancellation reaches the real SDK transport and a fresh read recovers', async () => {
    const controller = new AbortController();
    let transportSignal: AbortSignal | null | undefined;
    fetchMock.mockImplementationOnce(async (_url, init) => {
      transportSignal = init?.signal;
      controller.abort(new Error('Synthetic collection cancellation'));
      return new Promise<Response>(() => {});
    });
    await expect(getCollections(20, 'source-page', controller.signal)).rejects.toThrow(
      'Synthetic collection cancellation',
    );
    expect(transportSignal?.aborted).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).variables).toEqual({
      first: 20,
      after: 'source-page',
    });
    fetchMock.mockResolvedValueOnce(
      Response.json({
        data: {
          collections: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
    await expect(getCollections()).resolves.toEqual({
      collections: [],
      hasNextPage: false,
      endCursor: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('sends operation variables, version and token through the actual SDK and normalizes catalog data', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        data: {
          products: {
            edges: [
              {
                cursor: 'next-product',
                node: {
                  id: 'gid://shopify/Product/1',
                  handle: 'synthetic',
                  title: 'Synthetic piece',
                  productType: 'Sweaters',
                  tags: [],
                  availableForSale: true,
                  priceRange: { minVariantPrice: { amount: '123.45', currencyCode: 'USD' } },
                  images: { edges: [{ node: { url: 'https://cdn.shopify.com/synthetic.jpg' } }] },
                },
              },
            ],
            pageInfo: { hasNextPage: true, endCursor: 'next-product' },
          },
        },
      }),
    );
    const result = await getProducts({
      first: 1,
      after: 'previous-product',
      query: 'product_type:"Sweaters"',
      sortKey: 'PRICE',
      reverse: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://synthetic.myshopify.com/api/2026-07/graphql.json');
    expect(new Headers(init?.headers).get('X-Shopify-Storefront-Access-Token')).toBe(
      'synthetic-public-token',
    );
    expect(JSON.parse(String(init?.body)).variables).toEqual({
      first: 1,
      after: 'previous-product',
      query: 'product_type:"Sweaters"',
      sortKey: 'PRICE',
      reverse: true,
    });
    expect(result).toMatchObject({
      hasNextPage: true,
      endCursor: 'next-product',
      products: [
        {
          id: 'gid://shopify/Product/1',
          minPrice: { amount: '123.45', currencyCode: 'USD' },
          images: [{ altText: null, width: null, height: null }],
        },
      ],
    });
  });

  test('rejects partial data with GraphQL errors and recovers on a fresh read', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        data: { product: null },
        errors: [{ message: 'Synthetic rejection', extensions: { code: 'THROTTLED' } }],
      }),
    );
    await expect(getProduct('synthetic')).rejects.toThrow('Synthetic rejection');
    fetchMock.mockResolvedValueOnce(Response.json({ data: { product: null } }));
    await expect(getProduct('synthetic')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test.each([429, 503])(
    'turns HTTP %i into an intentional request failure without automatic replay',
    async (status) => {
      fetchMock.mockResolvedValueOnce(new Response('Synthetic service failure', { status }));
      await expect(getProducts()).rejects.toThrow(`HTTP ${status}`);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  test('rejects invalid JSON through the real SDK', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{invalid', { headers: { 'content-type': 'application/json' } }),
    );
    await expect(getProducts()).rejects.toThrow('Shopify Storefront API request failed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('rejects a pre-aborted request before reaching the HTTP transport', async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockImplementationOnce(async (_url, init) => {
      expect(init?.signal?.aborted).toBe(true);
      throw new DOMException('Synthetic cancellation', 'AbortError');
    });
    const result = await getStorefrontClient().request('query Synthetic { shop { name } }', {
      signal: controller.signal,
    });
    expect(result.errors).toBeDefined();
    expect(toRequestError(result.errors!).message).toContain(
      'Shopify Storefront API request failed',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('aborts a stalled transport after ten seconds and permits a later retry', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockImplementationOnce(
        async (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
              once: true,
            });
          }),
      );
      const outcome = expect(getProducts()).rejects.toThrow(
        'Shopify Storefront API request failed',
      );
      await vi.advanceTimersByTimeAsync(10_000);
      await outcome;
      fetchMock.mockResolvedValueOnce(
        Response.json({
          data: { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
        }),
      );
      await expect(getProducts()).resolves.toEqual({
        products: [],
        hasNextPage: false,
        endCursor: null,
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

test('bounds response-body decoding after HTTP headers arrive', async () => {
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'synthetic.myshopify.com');
  vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'synthetic-public-token');
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(new ReadableStream({ start() {} }), {
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
  try {
    const outcome = expect(getProducts()).rejects.toThrow('Shopify Storefront API request failed');
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

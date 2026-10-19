import { NextRequest } from 'next/server';
import { describe, expect, test, vi } from 'vitest';
import { GET } from './route';
import * as collectionsModule from '@/lib/shopify/collections';
import * as productsModule from '@/lib/shopify/products';

// This project's first Route Handler test — a plain function call against
// a real NextRequest, no Next test server needed (GET handlers are just
// exported async functions). Mocks searchProducts/searchCollections
// entirely: this is a unit test of the route's own parsing/error-shaping/
// concurrency logic, not of Shopify integration (already covered by
// lib/shopify/products.test.ts / lib/shopify/collections.test.ts).
vi.mock('@/lib/shopify/products');
vi.mock('@/lib/shopify/collections');

function request(url: string): NextRequest {
  return new NextRequest(url);
}

describe('GET /api/search', () => {
  test('no q param short-circuits to an empty result without calling searchProducts/searchCollections', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const searchCollections = vi.mocked(collectionsModule.searchCollections);
    const response = await GET(request('http://localhost/api/search'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ products: [], collections: [] });
    expect(searchProducts).not.toHaveBeenCalled();
    expect(searchCollections).not.toHaveBeenCalled();
  });

  test('a whitespace-only q param short-circuits the same way', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const searchCollections = vi.mocked(collectionsModule.searchCollections);
    const response = await GET(request('http://localhost/api/search?q=%20%20'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ products: [], collections: [] });
    expect(searchProducts).not.toHaveBeenCalled();
    expect(searchCollections).not.toHaveBeenCalled();
  });

  test('a real q param is trimmed and passed to both searchProducts and searchCollections, response echoes both results', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const searchCollections = vi.mocked(collectionsModule.searchCollections);
    const fakeProducts = [
      {
        id: 'gid://shopify/Product/1',
        handle: 'hoodie-01',
        title: 'Hoodie 01',
        productType: 'Hoodies',
        tags: [],
        minPrice: { amount: '180.00', currencyCode: 'USD' },
        availableForSale: true,
        images: [],
      },
    ];
    const fakeCollections = [
      {
        id: 'gid://shopify/Collection/1',
        handle: 'collection-001',
        title: 'Collection 001',
        dropStatus: 'active',
        dropDate: null,
        archivedAt: null,
      },
    ];
    searchProducts.mockResolvedValue(fakeProducts);
    searchCollections.mockResolvedValue(fakeCollections);

    const response = await GET(request('http://localhost/api/search?q=%20hoodie%20'));

    expect(searchProducts).toHaveBeenCalledWith('hoodie');
    expect(searchCollections).toHaveBeenCalledWith('hoodie');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      products: fakeProducts,
      collections: fakeCollections,
    });
  });

  test('a q param longer than 100 characters is truncated before being passed to searchProducts/searchCollections', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const searchCollections = vi.mocked(collectionsModule.searchCollections);
    searchProducts.mockResolvedValue([]);
    searchCollections.mockResolvedValue([]);
    const longQuery = 'a'.repeat(150);

    await GET(request(`http://localhost/api/search?q=${longQuery}`));

    expect(searchProducts).toHaveBeenCalledWith('a'.repeat(100));
    expect(searchCollections).toHaveBeenCalledWith('a'.repeat(100));
  });

  // The load-bearing concurrency assertion for this route's Promise.all
  // (CLAUDE.md/vercel-react-best-practices' async-parallel rule): both
  // calls must be in flight together, not one awaited before the other
  // starts. Proven by resolving them in the *reverse* of call order —
  // this would be impossible to observe correctly if the route awaited
  // searchProducts before even calling searchCollections.
  test('calls searchProducts and searchCollections concurrently, not sequentially', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const searchCollections = vi.mocked(collectionsModule.searchCollections);
    const order: string[] = [];
    let resolveCollections!: () => void;

    searchProducts.mockImplementation(async () => {
      order.push('products-called');
      // Yields to the microtask queue so searchCollections' own call can
      // happen before this promise settles, proving both were started
      // before either resolved.
      await new Promise((resolve) => setTimeout(resolve, 0));
      order.push('products-resolved');
      return [];
    });
    searchCollections.mockImplementation(
      () =>
        new Promise((resolve) => {
          order.push('collections-called');
          resolveCollections = () => {
            order.push('collections-resolved');
            resolve([]);
          };
        }),
    );

    const responsePromise = GET(request('http://localhost/api/search?q=hoodie'));
    // Both calls have been made before either has resolved.
    expect(order).toEqual(['products-called', 'collections-called']);

    resolveCollections();
    await responsePromise;

    expect(order).toEqual([
      'products-called',
      'collections-called',
      'collections-resolved',
      'products-resolved',
    ]);
  });

  test('searchProducts rejecting becomes a 500 with a generic body, never the real error message', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const searchCollections = vi.mocked(collectionsModule.searchCollections);
    searchProducts.mockRejectedValue(new Error('Shopify Storefront API is not configured'));
    searchCollections.mockResolvedValue([]);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request('http://localhost/api/search?q=hoodie'));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'search_failed' });
    expect(JSON.stringify(body)).not.toContain('not configured');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  // Proves the shared Promise.all/catch block covers a collections-side
  // failure exactly the same way it already covers a products-side one —
  // no special-cased "one succeeded, one failed" partial-result handling
  // exists, by design (DECISIONS.md D-058/D-069).
  test('searchCollections rejecting also becomes a 500 with a generic body, never the real error message', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const searchCollections = vi.mocked(collectionsModule.searchCollections);
    searchProducts.mockResolvedValue([]);
    searchCollections.mockRejectedValue(new Error('Shopify Storefront API is not configured'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request('http://localhost/api/search?q=hoodie'));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'search_failed' });
    expect(JSON.stringify(body)).not.toContain('not configured');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

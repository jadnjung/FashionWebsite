import { NextRequest } from 'next/server';
import { describe, expect, test, vi } from 'vitest';
import { GET } from './route';
import * as productsModule from '@/lib/shopify/products';

// This project's first Route Handler test — a plain function call against
// a real NextRequest, no Next test server needed (GET handlers are just
// exported async functions). Mocks searchProducts entirely: this is a unit
// test of the route's own parsing/error-shaping logic, not of Shopify
// integration (already covered by lib/shopify/products.test.ts).
vi.mock('@/lib/shopify/products');

function request(url: string): NextRequest {
  return new NextRequest(url);
}

describe('GET /api/search', () => {
  test('no q param short-circuits to an empty result without calling searchProducts', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const response = await GET(request('http://localhost/api/search'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ products: [] });
    expect(searchProducts).not.toHaveBeenCalled();
  });

  test('a whitespace-only q param short-circuits the same way', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const response = await GET(request('http://localhost/api/search?q=%20%20'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ products: [] });
    expect(searchProducts).not.toHaveBeenCalled();
  });

  test('a real q param is trimmed and passed to searchProducts, response echoes its result', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    const fakeResults = [
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
    searchProducts.mockResolvedValue(fakeResults);

    const response = await GET(request('http://localhost/api/search?q=%20hoodie%20'));

    expect(searchProducts).toHaveBeenCalledWith('hoodie');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ products: fakeResults });
  });

  test('a q param longer than 100 characters is truncated before being passed to searchProducts', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    searchProducts.mockResolvedValue([]);
    const longQuery = 'a'.repeat(150);

    await GET(request(`http://localhost/api/search?q=${longQuery}`));

    expect(searchProducts).toHaveBeenCalledWith('a'.repeat(100));
  });

  test('searchProducts rejecting becomes a 500 with a generic body, never the real error message', async () => {
    const searchProducts = vi.mocked(productsModule.searchProducts);
    searchProducts.mockRejectedValue(new Error('Shopify Storefront API is not configured'));
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

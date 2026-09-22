import { NextRequest } from 'next/server';
import { describe, expect, test, vi } from 'vitest';
import { GET } from './route';
import * as productsModule from '@/lib/shopify/products';
import type { ProductDetail } from '@/lib/shopify/products';

// Mirrors app/api/search/route.test.ts's exact structure — a unit test of
// this route's own parsing/response-shaping logic, not of Shopify
// integration (already covered by lib/shopify/products.test.ts). Mocks
// getProduct entirely.
vi.mock('@/lib/shopify/products');

function request(url: string): NextRequest {
  return new NextRequest(url);
}

// Next's router binds a dynamic segment via the second `context.params`
// argument at runtime, not by parsing the request URL — a plain
// NextRequest doesn't parse [handle] itself, so the second argument is
// constructed directly here, matching the route's own destructuring.
function context(handle: string): { params: Promise<{ handle: string }> } {
  return { params: Promise.resolve({ handle }) };
}

const FAKE_PRODUCT: ProductDetail = {
  id: 'gid://shopify/Product/1',
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  description: 'A hoodie.',
  productType: 'Hoodies',
  tags: [],
  minPrice: { amount: '180.00', currencyCode: 'USD' },
  images: [],
  options: [{ id: 'opt-size', name: 'Size', values: ['M', 'L'] }],
  variants: [
    {
      id: 'gid://shopify/ProductVariant/1',
      title: 'M',
      availableForSale: true,
      quantityAvailable: 5,
      price: { amount: '180.00', currencyCode: 'USD' },
      selectedOptions: [{ name: 'Size', value: 'M' }],
    },
  ],
};

describe('GET /api/products/[handle]', () => {
  test('a found product is returned with status 200, getProduct called with the path handle', async () => {
    const getProduct = vi.mocked(productsModule.getProduct);
    getProduct.mockResolvedValue(FAKE_PRODUCT);

    const response = await GET(
      request('http://localhost/api/products/hoodie-01'),
      context('hoodie-01'),
    );

    expect(getProduct).toHaveBeenCalledWith('hoodie-01');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ product: FAKE_PRODUCT });
  });

  test("a not-found product returns { product: null } with status 200, mirroring getProduct's own contract", async () => {
    const getProduct = vi.mocked(productsModule.getProduct);
    getProduct.mockResolvedValue(null);

    const response = await GET(
      request('http://localhost/api/products/does-not-exist'),
      context('does-not-exist'),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ product: null });
  });

  test('getProduct rejecting becomes a 500 with a generic body, never the real error message', async () => {
    const getProduct = vi.mocked(productsModule.getProduct);
    getProduct.mockRejectedValue(new Error('Shopify Storefront API is not configured'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(
      request('http://localhost/api/products/hoodie-01'),
      context('hoodie-01'),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'product_fetch_failed' });
    expect(JSON.stringify(body)).not.toContain('not configured');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

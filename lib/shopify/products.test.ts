import { describe, expect, test, vi } from 'vitest';
import { getProduct, getProductsByCollection } from '@/lib/shopify/products';
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
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/1',
                  title: 'M',
                  availableForSale: true,
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
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          title: 'M',
          availableForSale: true,
          price: { amount: '120.00', currencyCode: 'USD' },
          selectedOptions: [{ name: 'Size', value: 'M' }],
        },
      ],
    });
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

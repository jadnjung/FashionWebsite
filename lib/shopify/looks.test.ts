import { describe, expect, test, vi } from 'vitest';
import * as clientModule from '@/lib/shopify/client';
import { getLooks } from '@/lib/shopify/looks';

function mockClient(response: unknown) {
  const request = vi.fn().mockResolvedValue(response);
  vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
    request,
  } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);
  return request;
}

function productNode(handle: string, imageUrl?: string) {
  return {
    id: `gid://shopify/Product/${handle}`,
    handle,
    title: handle.toUpperCase(),
    description: '',
    productType: 'Trousers',
    tags: [],
    priceRange: { minVariantPrice: { amount: '100.00', currencyCode: 'USD' } },
    images: {
      edges: imageUrl ? [{ node: { url: imageUrl, altText: null, width: 800, height: 1000 } }] : [],
    },
    options: [{ id: 'o1', name: 'Size', optionValues: [{ id: 'v1', name: 'M' }] }],
    variants: {
      edges: [
        {
          node: {
            id: 'var1',
            title: 'M',
            availableForSale: true,
            quantityAvailable: 3,
            price: { amount: '100.00', currencyCode: 'USD' },
            selectedOptions: [{ name: 'Size', value: 'M' }],
          },
        },
      ],
    },
  };
}

describe('getLooks', () => {
  test('maps title, photo, and products with their variants', async () => {
    const request = mockClient({
      data: {
        metaobjects: {
          nodes: [
            {
              handle: 'look-01',
              title: { value: ' Look 01 ' },
              image: {
                reference: {
                  image: {
                    url: 'https://cdn.shopify.com/look.jpg',
                    altText: 'Look',
                    width: 800,
                    height: 1000,
                  },
                },
              },
              products: { references: { nodes: [productNode('trouser'), productNode('shirt')] } },
            },
          ],
        },
      },
    });

    const looks = await getLooks();

    expect(request).toHaveBeenCalledWith(expect.any(String), { variables: { first: 9 } });
    expect(looks).toHaveLength(1);
    expect(looks[0]).toMatchObject({
      handle: 'look-01',
      title: 'Look 01',
      image: { url: 'https://cdn.shopify.com/look.jpg', altText: 'Look' },
    });
    expect(looks[0]?.products.map((p) => p.handle)).toEqual(['trouser', 'shirt']);
    expect(looks[0]?.products[0]?.variants[0]?.quantityAvailable).toBe(3);
  });

  test('drops unpublished product references and looks left with no products', async () => {
    mockClient({
      data: {
        metaobjects: {
          nodes: [
            {
              handle: 'a',
              title: null,
              image: null,
              products: { references: { nodes: [{}, productNode('kept')] } },
            },
            { handle: 'b', title: null, image: null, products: { references: { nodes: [{}] } } },
            { handle: 'c', title: null, image: null, products: null },
          ],
        },
      },
    });
    const looks = await getLooks();
    expect(looks.map((look) => look.handle)).toEqual(['a']);
    expect(looks[0]?.products.map((p) => p.handle)).toEqual(['kept']);
  });

  test("falls back to the first product's image when the look has no photo", async () => {
    mockClient({
      data: {
        metaobjects: {
          nodes: [
            {
              handle: 'a',
              title: { value: '' },
              image: { reference: null },
              products: {
                references: { nodes: [productNode('p', 'https://cdn.shopify.com/p.jpg')] },
              },
            },
          ],
        },
      },
    });
    const [look] = await getLooks();
    expect(look?.title).toBeNull();
    expect(look?.image?.url).toBe('https://cdn.shopify.com/p.jpg');
  });

  test('throws on a real request error', async () => {
    mockClient({
      data: undefined,
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });
    await expect(getLooks()).rejects.toThrow('Throttled by Shopify');
  });

  test('Demo Mode returns nine fixture looks without touching the Storefront client', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const before = getStorefrontClient.mock.calls.length;
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');

    const looks = await getLooks();

    expect(looks).toHaveLength(9);
    expect(looks.every((look) => look.image && look.products.length >= 2)).toBe(true);
    expect(new Set(looks.map((look) => look.handle)).size).toBe(9);
    expect(getStorefrontClient.mock.calls.length).toBe(before);
  });
});

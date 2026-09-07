import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getInteractiveModelLook } from '@/lib/interactive-model/look';
import * as productsModule from '@/lib/shopify/products';

// This file is the first in this codebase to assert exact call counts
// (toHaveBeenCalledTimes/toHaveBeenNthCalledWith) rather than just
// toHaveBeenCalledWith — vi.spyOn's mock history otherwise accumulates
// across tests within a file (no project-wide clearMocks/restoreMocks is
// configured in vitest.config.ts), so each test starts from a clean spy.
beforeEach(() => {
  vi.restoreAllMocks();
});

const TOP_SUMMARY = {
  id: 'gid://shopify/Product/1',
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  productType: 'Hoodies',
  tags: [],
  availableForSale: true,
  minPrice: { amount: '180.00', currencyCode: 'USD' },
  images: [],
};

const BOTTOM_SUMMARY = {
  id: 'gid://shopify/Product/2',
  handle: 'pants-01',
  title: 'Pants 01',
  productType: 'Trousers',
  tags: [],
  availableForSale: true,
  minPrice: { amount: '160.00', currencyCode: 'USD' },
  images: [],
};

function detailFor(summary: typeof TOP_SUMMARY) {
  return {
    id: summary.id,
    handle: summary.handle,
    title: summary.title,
    description: 'A real description.',
    productType: summary.productType,
    tags: [],
    minPrice: summary.minPrice,
    images: [],
    options: [{ id: 'opt1', name: 'Size', values: ['S', 'M', 'L'] }],
    variants: [
      {
        id: 'v1',
        title: 'S',
        availableForSale: true,
        quantityAvailable: 5,
        price: summary.minPrice,
        selectedOptions: [{ name: 'Size', value: 'S' }],
      },
    ],
  };
}

describe('getInteractiveModelLook', () => {
  test('resolves one garment per hotspot region when every region has a product', async () => {
    vi.spyOn(productsModule, 'getProducts')
      .mockResolvedValueOnce({ products: [TOP_SUMMARY], hasNextPage: false, endCursor: null })
      .mockResolvedValueOnce({ products: [BOTTOM_SUMMARY], hasNextPage: false, endCursor: null });
    vi.spyOn(productsModule, 'getProduct').mockImplementation(async (handle: string) =>
      handle === TOP_SUMMARY.handle ? detailFor(TOP_SUMMARY) : detailFor(BOTTOM_SUMMARY),
    );

    const result = await getInteractiveModelLook();

    expect(result).toEqual([
      { region: 'top', regionLabel: 'Top', product: detailFor(TOP_SUMMARY) },
      { region: 'bottom', regionLabel: 'Bottom', product: detailFor(BOTTOM_SUMMARY) },
    ]);
  });

  test('queries each region by its own category product types', async () => {
    const getProducts = vi
      .spyOn(productsModule, 'getProducts')
      .mockResolvedValue({ products: [], hasNextPage: false, endCursor: null });

    await getInteractiveModelLook();

    // HOTSPOT_REGIONS.map(resolveRegion) invokes getProducts synchronously
    // in array order (top, then bottom) before either promise resolves —
    // call order here reflects that construction order, not timing.
    expect(getProducts).toHaveBeenCalledTimes(2);
    expect(getProducts).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ query: expect.stringContaining('Hoodies') }),
    );
    expect(getProducts).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ query: expect.stringContaining('Trousers') }),
    );
  });

  test('omits a region whose query returns no product, without erroring', async () => {
    vi.spyOn(productsModule, 'getProducts')
      .mockResolvedValueOnce({ products: [], hasNextPage: false, endCursor: null })
      .mockResolvedValueOnce({ products: [BOTTOM_SUMMARY], hasNextPage: false, endCursor: null });
    vi.spyOn(productsModule, 'getProduct').mockResolvedValue(detailFor(BOTTOM_SUMMARY));

    const result = await getInteractiveModelLook();

    expect(result).toEqual([
      { region: 'bottom', regionLabel: 'Bottom', product: detailFor(BOTTOM_SUMMARY) },
    ]);
  });

  test('resolves to an empty list, not a throw, when a Shopify call rejects', async () => {
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(
      new Error('Shopify Storefront API is not configured.'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getInteractiveModelLook()).resolves.toEqual([]);
  });

  test('logs the failure so it stays operationally visible', async () => {
    const error = new Error('Throttled by Shopify');
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await getInteractiveModelLook();

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Look'), error);
  });
});

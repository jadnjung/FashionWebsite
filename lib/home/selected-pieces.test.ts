import { describe, expect, test, vi } from 'vitest';
import { getSelectedPieces } from '@/lib/home/selected-pieces';
import * as productsModule from '@/lib/shopify/products';

const FIXTURE_PRODUCT = {
  id: 'gid://shopify/Product/1',
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  productType: 'Hoodies',
  tags: [],
  minPrice: { amount: '180.00', currencyCode: 'USD' },
  availableForSale: true,
  images: [],
};

describe('getSelectedPieces', () => {
  test('returns the products getProducts resolves', async () => {
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue({
      products: [FIXTURE_PRODUCT],
      hasNextPage: false,
      endCursor: null,
    });

    const result = await getSelectedPieces();
    expect(result).toEqual([FIXTURE_PRODUCT]);
  });

  test('requests the given limit as `first`, defaulting to 3', async () => {
    const getProducts = vi
      .spyOn(productsModule, 'getProducts')
      .mockResolvedValue({ products: [], hasNextPage: false, endCursor: null });

    await getSelectedPieces();
    expect(getProducts).toHaveBeenCalledWith({ first: 3 });

    await getSelectedPieces(4);
    expect(getProducts).toHaveBeenCalledWith({ first: 4 });
  });

  test('resolves to an empty list, not a throw, when getProducts rejects', async () => {
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(
      new Error('Shopify Storefront API is not configured.'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getSelectedPieces()).resolves.toEqual([]);
  });

  test('logs the failure so it stays operationally visible', async () => {
    const error = new Error('Throttled by Shopify');
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await getSelectedPieces();

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Selected Pieces'), error);
  });
});

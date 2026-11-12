import { describe, expect, test, vi } from 'vitest';
import { getClosetCollection } from '@/lib/home/closet';
import * as collectionsModule from '@/lib/shopify/collections';
import * as productsModule from '@/lib/shopify/products';

const NOW = new Date('2026-11-11T00:00:00Z');

function collection(handle: string, overrides: Partial<collectionsModule.CollectionSummary> = {}) {
  return {
    id: `gid://shopify/Collection/${handle}`,
    handle,
    title: handle.toUpperCase(),
    dropStatus: null,
    dropDate: null,
    archivedAt: null,
    ...overrides,
  };
}

const PRODUCT: productsModule.ClosetProduct = {
  id: 'gid://shopify/Product/1',
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  description: 'A hoodie.',
  productType: 'Hoodies',
  minPrice: { amount: '180.00', currencyCode: 'USD' },
  image: null,
  modelUrl: null,
};

function mockCollections(collections: collectionsModule.CollectionSummary[]) {
  vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
    collections,
    hasNextPage: false,
    endCursor: null,
  });
}

describe('getClosetCollection', () => {
  test('hangs the first current collection, skipping archived and upcoming ones', async () => {
    mockCollections([
      collection('collection-000', { archivedAt: '2026-01-01T00:00:00Z' }),
      collection('collection-002', { dropDate: '2026-12-01T00:00:00Z' }),
      collection('collection-001'),
    ]);
    const getClosetProducts = vi
      .spyOn(productsModule, 'getClosetProducts')
      .mockResolvedValue([PRODUCT]);

    const result = await getClosetCollection(NOW);

    expect(getClosetProducts).toHaveBeenCalledWith('collection-001');
    expect(result).toEqual({
      handle: 'collection-001',
      title: 'COLLECTION-001',
      products: [PRODUCT],
    });
  });

  test('returns null when no collection is current', async () => {
    mockCollections([collection('collection-002', { dropDate: '2026-12-01T00:00:00Z' })]);
    await expect(getClosetCollection(NOW)).resolves.toBeNull();
  });

  test('returns null when the current collection has no products', async () => {
    mockCollections([collection('collection-001')]);
    vi.spyOn(productsModule, 'getClosetProducts').mockResolvedValue([]);
    await expect(getClosetCollection(NOW)).resolves.toBeNull();
  });

  test('resolves to null and logs, rather than throwing, when Shopify fails', async () => {
    const error = new Error('Throttled by Shopify');
    vi.spyOn(collectionsModule, 'getCollections').mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getClosetCollection(NOW)).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Collection Closet'), error);
  });
});

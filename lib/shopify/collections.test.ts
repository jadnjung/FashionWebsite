import { describe, expect, test, vi } from 'vitest';
import { getCollection, getCollections } from '@/lib/shopify/collections';
import * as clientModule from '@/lib/shopify/client';

function mockClient(response: unknown) {
  vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
    request: vi.fn().mockResolvedValue(response),
  } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);
}

describe('getCollection', () => {
  test('returns null when no collection matches the handle', async () => {
    mockClient({ data: { collection: null } });
    const result = await getCollection('does-not-exist');
    expect(result).toBeNull();
  });

  test('maps a real-shaped response into a CollectionDetail, defaulting absent metafields to null', async () => {
    mockClient({
      data: {
        collection: {
          id: 'gid://shopify/Collection/1',
          handle: 'collection-001',
          title: 'Collection 001',
          description: 'The first drop.',
          dropStatus: { value: 'active' },
          dropDate: null,
          archivedAt: null,
          products: {
            edges: [
              {
                cursor: 'c1',
                node: { id: 'gid://shopify/Product/1', handle: 'item-one', title: 'Item One' },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'c1' },
          },
        },
      },
    });

    const result = await getCollection('collection-001');

    expect(result).toEqual({
      id: 'gid://shopify/Collection/1',
      handle: 'collection-001',
      title: 'Collection 001',
      description: 'The first drop.',
      dropStatus: 'active',
      dropDate: null,
      archivedAt: null,
      products: [{ id: 'gid://shopify/Product/1', handle: 'item-one', title: 'Item One' }],
      hasNextPage: false,
      endCursor: 'c1',
    });
  });

  test('throws when the response includes errors, rather than treating it as not-found', async () => {
    mockClient({
      data: { collection: null },
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });

    await expect(getCollection('collection-001')).rejects.toThrow('Throttled by Shopify');
  });
});

describe('getCollections', () => {
  test('maps a page of collections with pagination info', async () => {
    mockClient({
      data: {
        collections: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: 'gid://shopify/Collection/1',
                handle: 'collection-001',
                title: 'Collection 001',
                dropStatus: { value: 'active' },
              },
            },
          ],
          pageInfo: { hasNextPage: true, endCursor: 'c1' },
        },
      },
    });

    const result = await getCollections();

    expect(result).toEqual({
      collections: [
        {
          id: 'gid://shopify/Collection/1',
          handle: 'collection-001',
          title: 'Collection 001',
          dropStatus: 'active',
        },
      ],
      hasNextPage: true,
      endCursor: 'c1',
    });
  });

  test('throws when the response includes errors, rather than returning an empty page', async () => {
    mockClient({
      data: undefined,
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });

    await expect(getCollections()).rejects.toThrow('Throttled by Shopify');
  });
});

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

  test('surfaces the real graphQLErrors detail instead of the generic client message', async () => {
    mockClient({
      data: { collection: null },
      errors: {
        message:
          "GraphQL Client: An error occurred while fetching from the API. Review 'graphQLErrors' for details.",
        graphQLErrors: [{ message: 'Field does not exist on type Collection' }],
      },
    });

    await expect(getCollection('collection-001')).rejects.toThrow(
      'Field does not exist on type Collection',
    );
  });

  test('propagates the client\'s "not configured" error rather than attempting a request', async () => {
    vi.spyOn(clientModule, 'getStorefrontClient').mockImplementation(() => {
      throw new Error(
        'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
      );
    });

    await expect(getCollection('collection-001')).rejects.toThrow(
      'Shopify Storefront API is not configured',
    );
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
                archivedAt: null,
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
          archivedAt: null,
        },
      ],
      hasNextPage: true,
      endCursor: 'c1',
    });
  });

  test('maps a real, non-null archivedAt metafield through — the signal isCollectionArchived relies on for the archive index', async () => {
    mockClient({
      data: {
        collections: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: 'gid://shopify/Collection/2',
                handle: 'collection-000',
                title: 'Collection 000',
                dropStatus: { value: 'archived' },
                archivedAt: { value: '2026-06-01T00:00:00Z' },
              },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: 'c1' },
        },
      },
    });

    const result = await getCollections();
    expect(result.collections[0].archivedAt).toBe('2026-06-01T00:00:00Z');
  });

  test('throws when the response includes errors, rather than returning an empty page', async () => {
    mockClient({
      data: undefined,
      errors: { message: 'Throttled by Shopify', networkStatusCode: 429 },
    });

    await expect(getCollections()).rejects.toThrow('Throttled by Shopify');
  });

  test('propagates the client\'s "not configured" error rather than attempting a request', async () => {
    vi.spyOn(clientModule, 'getStorefrontClient').mockImplementation(() => {
      throw new Error(
        'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
      );
    });

    await expect(getCollections()).rejects.toThrow('Shopify Storefront API is not configured');
  });
});

// Demo Mode (DECISIONS.md D-057) — the PREVIEW_DEMO_MODE-gated
// short-circuits in getCollection/getCollections. `vi.stubEnv` is
// auto-restored after each test (vitest.config.ts's `unstubEnvs: true`),
// so it's safe to set per-test without a shared beforeEach/afterEach. The
// "never touches the Storefront client" tests below compare the spy's
// call count before and after, mirroring products.test.ts's own Demo Mode
// test style exactly (see that file's comment for why).
describe('getCollection — Demo Mode', () => {
  test('short-circuits to fixture data and never touches the Storefront client', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const callsBefore = getStorefrontClient.mock.calls.length;
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');

    const result = await getCollection('collection-000');

    expect(result?.dropStatus).toBe('archived');
    expect(getStorefrontClient.mock.calls.length).toBe(callsBefore);
  });

  test('a real, current (non-archived) collection handle still resolves — proves the fixtures are not archived-only', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getCollection('collection-001');
    expect(result?.dropStatus).toBe('active');
  });

  test('returns null for a handle with no matching fixture, same as the real not-found contract', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getCollection('does-not-exist');
    expect(result).toBeNull();
  });
});

describe('getCollections — Demo Mode', () => {
  test('short-circuits to fixture data and never touches the Storefront client', async () => {
    const getStorefrontClient = vi.spyOn(clientModule, 'getStorefrontClient');
    const callsBefore = getStorefrontClient.mock.calls.length;
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');

    const result = await getCollections();

    expect(result.collections.length).toBeGreaterThan(0);
    expect(result.hasNextPage).toBe(false);
    expect(result.endCursor).toBeNull();
    expect(getStorefrontClient.mock.calls.length).toBe(callsBefore);
  });

  test('respects `first`', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const result = await getCollections(1);
    expect(result.collections).toHaveLength(1);
  });
});

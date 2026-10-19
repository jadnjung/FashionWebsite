import { describe, expect, test, vi } from 'vitest';
import { getUpcomingDrop } from '@/lib/home/upcoming-drop';
import * as collectionsModule from '@/lib/shopify/collections';

const CURRENT = {
  id: 'gid://shopify/Collection/1',
  handle: 'collection-001',
  title: 'Collection 001',
  dropStatus: 'active',
  dropDate: null,
  archivedAt: null,
};

const ARCHIVED = {
  id: 'gid://shopify/Collection/2',
  handle: 'collection-000',
  title: 'Collection 000',
  dropStatus: 'archived',
  dropDate: '2026-11-20T12:00:00Z', // internally-contradictory; archived wins
  archivedAt: '2026-06-01T00:00:00Z',
};

const UPCOMING = {
  id: 'gid://shopify/Collection/3',
  handle: 'collection-002',
  title: 'Collection 002',
  dropStatus: 'active',
  dropDate: '2026-11-20T12:00:00Z',
  archivedAt: null,
};

describe('getUpcomingDrop', () => {
  test('resolves to the upcoming collection among a mixed list', async () => {
    vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
      collections: [CURRENT, ARCHIVED, UPCOMING],
      hasNextPage: false,
      endCursor: null,
    });

    const result = await getUpcomingDrop();
    expect(result).toEqual({
      handle: 'collection-002',
      title: 'Collection 002',
      dropDate: '2026-11-20T12:00:00Z',
    });
  });

  test('resolves to null when every collection is current', async () => {
    vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
      collections: [CURRENT],
      hasNextPage: false,
      endCursor: null,
    });

    await expect(getUpcomingDrop()).resolves.toBeNull();
  });

  test('resolves to null when every collection is archived', async () => {
    vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
      collections: [ARCHIVED],
      hasNextPage: false,
      endCursor: null,
    });

    await expect(getUpcomingDrop()).resolves.toBeNull();
  });

  test('resolves to null when getCollections resolves an empty list', async () => {
    vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
      collections: [],
      hasNextPage: false,
      endCursor: null,
    });

    await expect(getUpcomingDrop()).resolves.toBeNull();
  });

  test('resolves to null (not a throw) when getCollections rejects, and logs the failure', async () => {
    const error = new Error('Shopify Storefront API is not configured.');
    vi.spyOn(collectionsModule, 'getCollections').mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getUpcomingDrop()).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Drop Status'), error);
  });
});

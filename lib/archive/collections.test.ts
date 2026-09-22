import { describe, expect, test, vi } from 'vitest';
import {
  getArchivedCollection,
  getArchivedCollections,
  isCollectionArchived,
} from '@/lib/archive/collections';
import * as collectionsModule from '@/lib/shopify/collections';

const CURRENT_SUMMARY = {
  id: 'gid://shopify/Collection/1',
  handle: 'collection-001',
  title: 'Collection 001',
  dropStatus: 'active',
  archivedAt: null,
};

const ARCHIVED_SUMMARY = {
  id: 'gid://shopify/Collection/2',
  handle: 'collection-000',
  title: 'Collection 000',
  dropStatus: 'archived',
  archivedAt: '2026-06-01T00:00:00Z',
};

const ARCHIVED_DETAIL = {
  ...ARCHIVED_SUMMARY,
  description: 'The collection that came before.',
  dropDate: null,
  archivedAt: '2026-06-01T00:00:00Z',
  products: [],
  hasNextPage: false,
  endCursor: null,
};

const CURRENT_DETAIL = {
  ...CURRENT_SUMMARY,
  description: 'The current collection.',
  dropDate: null,
  archivedAt: null,
  products: [],
  hasNextPage: false,
  endCursor: null,
};

describe('isCollectionArchived', () => {
  test('true when dropStatus is "archived"', () => {
    expect(isCollectionArchived({ dropStatus: 'archived', archivedAt: null })).toBe(true);
  });

  test('true when dropStatus is "Archived" (case-insensitive)', () => {
    expect(isCollectionArchived({ dropStatus: 'Archived', archivedAt: null })).toBe(true);
  });

  test('true when archivedAt is set, even with dropStatus null (corroborating signal alone is sufficient)', () => {
    expect(isCollectionArchived({ dropStatus: null, archivedAt: '2026-06-01T00:00:00Z' })).toBe(
      true,
    );
  });

  test('false when dropStatus is "active" and archivedAt is null', () => {
    expect(isCollectionArchived({ dropStatus: 'active', archivedAt: null })).toBe(false);
  });

  test('false when both signals are null', () => {
    expect(isCollectionArchived({ dropStatus: null, archivedAt: null })).toBe(false);
  });
});

describe('getArchivedCollections', () => {
  test('filters a mixed list down to only archived entries', async () => {
    vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
      collections: [CURRENT_SUMMARY, ARCHIVED_SUMMARY],
      hasNextPage: false,
      endCursor: null,
    });

    const result = await getArchivedCollections();
    expect(result).toEqual([ARCHIVED_SUMMARY]);
  });

  test('returns [] when none are archived', async () => {
    vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
      collections: [CURRENT_SUMMARY],
      hasNextPage: false,
      endCursor: null,
    });

    const result = await getArchivedCollections();
    expect(result).toEqual([]);
  });

  test('propagates (does not catch) a rejection from getCollections', async () => {
    const error = new Error('Throttled by Shopify');
    vi.spyOn(collectionsModule, 'getCollections').mockRejectedValue(error);

    await expect(getArchivedCollections()).rejects.toThrow('Throttled by Shopify');
  });
});

describe('getArchivedCollection', () => {
  test('returns the detail for an archived handle', async () => {
    vi.spyOn(collectionsModule, 'getCollection').mockResolvedValue(ARCHIVED_DETAIL);

    const result = await getArchivedCollection('collection-000');
    expect(result).toEqual(ARCHIVED_DETAIL);
  });

  test('returns null for a handle getCollection resolves to null', async () => {
    vi.spyOn(collectionsModule, 'getCollection').mockResolvedValue(null);

    const result = await getArchivedCollection('does-not-exist');
    expect(result).toBeNull();
  });

  test('returns null for a handle that resolves to a real, non-archived collection', async () => {
    vi.spyOn(collectionsModule, 'getCollection').mockResolvedValue(CURRENT_DETAIL);

    const result = await getArchivedCollection('collection-001');
    expect(result).toBeNull();
  });

  test('propagates (does not catch) a rejection from getCollection', async () => {
    const error = new Error('Throttled by Shopify');
    vi.spyOn(collectionsModule, 'getCollection').mockRejectedValue(error);

    await expect(getArchivedCollection('collection-000')).rejects.toThrow('Throttled by Shopify');
  });
});

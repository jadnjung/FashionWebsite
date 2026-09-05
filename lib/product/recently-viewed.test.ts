import { describe, expect, test } from 'vitest';
import {
  readRecentlyViewed,
  recordRecentlyViewed,
  type RecentlyViewedItem,
  type RecentlyViewedStorage,
} from '@/lib/product/recently-viewed';

function fakeStorage(initial: Record<string, string> = {}): RecentlyViewedStorage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

const ITEM_A: RecentlyViewedItem = {
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  imageUrl: 'https://cdn.example/hoodie-01.jpg',
  imageAlt: null,
  minPrice: { amount: '180.00', currencyCode: 'USD' },
};

const ITEM_B: RecentlyViewedItem = {
  handle: 'pants-01',
  title: 'Pants 01',
  imageUrl: 'https://cdn.example/pants-01.jpg',
  imageAlt: null,
  minPrice: { amount: '140.00', currencyCode: 'USD' },
};

describe('readRecentlyViewed', () => {
  test('returns an empty array when nothing is stored', () => {
    expect(readRecentlyViewed(fakeStorage())).toEqual([]);
  });

  test('returns an empty array for corrupt JSON, without throwing', () => {
    expect(readRecentlyViewed(fakeStorage({ 'esque:recently-viewed': '{not json' }))).toEqual([]);
  });

  test('returns an empty array for a missing/mismatched schema version', () => {
    const raw = JSON.stringify({ v: 99, items: [ITEM_A] });
    expect(readRecentlyViewed(fakeStorage({ 'esque:recently-viewed': raw }))).toEqual([]);
  });

  test('returns an empty array when a getItem call itself throws', () => {
    const storage: RecentlyViewedStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
    };
    expect(readRecentlyViewed(storage)).toEqual([]);
  });
});

describe('recordRecentlyViewed', () => {
  test('adds the first item', () => {
    const storage = fakeStorage();
    expect(recordRecentlyViewed(storage, ITEM_A)).toEqual([ITEM_A]);
    expect(readRecentlyViewed(storage)).toEqual([ITEM_A]);
  });

  test('moves a re-viewed item to the front rather than duplicating it', () => {
    const storage = fakeStorage();
    recordRecentlyViewed(storage, ITEM_A);
    recordRecentlyViewed(storage, ITEM_B);
    expect(recordRecentlyViewed(storage, ITEM_A)).toEqual([ITEM_A, ITEM_B]);
  });

  test('caps at max, dropping the oldest', () => {
    const storage = fakeStorage();
    recordRecentlyViewed(storage, ITEM_A, 1);
    expect(recordRecentlyViewed(storage, ITEM_B, 1)).toEqual([ITEM_B]);
  });

  test('still returns the correct in-memory list even when setItem throws', () => {
    const storage: RecentlyViewedStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(recordRecentlyViewed(storage, ITEM_A)).toEqual([ITEM_A]);
  });
});

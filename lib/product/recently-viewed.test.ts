import { describe, expect, test } from 'vitest';
import {
  readRecentlyViewed,
  recordRecentlyViewed,
  createRecentlyViewedSessionStorage,
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
  imageUrl: 'https://cdn.shopify.com/hoodie-01.jpg',
  imageAlt: null,
  minPrice: { amount: '180.00', currencyCode: 'USD' },
};

const ITEM_B: RecentlyViewedItem = {
  handle: 'pants-01',
  title: 'Pants 01',
  imageUrl: 'https://cdn.shopify.com/pants-01.jpg',
  imageAlt: null,
  minPrice: { amount: '140.00', currencyCode: 'USD' },
};

describe('readRecentlyViewed', () => {
  test('keeps valid legacy records, removes malformed records and duplicate handles', () => {
    const raw = JSON.stringify({
      v: 1,
      items: [null, {}, { ...ITEM_A, handle: '../escape' }, ITEM_A, ITEM_A, ITEM_B],
    });
    expect(readRecentlyViewed(fakeStorage({ 'esque:recently-viewed': raw }))).toEqual([
      ITEM_A,
      ITEM_B,
    ]);
  });

  test('drops unsafe images while retaining the useful saved record', () => {
    const raw = JSON.stringify({
      v: 1,
      items: [
        { ...ITEM_A, imageUrl: 'javascript:alert(1)' },
        { ...ITEM_B, minPrice: { amount: 'NaN', currencyCode: 'x' } },
      ],
    });
    expect(readRecentlyViewed(fakeStorage({ 'esque:recently-viewed': raw }))).toEqual([
      { ...ITEM_A, imageUrl: null },
    ]);
  });

  test('bounds valid persisted history to eight records', () => {
    const raw = JSON.stringify({
      v: 1,
      items: Array.from({ length: 20 }, (_, index) => ({ ...ITEM_A, handle: `piece-${index}` })),
    });
    expect(readRecentlyViewed(fakeStorage({ 'esque:recently-viewed': raw }))).toHaveLength(8);
  });
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

describe('session fallback', () => {
  test('guards a throwing storage getter and retains history in this session', () => {
    const storage = createRecentlyViewedSessionStorage(() => {
      throw new Error('SecurityError');
    });
    recordRecentlyViewed(storage, ITEM_A);
    recordRecentlyViewed(storage, ITEM_B);
    expect(readRecentlyViewed(storage)).toEqual([ITEM_B, ITEM_A]);
  });

  test('retains unsaved session changes when persistence runs out of quota', () => {
    const storage = createRecentlyViewedSessionStorage(() => ({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    }));
    recordRecentlyViewed(storage, ITEM_A);
    expect(readRecentlyViewed(storage)).toEqual([ITEM_A]);
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

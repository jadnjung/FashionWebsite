import { describe, expect, test } from 'vitest';
import {
  addToWishlist,
  createWishlistSessionStorage,
  isInWishlist,
  readWishlist,
  removeFromWishlist,
  toProductListItem,
  type WishlistItem,
  type WishlistStorage,
} from '@/lib/product/wishlist';
import type { ProductDetail, ProductVariant } from '@/lib/shopify/products';

function fakeStorage(initial: Record<string, string> = {}): WishlistStorage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

const ITEM_A: WishlistItem = {
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  imageUrl: 'https://cdn.shopify.com/hoodie-01.jpg',
  imageAlt: null,
  minPrice: { amount: '180.00', currencyCode: 'USD' },
};

const ITEM_B: WishlistItem = {
  handle: 'pants-01',
  title: 'Pants 01',
  imageUrl: 'https://cdn.shopify.com/pants-01.jpg',
  imageAlt: null,
  minPrice: { amount: '140.00', currencyCode: 'USD' },
};

describe('wishlist session storage', () => {
  test('retains multiple saves and removals when storage writes fail', () => {
    const browserStorage: WishlistStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    const storage = createWishlistSessionStorage(() => browserStorage);
    addToWishlist(storage, ITEM_A);
    addToWishlist(storage, ITEM_B);
    expect(readWishlist(storage)).toEqual([ITEM_B, ITEM_A]);
    expect(storage.persistenceError).toBe(true);
    removeFromWishlist(storage, ITEM_A.handle);
    expect(readWishlist(storage)).toEqual([ITEM_B]);
  });

  test('handles a blocked localStorage getter and retries persistence on a later mutation', () => {
    let blocked = true;
    const browserStorage = fakeStorage();
    const storage = createWishlistSessionStorage(() => {
      if (blocked) throw new Error('SecurityError');
      return browserStorage;
    });
    expect(readWishlist(storage)).toEqual([]);
    addToWishlist(storage, ITEM_A);
    expect(readWishlist(storage)).toEqual([ITEM_A]);
    expect(storage.persistenceError).toBe(true);
    blocked = false;
    addToWishlist(storage, ITEM_B);
    expect(readWishlist(browserStorage)).toEqual([ITEM_B, ITEM_A]);
    expect(storage.persistenceError).toBe(false);
  });

  test('refreshes after another tab changes or clears the stored list', () => {
    const browserStorage = fakeStorage();
    const storage = createWishlistSessionStorage(() => browserStorage);
    addToWishlist(storage, ITEM_A);
    browserStorage.setItem('esque:wishlist', JSON.stringify({ v: 1, items: [ITEM_B] }));
    storage.refresh();
    expect(readWishlist(storage)).toEqual([ITEM_B]);
    browserStorage.setItem('esque:wishlist', '');
    storage.refresh();
    expect(readWishlist(storage)).toEqual([]);
  });

  test('preserves visit-only additions and removals when another tab changes storage', () => {
    const browserStorage = fakeStorage({
      'esque:wishlist': JSON.stringify({ v: 1, items: [ITEM_A] }),
    });
    const storage = createWishlistSessionStorage(() => ({
      getItem: browserStorage.getItem,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    }));
    addToWishlist(storage, ITEM_B);
    removeFromWishlist(storage, ITEM_A.handle);
    browserStorage.setItem('esque:wishlist', JSON.stringify({ v: 1, items: [ITEM_A] }));
    storage.refresh();
    expect(readWishlist(storage)).toEqual([ITEM_B]);
    expect(storage.persistenceError).toBe(true);
  });
});

describe('readWishlist', () => {
  test('preserves valid v1 saves while skipping malformed entries and duplicate handles', () => {
    const storage = fakeStorage({
      'esque:wishlist': JSON.stringify({
        v: 1,
        items: [null, ITEM_A, {}, { ...ITEM_B, minPrice: null }, ITEM_A, ITEM_B],
      }),
    });
    expect(readWishlist(storage)).toEqual([ITEM_A, ITEM_B]);
  });

  test('rejects unsafe handles and invalid prices without discarding other saves', () => {
    const storage = fakeStorage({
      'esque:wishlist': JSON.stringify({
        v: 1,
        items: [
          { ...ITEM_A, handle: '../access' },
          { ...ITEM_A, minPrice: { amount: 'NaN', currencyCode: 'USD' } },
          { ...ITEM_A, minPrice: { amount: '10', currencyCode: 'invalid' } },
          ITEM_B,
        ],
      }),
    });
    expect(readWishlist(storage)).toEqual([ITEM_B]);
  });

  test('keeps a saved product with a safe image fallback for an unsupported stored URL', () => {
    const storage = fakeStorage({
      'esque:wishlist': JSON.stringify({
        v: 1,
        items: [{ ...ITEM_A, imageUrl: 'javascript:alert(1)' }],
      }),
    });
    expect(readWishlist(storage)).toEqual([{ ...ITEM_A, imageUrl: null }]);
  });

  test.each([
    '/preview-demo/crewneck-front.jpg',
    '/preview-demo/crewneck_02.JPEG',
    '/preview-demo/crewneck.png',
    '/preview-demo/crewneck.webp',
    '/preview-demo/crewneck.avif',
  ])('preserves supported local fixture imagery %s', (imageUrl) => {
    const storage = fakeStorage({
      'esque:wishlist': JSON.stringify({ v: 1, items: [{ ...ITEM_A, imageUrl }] }),
    });
    expect(readWishlist(storage)).toEqual([{ ...ITEM_A, imageUrl }]);
  });

  test.each([
    '//preview-demo/crewneck.jpg',
    '/preview-demo/../crewneck.jpg',
    '/preview-demo/%2e%2e/crewneck.jpg',
    '/preview-demo/crewneck.jpg?redirect=1',
    '/preview-demo/crewneck.jpg#image',
    '/other/crewneck.jpg',
    '/preview-demo/crewneck.svg',
  ])('uses a safe fallback for unsupported local image paths %s', (imageUrl) => {
    const storage = fakeStorage({
      'esque:wishlist': JSON.stringify({ v: 1, items: [{ ...ITEM_A, imageUrl }] }),
    });
    expect(readWishlist(storage)).toEqual([{ ...ITEM_A, imageUrl: null }]);
  });

  test('returns an empty array when nothing is stored', () => {
    expect(readWishlist(fakeStorage())).toEqual([]);
  });

  test('returns an empty array for corrupt JSON, without throwing', () => {
    expect(readWishlist(fakeStorage({ 'esque:wishlist': '{not json' }))).toEqual([]);
  });

  test('returns an empty array for a missing/mismatched schema version', () => {
    const raw = JSON.stringify({ v: 99, items: [ITEM_A] });
    expect(readWishlist(fakeStorage({ 'esque:wishlist': raw }))).toEqual([]);
  });

  test('returns an empty array when a getItem call itself throws', () => {
    const storage: WishlistStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
    };
    expect(readWishlist(storage)).toEqual([]);
  });
});

describe('isInWishlist', () => {
  test('false when nothing is saved', () => {
    expect(isInWishlist(fakeStorage(), 'hoodie-01')).toBe(false);
  });

  test('true once an item has been saved', () => {
    const storage = fakeStorage();
    addToWishlist(storage, ITEM_A);
    expect(isInWishlist(storage, 'hoodie-01')).toBe(true);
    expect(isInWishlist(storage, 'pants-01')).toBe(false);
  });
});

describe('addToWishlist', () => {
  test('adds the first item', () => {
    const storage = fakeStorage();
    expect(addToWishlist(storage, ITEM_A)).toEqual([ITEM_A]);
    expect(readWishlist(storage)).toEqual([ITEM_A]);
  });

  test('prepends a second item (newest-first)', () => {
    const storage = fakeStorage();
    addToWishlist(storage, ITEM_A);
    expect(addToWishlist(storage, ITEM_B)).toEqual([ITEM_B, ITEM_A]);
  });

  test('dedupes by handle: adding an already-saved handle is a no-op with no reorder', () => {
    const storage = fakeStorage();
    addToWishlist(storage, ITEM_A);
    addToWishlist(storage, ITEM_B);
    // ITEM_A is already saved and is not the most recent — a naive
    // "dedupe by moving to front" (recordRecentlyViewed's own behavior)
    // would reorder it to [ITEM_A, ITEM_B]. addToWishlist must not do that.
    expect(addToWishlist(storage, ITEM_A)).toEqual([ITEM_B, ITEM_A]);
  });

  test('is not capped at any count — a wishlist never silently drops an earlier save', () => {
    const storage = fakeStorage();
    const items: WishlistItem[] = Array.from({ length: 50 }, (_, i) => ({
      handle: `item-${i}`,
      title: `Item ${i}`,
      imageUrl: null,
      imageAlt: null,
      minPrice: { amount: '10.00', currencyCode: 'USD' },
    }));
    let result: WishlistItem[] = [];
    for (const item of items) {
      result = addToWishlist(storage, item);
    }
    expect(result).toHaveLength(50);
    expect(readWishlist(storage)).toHaveLength(50);
    // Newest-first: the very first item added is still present, at the end.
    expect(result[result.length - 1]).toEqual(items[0]);
  });

  test('still returns the correct in-memory list even when setItem throws', () => {
    const storage: WishlistStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(addToWishlist(storage, ITEM_A)).toEqual([ITEM_A]);
  });
});

describe('removeFromWishlist', () => {
  test('removes a saved item', () => {
    const storage = fakeStorage();
    addToWishlist(storage, ITEM_A);
    addToWishlist(storage, ITEM_B);
    expect(removeFromWishlist(storage, 'hoodie-01')).toEqual([ITEM_B]);
    expect(readWishlist(storage)).toEqual([ITEM_B]);
  });

  test('is a no-op (same-content list) when the handle was never saved', () => {
    const storage = fakeStorage();
    addToWishlist(storage, ITEM_A);
    expect(removeFromWishlist(storage, 'not-saved')).toEqual([ITEM_A]);
  });

  test('still returns the correct in-memory list even when setItem throws', () => {
    const storage: WishlistStorage = {
      getItem: () => JSON.stringify({ v: 1, items: [ITEM_A] }),
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(removeFromWishlist(storage, 'hoodie-01')).toEqual([]);
  });
});

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'gid://shopify/ProductVariant/1',
    title: 'Default',
    availableForSale: true,
    quantityAvailable: 5,
    price: { amount: '180.00', currencyCode: 'USD' },
    selectedOptions: [],
    ...overrides,
  };
}

function makeProductDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 'gid://shopify/Product/1',
    handle: 'hoodie-01',
    title: 'Hoodie 01',
    description: 'A hoodie.',
    productType: 'Tops',
    tags: [],
    minPrice: { amount: '180.00', currencyCode: 'USD' },
    images: [
      { url: 'https://cdn.example/hoodie-01.jpg', altText: null, width: null, height: null },
    ],
    options: [],
    variants: [makeVariant()],
    ...overrides,
  };
}

describe('toProductListItem', () => {
  test('derives availableForSale: true when at least one variant is available', () => {
    const detail = makeProductDetail({
      variants: [
        makeVariant({ availableForSale: false }),
        makeVariant({ id: 'v2', availableForSale: true }),
      ],
    });
    const result = toProductListItem(detail);
    expect(result.availableForSale).toBe(true);
    expect(result).toEqual({
      id: detail.id,
      handle: detail.handle,
      title: detail.title,
      productType: detail.productType,
      tags: detail.tags,
      minPrice: detail.minPrice,
      availableForSale: true,
      images: detail.images,
    });
  });

  test('derives availableForSale: false when every variant is sold out', () => {
    const detail = makeProductDetail({
      variants: [
        makeVariant({ availableForSale: false }),
        makeVariant({ id: 'v2', availableForSale: false }),
      ],
    });
    expect(toProductListItem(detail).availableForSale).toBe(false);
  });
});

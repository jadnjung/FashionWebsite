// Client-only, localStorage-backed wishlist — no Shopify dependency at all
// (DECISIONS.md D-031, same precedent lib/product/recently-viewed.ts
// established). Denormalized snippets are stored directly
// (handle/title/image/price) rather than re-fetching full product data at
// render time. WishlistStorage is a minimal structural type (not DOM lib's
// full Storage) so this stays trivially fakeable in tests without jsdom.

import { isProductSoldOut } from '@/lib/product/variants';
import type { ProductDetail, ProductListItem } from '@/lib/shopify/products';

// Deliberately its own interface, not a re-export/alias of
// RecentlyViewedItem — the two shapes happen to be identical today, but
// "recently viewed" and "wishlist" are independently-evolving features
// (different lifecycle, different eventual server-side backing once
// accounts exist) that only coincidentally need the same denormalized
// snippet shape right now. Coupling them via a shared type would make an
// unrelated future change to one silently ripple into the other.
export interface WishlistItem {
  handle: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  minPrice: { amount: string; currencyCode: string };
}

export interface WishlistStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface WishlistSessionStorage extends WishlistStorage {
  readonly persistenceError: boolean;
  refresh(): void;
}

/** Keeps this tab's changes usable when browser storage is blocked or full. */
export function createWishlistSessionStorage(
  getStorage: () => WishlistStorage,
): WishlistSessionStorage {
  const memory = new Map<string, string | null>();
  let pendingWrite = false;
  let persistenceError = false;

  return {
    get persistenceError() {
      return persistenceError;
    },
    getItem(key) {
      if (pendingWrite) return memory.get(key) ?? null;
      try {
        const value = getStorage().getItem(key);
        memory.set(key, value);
        persistenceError = false;
        return value;
      } catch {
        persistenceError = true;
        return memory.get(key) ?? null;
      }
    },
    setItem(key, value) {
      memory.set(key, value);
      try {
        getStorage().setItem(key, value);
        pendingWrite = false;
        persistenceError = false;
      } catch {
        pendingWrite = true;
        persistenceError = true;
      }
    },
    refresh() {
      // Another tab cannot overwrite changes this tab could not persist.
      if (!pendingWrite) memory.clear();
    },
  };
}

export const WISHLIST_STORAGE_KEY = 'esque:wishlist';
const SCHEMA_VERSION = 1;

interface StoredShape {
  v: number;
  items: unknown[];
}

function isWishlistItem(value: unknown): value is WishlistItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<WishlistItem>;
  return (
    typeof item.handle === 'string' &&
    /^[\p{L}\p{N}][\p{L}\p{N}-]*$/u.test(item.handle) &&
    typeof item.title === 'string' &&
    item.title.trim().length > 0 &&
    (item.imageUrl === null || typeof item.imageUrl === 'string') &&
    (item.imageAlt === null || typeof item.imageAlt === 'string') &&
    typeof item.minPrice === 'object' &&
    item.minPrice !== null &&
    typeof item.minPrice.amount === 'string' &&
    /^\d+(?:\.\d+)?$/.test(item.minPrice.amount) &&
    Number.isFinite(Number(item.minPrice.amount)) &&
    typeof item.minPrice.currencyCode === 'string' &&
    /^[A-Z]{3}$/.test(item.minPrice.currencyCode)
  );
}

function safeImageUrl(value: string | null): string | null {
  if (value === null) return null;
  if (/^\/preview-demo\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(value)) return value;
  try {
    const url = new URL(value);
    // Keep cached images within next.config.ts's image allowlist.
    return url.protocol === 'https:' && url.hostname === 'cdn.shopify.com' && !url.port
      ? value
      : null;
  } catch {
    return null;
  }
}

function isStoredShape(value: unknown): value is StoredShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { v?: unknown }).v === SCHEMA_VERSION &&
    Array.isArray((value as { items?: unknown }).items)
  );
}

/** Never throws — corrupt data, a wrong schema version, or a blocked store are all treated as "nothing saved yet." */
export function readWishlist(storage: WishlistStorage): WishlistItem[] {
  try {
    const raw = storage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredShape(parsed)) return [];
    const handles = new Set<string>();
    const items: WishlistItem[] = [];
    for (const item of parsed.items) {
      if (!isWishlistItem(item) || handles.has(item.handle)) continue;
      handles.add(item.handle);
      items.push({ ...item, imageUrl: safeImageUrl(item.imageUrl) });
    }
    return items;
  } catch {
    return [];
  }
}

export function isInWishlist(storage: WishlistStorage, handle: string): boolean {
  return readWishlist(storage).some((item) => item.handle === handle);
}

/**
 * Prepends `item` (newest-first, matching recordRecentlyViewed's prepend
 * convention) and persists. Dedupes by handle: if `item.handle` is already
 * present, the existing list is returned UNCHANGED — no reorder, a true
 * no-op. A toggle (WishlistToggle) only ever calls this when the item isn't
 * already saved, so this branch is defensive, not a normal path.
 *
 * Deliberately uncapped — unlike recordRecentlyViewed's `max` parameter, no
 * cap exists here at all, and none is planned: a wishlist represents
 * deliberate, individually-chosen customer intent (PROJECT.md §57), not a
 * recency-bounded "last N viewed" list. Silently dropping an earlier save
 * the moment a new one is added would be real data loss and a trust
 * problem a "recently viewed" list simply doesn't have — the customer
 * chose to save that item and would have no way to know it was evicted.
 * No cap is named anywhere in PROJECT.md/DESIGN_SYSTEM.md/CONTENT.md for
 * this feature either.
 *
 * A failed write (quota exceeded, private browsing) never throws — the
 * returned in-memory list is still correct for the current render even if
 * it can't be saved for next time (same swallowing precedent as
 * recordRecentlyViewed, DECISIONS.md D-031).
 */
export function addToWishlist(storage: WishlistStorage, item: WishlistItem): WishlistItem[] {
  const existing = readWishlist(storage);
  if (existing.some((existingItem) => existingItem.handle === item.handle)) {
    return existing;
  }
  const next = [item, ...existing];
  try {
    const shape: StoredShape = { v: SCHEMA_VERSION, items: next };
    storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(shape));
  } catch {
    // Storage full or unavailable — see doc comment above.
  }
  return next;
}

/**
 * Filters `handle` out and persists. A no-op (returns a same-content list)
 * if the handle wasn't present. Same never-throws-on-a-failed-write
 * discipline as addToWishlist above.
 */
export function removeFromWishlist(storage: WishlistStorage, handle: string): WishlistItem[] {
  const next = readWishlist(storage).filter((item) => item.handle !== handle);
  try {
    const shape: StoredShape = { v: SCHEMA_VERSION, items: next };
    storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(shape));
  } catch {
    // Storage full or unavailable — see doc comment above.
  }
  return next;
}

/**
 * Maps a live ProductDetail (the shape GET /api/products/[handle] returns)
 * to the ProductListItem shape ProductCard renders. This is the one,
 * single-source conversion point: the /wishlist page live-refetches each
 * saved product by handle to show current availability, but needs
 * ProductListItem shape to reuse ProductCard rather than a bespoke
 * wishlist-only card.
 */
export function toProductListItem(detail: ProductDetail): ProductListItem {
  return {
    id: detail.id,
    handle: detail.handle,
    title: detail.title,
    productType: detail.productType,
    tags: detail.tags,
    minPrice: detail.minPrice,
    availableForSale: !isProductSoldOut(detail.variants),
    images: detail.images,
  };
}

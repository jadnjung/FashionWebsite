// Client-only, localStorage-backed "recently viewed" list — no Shopify
// dependency at all (DECISIONS.md D-031). Denormalized snippets are
// stored directly (handle/title/image/price) rather than re-fetching full
// product data at render time. RecentlyViewedStorage is a minimal
// structural type (not DOM lib's full Storage) so this stays trivially
// fakeable in tests without jsdom.

export interface RecentlyViewedItem {
  handle: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  minPrice: { amount: string; currencyCode: string };
}

export interface RecentlyViewedStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'esque:recently-viewed';
const SCHEMA_VERSION = 1;
const DEFAULT_MAX = 8;

interface StoredShape {
  v: number;
  items: unknown[];
}

/** Acquires storage inside the guarded boundary and retains unsaved changes in this tab. */
export function createRecentlyViewedSessionStorage(
  getStorage: () => RecentlyViewedStorage,
): RecentlyViewedStorage {
  let memory: string | null = null;
  let unsaved = false;
  return {
    getItem(key) {
      if (unsaved) return memory;
      try {
        memory = getStorage().getItem(key);
      } catch {
        // Keep the last readable snapshot when storage becomes unavailable.
      }
      return memory;
    },
    setItem(key, value) {
      memory = value;
      try {
        getStorage().setItem(key, value);
        unsaved = false;
      } catch {
        unsaved = true;
      }
    },
  };
}

function isRecentlyViewedItem(value: unknown): value is RecentlyViewedItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<RecentlyViewedItem>;
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
    return url.protocol === 'https:' &&
      url.hostname === 'cdn.shopify.com' &&
      !url.port &&
      !url.username &&
      !url.password
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
export function readRecentlyViewed(storage: RecentlyViewedStorage): RecentlyViewedItem[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredShape(parsed)) return [];
    const handles = new Set<string>();
    const items: RecentlyViewedItem[] = [];
    for (const item of parsed.items) {
      if (!isRecentlyViewedItem(item) || handles.has(item.handle)) continue;
      handles.add(item.handle);
      items.push({ ...item, imageUrl: safeImageUrl(item.imageUrl) });
      if (items.length === DEFAULT_MAX) break;
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Dedupes by handle (moving a re-viewed item to the front rather than
 * duplicating it), caps at `max`, and persists. A failed write (quota
 * exceeded, private browsing) never throws — the returned in-memory list
 * is still correct for the current render even if it can't be saved for
 * next time.
 */
export function recordRecentlyViewed(
  storage: RecentlyViewedStorage,
  item: RecentlyViewedItem,
  max: number = DEFAULT_MAX,
): RecentlyViewedItem[] {
  if (!isRecentlyViewedItem(item)) return readRecentlyViewed(storage);
  const existing = readRecentlyViewed(storage).filter(
    (existing) => existing.handle !== item.handle,
  );
  const limit = Number.isInteger(max) && max > 0 ? Math.min(max, DEFAULT_MAX) : DEFAULT_MAX;
  const next = [{ ...item, imageUrl: safeImageUrl(item.imageUrl) }, ...existing].slice(0, limit);
  try {
    const shape: StoredShape = { v: SCHEMA_VERSION, items: next };
    storage.setItem(STORAGE_KEY, JSON.stringify(shape));
  } catch {
    // Storage full or unavailable — see doc comment above.
  }
  return next;
}

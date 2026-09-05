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
  items: RecentlyViewedItem[];
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
    return isStoredShape(parsed) ? parsed.items : [];
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
  const existing = readRecentlyViewed(storage).filter(
    (existing) => existing.handle !== item.handle,
  );
  const next = [item, ...existing].slice(0, max);
  try {
    const shape: StoredShape = { v: SCHEMA_VERSION, items: next };
    storage.setItem(STORAGE_KEY, JSON.stringify(shape));
  } catch {
    // Storage full or unavailable — see doc comment above.
  }
  return next;
}

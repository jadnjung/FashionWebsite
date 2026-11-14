'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  addToWishlist,
  createWishlistSessionStorage,
  readWishlist,
  removeFromWishlist,
  WISHLIST_STORAGE_KEY,
  type WishlistItem,
} from '@/lib/product/wishlist';

const WISHLIST_CHANGE_EVENT = 'esque:wishlist-change';
const storage = createWishlistSessionStorage(() => window.localStorage);

interface WishlistSnapshot {
  items: WishlistItem[];
  ready: boolean;
  persistenceError: boolean;
}

// Stable server snapshot keeps hydration deterministic while personal data loads.
const SERVER_SNAPSHOT: WishlistSnapshot = {
  items: [],
  ready: false,
  persistenceError: false,
};
let cachedSnapshot = SERVER_SNAPSHOT;
let cachedSnapshotJson = '';

function getSnapshot(): WishlistSnapshot {
  const items = readWishlist(storage);
  const next = { items, ready: true, persistenceError: storage.persistenceError };
  const nextJson = JSON.stringify(next);
  if (nextJson !== cachedSnapshotJson) {
    cachedSnapshot = next;
    cachedSnapshotJson = nextJson;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): WishlistSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(onStoreChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== WISHLIST_STORAGE_KEY) return;
    storage.refresh();
    onStoreChange();
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener(WISHLIST_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(WISHLIST_CHANGE_EVENT, onStoreChange);
  };
}

interface UseWishlistResult extends WishlistSnapshot {
  isWishlisted: (handle: string) => boolean;
  add: (item: WishlistItem) => void;
  remove: (handle: string) => void;
}

export function useWishlist(): UseWishlistResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isWishlisted = useCallback(
    (handle: string) => snapshot.items.some((item) => item.handle === handle),
    [snapshot.items],
  );

  const add = useCallback((item: WishlistItem) => {
    addToWishlist(storage, item);
    window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
  }, []);

  const remove = useCallback((handle: string) => {
    removeFromWishlist(storage, handle);
    window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
  }, []);

  return { ...snapshot, isWishlisted, add, remove };
}

'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  addToWishlist,
  readWishlist,
  removeFromWishlist,
  type WishlistItem,
} from '@/lib/product/wishlist';

// DECISIONS.md D-031 — client-only, localStorage-backed, no Shopify
// dependency. localStorage is an external mutable store React doesn't own,
// so the list itself is read via useSyncExternalStore, exactly like
// RecentlyViewed.tsx's own established recipe.
//
// Unlike RecentlyViewed (which embeds this wiring directly because it has
// exactly one consumer), this is a shared hook: WishlistToggle and the
// /wishlist page (WishlistView) are two real, concurrent consumers today.
const STORAGE_EVENT = 'storage';

// RecentlyViewed never needs same-tab reactivity to its own writes — it
// only ever displays *other* products, filtering the one it just recorded
// out of its own render. A wishlist toggle is different: clicking it must
// flip its own visual state immediately, in the SAME tab. The native
// 'storage' event never fires in the tab that made the write (Web Storage
// API spec — see RecentlyViewed.tsx's own comment) — relying on it alone
// would mean a toggle silently never updates itself on click. This custom
// event is dispatched by add/remove below, immediately after writing, so
// every mounted useWishlist() instance (including the one that just wrote)
// re-runs getSnapshot and re-renders with the fresh, correct data.
const WISHLIST_CHANGE_EVENT = 'esque:wishlist-change';

// Cached by content, not just re-computed on every call — see
// RecentlyViewed.tsx's identical comment: useSyncExternalStore calls
// getSnapshot on every render to check for tearing, and returning a
// freshly-parsed array/object graph each time (even when the underlying
// storage value hasn't changed) would look like a perpetually-changing
// snapshot and risk a render loop. Comparing the raw JSON keeps the
// returned reference stable when nothing has actually changed.
let cachedSnapshot: WishlistItem[] = [];
let cachedSnapshotJson = '';

function getSnapshot(): WishlistItem[] {
  const next = readWishlist(window.localStorage);
  const nextJson = JSON.stringify(next);
  if (nextJson !== cachedSnapshotJson) {
    cachedSnapshot = next;
    cachedSnapshotJson = nextJson;
  }
  return cachedSnapshot;
}

// A module-level singleton, not a fresh `[]` literal per call — DECISIONS.md
// D-051, applied here from the start rather than reintroducing the bug it
// found and fixed. useSyncExternalStore requires getServerSnapshot's result
// to be referentially stable across calls: a new array reference every
// render looks like a perpetually-changing snapshot to React, which logs
// "The result of getServerSnapshot should be cached to avoid an infinite
// loop."
const EMPTY_WISHLIST: WishlistItem[] = [];

function getServerSnapshot(): WishlistItem[] {
  return EMPTY_WISHLIST;
}

// Listens for both the native 'storage' event (cross-tab — another tab
// changed the wishlist) and the custom WISHLIST_CHANGE_EVENT (same-tab —
// see the comment above), cleaning up both on unmount. Mirrors
// RecentlyViewed.tsx's subscribe shape, with two listeners instead of one.
function subscribe(onStoreChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  window.addEventListener(WISHLIST_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
    window.removeEventListener(WISHLIST_CHANGE_EVENT, onStoreChange);
  };
}

interface UseWishlistResult {
  items: WishlistItem[];
  isWishlisted: (handle: string) => boolean;
  add: (item: WishlistItem) => void;
  remove: (handle: string) => void;
}

export function useWishlist(): UseWishlistResult {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isWishlisted = useCallback(
    (handle: string) => items.some((item) => item.handle === handle),
    [items],
  );

  // window.localStorage is hardcoded, exactly like RecentlyViewed.tsx does
  // — the injected-WishlistStorage-interface abstraction in
  // lib/product/wishlist.ts exists only for that file's own
  // unit-testability; real component code always uses the real store.
  const add = useCallback((item: WishlistItem) => {
    addToWishlist(window.localStorage, item);
    window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
  }, []);

  const remove = useCallback((handle: string) => {
    removeFromWishlist(window.localStorage, handle);
    window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
  }, []);

  return { items, isWishlisted, add, remove };
}

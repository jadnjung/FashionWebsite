'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';
import {
  readRecentlyViewed,
  recordRecentlyViewed,
  type RecentlyViewedItem,
} from '@/lib/product/recently-viewed';

interface RecentlyViewedProps {
  handle: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  priceAmount: string;
  priceCurrency: string;
}

function formatPrice(price: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode,
  }).format(Number(price.amount));
}

// DECISIONS.md D-031 — client-only, localStorage-backed, no Shopify
// dependency. localStorage is an external mutable store React doesn't own,
// so the list itself is read via useSyncExternalStore (React's documented
// mechanism for this — see react-hooks/set-state-in-effect, which forbids
// calling setState synchronously in an effect body and points here
// instead: https://react.dev/reference/react/useSyncExternalStore). The
// getServerSnapshot below returns [] so server render and the first client
// render agree (no hydration mismatch); React re-reads getSnapshot right
// after hydrating and re-renders if the real client value differs.
// Recording "this product was viewed" stays a plain effect: it only writes
// to the external store, it never calls a state setter itself.
const STORAGE_EVENT = 'storage';

// Cached by content, not just re-computed on every call: useSyncExternalStore
// calls getSnapshot on every render to check for tearing, and returning a
// freshly-parsed array/object graph each time (even when the underlying
// storage value hasn't changed) would look like a perpetually-changing
// snapshot and risk a render loop. Comparing the raw JSON keeps the
// returned reference stable when nothing has actually changed.
let cachedSnapshot: RecentlyViewedItem[] = [];
let cachedSnapshotJson = '';

function getSnapshot(): RecentlyViewedItem[] {
  const next = readRecentlyViewed(window.localStorage);
  const nextJson = JSON.stringify(next);
  if (nextJson !== cachedSnapshotJson) {
    cachedSnapshot = next;
    cachedSnapshotJson = nextJson;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): RecentlyViewedItem[] {
  return [];
}

// Only fires for changes made in *other* tabs (the native 'storage' event
// never fires in the tab that made the write) — same-tab writes don't need
// a subscription push here because this component only ever displays
// *other* products, never the one it just recorded (filtered out below).
function subscribe(onStoreChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  return () => window.removeEventListener(STORAGE_EVENT, onStoreChange);
}

// Renders nothing before hydration reconciles the real client snapshot,
// and nothing at all if the list ends up empty (no CONTENT.md copy exists
// for this empty case, so none is invented).
export function RecentlyViewed({
  handle,
  title,
  imageUrl,
  imageAlt,
  priceAmount,
  priceCurrency,
}: RecentlyViewedProps) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    recordRecentlyViewed(window.localStorage, {
      handle,
      title,
      imageUrl,
      imageAlt,
      minPrice: { amount: priceAmount, currencyCode: priceCurrency },
    });
  }, [handle, title, imageUrl, imageAlt, priceAmount, priceCurrency]);

  const otherItems = items.filter((item) => item.handle !== handle);
  if (otherItems.length === 0) return null;

  return (
    <section aria-label="Recently Viewed" className="flex flex-col gap-4">
      <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        Recently Viewed
      </h2>
      <div className="flex gap-4 overflow-x-auto">
        {otherItems.map((item) => (
          <Link
            key={item.handle}
            href={`/products/${item.handle}`}
            className="flex w-40 shrink-0 flex-col gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt ?? item.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              )}
            </div>
            <p className="text-product-name text-esque-text">{item.title}</p>
            <p className="text-utility text-esque-text-secondary">{formatPrice(item.minPrice)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

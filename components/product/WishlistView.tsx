'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ProductCard } from '@/components/catalog/ProductCard';
import { useWishlist } from '@/components/product/use-wishlist';
import { Button } from '@/components/ui/Button';
import { toProductListItem, type WishlistItem } from '@/lib/product/wishlist';
import type { ProductDetail, ProductListItem } from '@/lib/shopify/products';

function syntheticListItem(item: WishlistItem): ProductListItem {
  return {
    id: item.handle,
    handle: item.handle,
    title: item.title,
    productType: '',
    tags: [],
    minPrice: item.minPrice,
    // Unknown inventory stays neutral. Confirmed missing products get their own label.
    availableForSale: true,
    images: item.imageUrl
      ? [{ url: item.imageUrl, altText: item.imageAlt, width: null, height: null }]
      : [],
  };
}

// The route remains a Server Component. Only this personal, browser-owned list hydrates.
export function WishlistView() {
  const { items, ready, persistenceError, remove } = useWishlist();
  const [liveResults, setLiveResults] = useState<Record<string, ProductDetail | null>>({});
  const [failedHandles, setFailedHandles] = useState(() => new Set<string>());
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const discoveryLink = useRef<HTMLAnchorElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  const retryFocusRequested = useRef(false);
  const refreshFailed = items.some((item) => failedHandles.has(item.handle));

  useEffect(() => {
    if (items.length === 0) return;
    const controller = new AbortController();

    // A failed availability refresh preserves the saved snapshot for that product.
    Promise.all(
      items.map((item) =>
        fetch(`/api/products/${encodeURIComponent(item.handle)}`, { signal: controller.signal })
          .then((res) => {
            if (!res.ok) throw new Error('wishlist product fetch failed');
            return res.json() as Promise<{ product: ProductDetail | null }>;
          })
          .then(({ product }) => [item.handle, product] as const)
          .catch(() => null),
      ),
    ).then((results) => {
      if (controller.signal.aborted) return;
      const next: Record<string, ProductDetail | null> = {};
      const failures = new Set<string>();
      for (const [index, result] of results.entries()) {
        if (result) next[result[0]] = result[1];
        else failures.add(items[index].handle);
      }
      const restoreRetryFocus =
        retryFocusRequested.current &&
        (document.activeElement === retryButton.current ||
          document.activeElement === document.body);
      retryFocusRequested.current = false;
      setLiveResults(next);
      setFailedHandles(failures);
      setRetrying(false);
      if (restoreRetryFocus) {
        requestAnimationFrame(() => {
          const target =
            failures.size === 0 ? removeButtons.current.get(items[0].handle) : retryButton.current;
          target?.focus();
        });
      }
    });

    return () => controller.abort();
  }, [items, refreshAttempt]);

  function removeItem(item: WishlistItem, index: number) {
    const nextHandle = items[index + 1]?.handle ?? items[index - 1]?.handle;
    remove(item.handle);
    setAnnouncement(`${item.title} removed from wishlist.`);
    // Focus after React removes the card, including the final-item empty state.
    requestAnimationFrame(() => {
      const target = nextHandle ? removeButtons.current.get(nextHandle) : discoveryLink.current;
      target?.focus();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {persistenceError && (
        <p role="status" className="text-body-sm text-esque-text-secondary">
          Browser storage is unavailable. Changes are kept for this visit and may be lost when you
          leave.
        </p>
      )}
      {items.length > 0 && (refreshFailed || retrying) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p role="status" className="text-body-sm text-esque-text-secondary">
            {retrying ? 'Refreshing availability…' : 'Availability could not be refreshed.'}
          </p>
          <Button
            ref={retryButton}
            variant="editorial"
            className="min-h-11 text-body-sm"
            aria-label="Retry availability"
            disabled={retrying}
            onClick={(event) => {
              event.currentTarget.focus();
              retryFocusRequested.current = true;
              setRetrying(true);
              setRefreshAttempt((attempt) => attempt + 1);
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {!ready ? (
        <p role="status" className="text-body-sm text-esque-text-secondary">
          Loading saved pieces…
        </p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-start gap-6">
          <p className="font-display text-heading-3 uppercase tracking-display text-esque-text">
            NOTHING SAVED YET.
          </p>
          <Link
            ref={discoveryLink}
            href="/new"
            className="inline-flex min-h-11 items-center text-body-sm text-esque-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            Explore New
          </Link>
        </div>
      ) : (
        <ul
          aria-label="Saved pieces"
          className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8"
        >
          {items.map((item, index) => {
            const liveResult = Object.prototype.hasOwnProperty.call(liveResults, item.handle)
              ? liveResults[item.handle]
              : undefined;
            const product = liveResult ? toProductListItem(liveResult) : syntheticListItem(item);

            return (
              <li
                key={item.handle}
                className="col-span-2 flex min-w-0 flex-col gap-3 md:col-span-2 lg:col-span-3"
              >
                <ProductCard
                  product={product}
                  layout="standard"
                  sizes="(min-width: 1152px) 256px, (min-width: 768px) 25vw, 50vw"
                  priority={index === 0}
                />
                {liveResult === null && (
                  <p className="text-body-sm text-esque-text-secondary">No longer available.</p>
                )}
                <Button
                  ref={(element) => {
                    if (element) removeButtons.current.set(item.handle, element);
                    else removeButtons.current.delete(item.handle);
                  }}
                  variant="editorial"
                  aria-label={`Remove ${item.title} from wishlist`}
                  className="min-h-11 self-start text-body-sm"
                  onClick={() => removeItem(item, index)}
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

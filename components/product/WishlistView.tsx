'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/catalog/ProductCard';
import { useWishlist } from '@/components/product/use-wishlist';
import { WishlistToggle } from '@/components/product/WishlistToggle';
import { toProductListItem, type WishlistItem } from '@/lib/product/wishlist';
import type { ProductDetail, ProductListItem } from '@/lib/shopify/products';

/**
 * Builds the ProductListItem shown for a saved item when live data isn't
 * available — either because the product is confirmed gone
 * (`availableForSale: false`, reusing ProductCard's existing SOLD OUT
 * badge treatment) or because its fetch is still in flight/failed
 * (`availableForSale: true`, deliberately neutral — absence of live
 * information must never render as a negative claim any more than a false
 * claim of certainty). A synthetic ProductListItem built purely from the
 * cached WishlistItem snapshot, same shape RecentlyViewed.tsx has always
 * shown with no live check at all.
 */
function syntheticListItem(item: WishlistItem, availableForSale: boolean): ProductListItem {
  return {
    id: item.handle,
    handle: item.handle,
    title: item.title,
    productType: '',
    tags: [],
    minPrice: item.minPrice,
    availableForSale,
    images: item.imageUrl
      ? [{ url: item.imageUrl, altText: item.imageAlt, width: null, height: null }]
      : [],
  };
}

// The client-rendered body of /wishlist (app/(storefront)/wishlist/page.tsx
// stays a Server Component shell around this).
export function WishlistView() {
  const { items } = useWishlist();
  const [liveResults, setLiveResults] = useState<Record<string, ProductDetail | null>>({});

  // Live sold-out enhancement: refetches each saved product's current
  // availability so a product that has sold out since being saved shows a
  // real SOLD OUT badge here, rather than just the cached snapshot forever.
  // Mirrors QuickAddPanel.tsx's exact fetch/AbortController/cleanup shape —
  // one shared AbortController, aborted in this effect's own cleanup.
  //
  // Each item's fetch swallows its own rejection (`.catch(() => null)`) so
  // one failing/erroring item's promise never rejects Promise.all and
  // blocks every other item's result from being recorded. This includes
  // this dev/CI environment's unconfigured Shopify, which makes getProduct
  // throw rather than return null when PREVIEW_DEMO_MODE isn't set (see
  // lib/shopify/products.ts's own comments on getStorefrontClient's
  // throw-when-unconfigured behavior) — that degrades gracefully to
  // exactly what RecentlyViewed.tsx already does permanently (show the
  // cached snapshot, no live check). This is a background enhancement
  // layer, not a critical data need, so no per-row error message is shown.
  useEffect(() => {
    if (items.length === 0) return;

    const controller = new AbortController();

    Promise.all(
      items.map((item) =>
        fetch(`/api/products/${item.handle}`, { signal: controller.signal })
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
      for (const result of results) {
        if (result) next[result[0]] = result[1];
      }
      setLiveResults(next);
    });

    return () => controller.abort();
  }, [items]);

  // CONTENT.md §7's exact empty-state copy — no additional copy or CTA is
  // invented beyond what's specified there.
  if (items.length === 0) {
    return (
      <p className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        NOTHING SAVED YET.
      </p>
    );
  }

  return (
    // DESIGN_SYSTEM.md §15's sitewide 4/8/12-column grid foundation as the
    // container, but a plain, UNIFORM span for every cell — deliberately
    // NOT the catalog's featured/standard editorial alternation
    // (lib/catalog/grid-layout.ts's getGridItemLayout). That varied rhythm
    // (DESIGN_SYSTEM.md §36-38) is specifically about *discovery* browsing
    // across a drop; a wishlist is a personal, already-decided list where
    // every saved item carries equal weight — there is no "featured" item
    // concept here. ProductCard and ProductGrid are composed from the
    // outside (never modified) since this is the only caller that needs
    // this shape.
    <div className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8">
      {items.map((item) => {
        const hasLiveResult = Object.prototype.hasOwnProperty.call(liveResults, item.handle);
        const liveResult = liveResults[item.handle];
        const product = !hasLiveResult
          ? syntheticListItem(item, true)
          : liveResult === null
            ? syntheticListItem(item, false)
            : toProductListItem(liveResult);

        return (
          <div
            key={item.handle}
            className="col-span-2 flex flex-col gap-3 md:col-span-2 lg:col-span-3"
          >
            <ProductCard product={product} layout="standard" />
            <WishlistToggle item={item} />
          </div>
        );
      })}
    </div>
  );
}

'use client';

import type { SVGProps } from 'react';
import { Button } from '@/components/ui/Button';
import { useWishlist } from '@/components/product/use-wishlist';
import { trackEvent } from '@/lib/analytics/gtag';
import type { WishlistItem } from '@/lib/product/wishlist';

interface WishlistToggleProps {
  item: WishlistItem;
}

// A single WishlistItem object prop, deliberately different from
// RecentlyViewed.tsx's all-primitive-props convention: RecentlyViewed's
// primitive props exist specifically so its *recording effect's*
// dependency array can be exhaustive with no eslint-disable (DECISIONS.md
// D-031). WishlistToggle has no effect at all — it only acts inside a
// click handler, so there is no dependency-array concern to satisfy — and
// both real call sites (ProductPurchasePanel, WishlistView) already have a
// complete WishlistItem object on hand, so a single prop avoids pointless
// prop-spreading.

// Hand-authored inline heart SVG, matching Header.tsx's SearchIcon/
// AccountIcon structural convention exactly (viewBox 0 0 20 20, thin
// single-weight stroke, aria-hidden). Two states: not-saved renders outline
// only; saved renders filled. Both states inherit currentColor/
// --color-esque-text — never --color-esque-forest: forest (#1F3D2B)
// measures ~1.71:1 against --color-esque-black/--color-esque-surface,
// below WCAG 1.4.11's 3:1 minimum for UI-component/state indicators — the
// exact failure DECISIONS.md D-010 already found and fixed for focus rings
// on these same backgrounds. Using it as the *sole* differentiator between
// a heart's saved/unsaved fill would reintroduce that class of defect in a
// new location. An outline-vs-filled shape difference (not just a color
// difference) is fully accessible per WCAG 1.4.1 and consistent with
// D-010's ruling.
function HeartIcon({ filled, ...props }: SVGProps<SVGSVGElement> & { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M10 17.25s-6.5-4.06-8.5-8.03C.4 6.86 1.6 4 4.5 4c1.7 0 2.9.98 3.5 2.02C8.6 4.98 9.8 4 11.5 4c2.9 0 4.1 2.86 3 5.22-2 3.97-8.5 8.03-8.5 8.03z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// DESIGN_SYSTEM.md §42 — PDP right panel includes "wishlist" as a real
// control, independent of Add to Bag. Renders Button's `secondary` variant
// (§17: transparent, thin border — a secondary action relative to Add to
// Bag's primary).
//
// The visible button text (ADD TO WISHLIST / REMOVE FROM WISHLIST) IS the
// accessible name — no separate aria-label needed, since the text is
// already complete and unambiguous (unlike D-037's Shop-the-Look checkbox
// case, where the wrapping label's computed name was too long/different
// from what was needed).
//
// No extra aria-live region for this control, considered and excluded: a
// toggle button whose own accessible name changes on activation, combined
// with aria-pressed, is exactly WAI-ARIA APG's documented Toggle Button
// pattern — the state change is on the very element that has focus, and is
// reliably announced by assistive tech without a supplementary live
// region. This differs from D-049's Interactive Model case, which involved
// a DIFFERENT DOM subtree, away from the focused control, needing to be
// announced — not the case here.
export function WishlistToggle({ item }: WishlistToggleProps) {
  const { isWishlisted, add, remove } = useWishlist();
  const saved = isWishlisted(item.handle);

  return (
    <Button
      type="button"
      variant="secondary"
      aria-pressed={saved}
      className="inline-flex w-fit items-center gap-2"
      onClick={() => {
        if (saved) {
          remove(item.handle);
          return;
        }
        add(item);
        // Product Behavior: "Wishlist adds" (PROJECT.md §82). GA4's own
        // standard recommended event — an honest match (DECISIONS.md
        // D-055's own test): a real, persisted local save genuinely
        // happens here, unlike add_to_bag_click's deliberate avoidance of
        // GA4's standard add_to_cart name (no real cart exists). Fired
        // only on the add branch — see the "no remove event" note in
        // lib/analytics/events.ts.
        trackEvent('add_to_wishlist', {
          currency: item.minPrice.currencyCode,
          value: Number(item.minPrice.amount),
          items: [
            { item_id: item.handle, item_name: item.title, price: Number(item.minPrice.amount) },
          ],
        });
      }}
    >
      <HeartIcon filled={saved} className="h-4 w-4" />
      {saved ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
    </Button>
  );
}

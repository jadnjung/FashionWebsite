'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SizeGuidePanel } from '@/components/product/SizeGuidePanel';
import { VariantPicker } from '@/components/product/VariantPicker';
import { WishlistToggle } from '@/components/product/WishlistToggle';
import { trackEvent } from '@/lib/analytics/gtag';
import { formatPrice } from '@/lib/product/price';
import { resolveQuantity } from '@/lib/product/quantity';
import { getScarcityLabel, getScarcityStatus } from '@/lib/product/scarcity';
import {
  findMatchingVariant,
  getInitialSelections,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';
import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

interface ProductPurchasePanelProps {
  title: string;
  // Used only to build VariantPicker's namePrefix (`pdp-${handle}`) — see
  // DECISIONS.md D-036. Not rendered.
  handle: string;
  minPrice: { amount: string; currencyCode: string };
  // Not rendered — only used as the view_item/add_to_bag_click events'
  // item_category (DECISIONS.md D-055). ProductDetail.tsx already has this
  // from the same getProduct() fetch (used for its own "More {productType}"
  // heading); threaded through rather than re-derived.
  productType: string;
  options: ProductOption[];
  variants: ProductVariant[];
  // Threaded through for WishlistToggle's WishlistItem snapshot — nullable,
  // not optional, matching RecentlyViewed's identical prop type shape for
  // the same data (ProductDetail.tsx's own image[0] lookup).
  imageUrl: string | null;
  imageAlt: string | null;
  // Server-rendered, static description — passed as children (composition,
  // not a string prop) so it stays zero-JS even though it renders inside
  // this client boundary. See the design spec's Component breakdown.
  children?: ReactNode;
}

// DESIGN_SYSTEM.md §42-45 — the sticky right column: name, price (reflects
// the matched variant once fully selected, otherwise the product's
// minPrice), scarcity, size/color selection, quantity, Add to Bag. See
// DECISIONS.md D-027 (native radio groups, now shared via VariantPicker —
// D-036) and D-029 (Add to Bag is a real, disabled-until-valid button
// whose click handler is a deliberate no-op — no cart exists yet —
// matching Header.tsx's existing SEARCH/ACCOUNT/BAG onClick={() => {}}
// precedent, not a new pattern).
export function ProductPurchasePanel({
  title,
  handle,
  minPrice,
  productType,
  options,
  variants,
  imageUrl,
  imageAlt,
  children,
}: ProductPurchasePanelProps) {
  const [selections, setSelections] = useState<OptionSelections>(() =>
    getInitialSelections(options),
  );
  // Raw string, not a clamped number — see lib/product/quantity.ts's
  // resolveQuantity doc comment. Clamping on every keystroke (the previous
  // behavior) snapped a momentarily-empty controlled input back to "1"
  // before the next keystroke landed, corrupting a clear-then-retype
  // sequence; this field now holds whatever the user is actually typing,
  // including transiently empty, and only resolves to a valid minimum on
  // blur.
  const [quantityInput, setQuantityInput] = useState('1');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const soldOut = isProductSoldOut(variants);
  const matchedVariant = findMatchingVariant(variants, selections);
  const selectionComplete = isSelectionComplete(options, selections);
  const displayPrice = matchedVariant?.price ?? minPrice;
  const scarcityLabel = matchedVariant
    ? getScarcityLabel(
        getScarcityStatus(matchedVariant.quantityAvailable, matchedVariant.availableForSale),
      )
    : null;
  const canAddToBag = !soldOut && matchedVariant !== null && matchedVariant.availableForSale;
  // Real Shopify inventory, when known AND actually a usable upper bound.
  // "No variant matched yet", `quantityAvailable: null` (unknown real-world
  // inventory, DECISIONS.md D-028), and a non-positive quantityAvailable
  // all resolve to `undefined` ("no known bound") rather than clamping the
  // field to 0 or a negative number. The non-positive case matters because
  // `quantityAvailable` and `availableForSale` are independent Shopify
  // signals, not one: a variant with "continue selling when out of stock"
  // enabled can be `availableForSale: true` with `quantityAvailable: 0`,
  // and `canAddToBag` below already treats `availableForSale` — not
  // `quantityAvailable` — as the authoritative purchasability signal.
  // Capping the Quantity field to 0 in that case would contradict the
  // variant's own availableForSale: true and make a genuinely purchasable
  // field unusable. For a matched variant that's actually unavailable
  // (availableForSale: false), Add to Bag is already disabled by
  // canAddToBag regardless of this value, so leaving the field uncapped
  // there is harmless. See lib/product/quantity.ts's doc comment.
  const quantityMax =
    matchedVariant?.quantityAvailable != null && matchedVariant.quantityAvailable > 0
      ? matchedVariant.quantityAvailable
      : undefined;

  // Re-resolves the committed quantity whenever the matched variant's real
  // upper bound changes — e.g. switching from a well-stocked variant to a
  // scarce one without blurring the Quantity field again in between. onBlur
  // alone (below) only catches this the next time that field happens to
  // blur, which may never happen before the shopper proceeds straight to
  // Add to Bag, leaving a stale, over-cap value on display.
  //
  // Deliberately NOT a useEffect: this project's lint config enforces
  // react-hooks' current "adjust state during render, not in an effect"
  // rule (react-hooks/set-state-in-effect) for exactly this "re-derive
  // local state when a dependency changes" shape — calling setState
  // synchronously inside a bare effect causes an extra, avoidable
  // commit/paint before the correction lands. Tracking the previous
  // quantityMax in state and comparing during render is React's own
  // documented alternative for this case ("Adjusting some state when a
  // prop changes"): the conditional setState call below runs during this
  // render, React immediately re-renders with the corrected value before
  // anything is painted, and once prevQuantityMax catches up the
  // condition is false on every subsequent render until quantityMax
  // changes again — it converges, not an infinite loop.
  const [prevQuantityMax, setPrevQuantityMax] = useState(quantityMax);
  if (quantityMax !== prevQuantityMax) {
    setPrevQuantityMax(quantityMax);
    setQuantityInput((prev) => String(resolveQuantity(prev, 1, quantityMax)));
  }

  // Product Behavior: "Product views... sold-out views" (PROJECT.md §82) —
  // DECISIONS.md D-055. Fires once per real PDP mount (dependency array is
  // exhaustive per the effect's own primitive reads, mirroring
  // RecentlyViewed.tsx's D-031 precedent — no eslint-disable needed),
  // deliberately not re-firing on every variant selection (that's
  // variant_selected's job, below). Uses GA4's own standard `view_item`
  // event/shape: a real product page genuinely was viewed, an honest match
  // for GA4's documented semantics (unlike add_to_bag_click below).
  useEffect(() => {
    trackEvent('view_item', {
      currency: minPrice.currencyCode,
      value: Number(minPrice.amount),
      items: [{ item_id: handle, item_name: title, item_category: productType }],
      sold_out: soldOut,
    });
  }, [handle, title, productType, minPrice.amount, minPrice.currencyCode, soldOut]);

  function handleOptionChange(optionName: string, value: string) {
    // Product Behavior: "variant selection" (PROJECT.md §82).
    trackEvent('variant_selected', {
      item_id: handle,
      option_name: optionName,
      option_value: value,
      context: 'pdp',
    });
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  }

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-[88px] lg:self-start">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-heading-1 uppercase tracking-display text-esque-text">
          {title}
        </h1>
        {/* aria-live/aria-atomic — DECISIONS.md D-051, mirroring D-049's
            Interactive Model panel: picking a size/color changes the
            displayed price and scarcity/sold-out badge in place, with
            nothing previously announcing it to a screen-reader user who
            isn't visually watching this text while operating VariantPicker's
            radio groups elsewhere on the page. "polite" (a direct result of
            the user's own action, not urgent) and "atomic" (the price and
            badge should read together as one updated unit, not a partial
            diff). Scoped to just this price/badge text, not the whole
            panel or the Add to Bag button below — a disabled <button> is
            already correctly announced as unavailable by its own native
            semantics when a user reaches it. */}
        <div aria-live="polite" aria-atomic="true" className="flex items-center gap-3">
          <p className="text-body text-esque-text">{formatPrice(displayPrice)}</p>
          {soldOut && (
            <span className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              SOLD OUT
            </span>
          )}
          {!soldOut && scarcityLabel && (
            <span className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              {scarcityLabel}
            </span>
          )}
        </div>
      </div>

      {children}

      {!soldOut && (
        <VariantPicker
          namePrefix={`pdp-${handle}`}
          options={options}
          variants={variants}
          selections={selections}
          onChange={handleOptionChange}
        />
      )}

      {!soldOut && options.length > 0 && (
        // WCAG 2.2 AA (2.5.8): measured at 84.5x19.5px — under the 24px
        // minimum on the vertical axis. `py-2` grows the clickable box
        // (Footer.tsx's established technique) without changing the
        // visible text size. No compensating negative margin: this is a
        // standalone block in the panel's `flex flex-col gap-6` stack,
        // with generous gap-6 (24px) on both sides already — nothing
        // else's footprint depends on this button's exact height.
        <button
          type="button"
          onClick={() => setSizeGuideOpen(true)}
          className="w-fit py-2 text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          Size Guide
        </button>
      )}

      {!soldOut && (
        <Input
          label="Quantity"
          type="number"
          min={1}
          max={quantityMax}
          name="quantity"
          value={quantityInput}
          onChange={(event) => setQuantityInput(event.target.value)}
          onBlur={() => setQuantityInput(String(resolveQuantity(quantityInput, 1, quantityMax)))}
          className="w-24"
        />
      )}

      {soldOut ? (
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          NO LONGER AVAILABLE.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* No cart exists yet (DECISIONS.md D-016/D-029) — adding to a
              bag is still a real, disabled-gated click; onClick's actual
              bag mutation remains a deliberate no-op, matching Header.tsx's
              existing SEARCH/ACCOUNT/BAG precedent. Tracked as
              add_to_bag_click, NOT GA4's standard add_to_cart — see
              DECISIONS.md D-055 for why: firing GA4's own "item was added
              to a cart" semantic event before a cart mechanism exists would
              misrepresent what happened, and would be indistinguishable
              from a genuine future add_to_cart once one does. */}
          <Button
            type="button"
            variant="primary"
            disabled={!canAddToBag}
            onClick={() => {
              if (!matchedVariant) return;
              trackEvent('add_to_bag_click', {
                currency: matchedVariant.price.currencyCode,
                value: Number(matchedVariant.price.amount),
                items: [
                  {
                    item_id: handle,
                    item_name: title,
                    item_category: productType,
                    item_variant: matchedVariant.id,
                    price: Number(matchedVariant.price.amount),
                  },
                ],
              });
            }}
          >
            ADD TO BAG
          </Button>
          {!selectionComplete && (
            // text-esque-text, not -secondary — this is the one message a
            // user needs to read right when the primary CTA next to it is
            // already at disabled:opacity-40 (Button.tsx); two muted
            // elements stacked in the same spot made the one piece of
            // guidance easy to miss, even though -secondary alone already
            // passes WCAG AA contrast (D-048).
            <p className="text-utility text-esque-text">Select all options to continue.</p>
          )}
        </div>
      )}

      {/* Unconditional — renders regardless of soldOut. PROJECT.md §57/§40
          both point toward wishlisting being independent of purchasability:
          a customer should be able to save a sold-out product to revisit
          later, the one real product-facing behavior this pass can offer
          that's adjacent to the deferred back-in-stock feature. Not
          memoized — no downstream effect/memo compares this object by
          reference, only `.handle` is read for a cheap lookup. */}
      <WishlistToggle item={{ handle, title, imageUrl, imageAlt, minPrice }} />

      <SizeGuidePanel open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}

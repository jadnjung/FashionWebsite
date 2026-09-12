'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SizeGuidePanel } from '@/components/product/SizeGuidePanel';
import { VariantPicker } from '@/components/product/VariantPicker';
import { formatPrice } from '@/lib/product/price';
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
  options: ProductOption[];
  variants: ProductVariant[];
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
  options,
  variants,
  children,
}: ProductPurchasePanelProps) {
  const [selections, setSelections] = useState<OptionSelections>(() =>
    getInitialSelections(options),
  );
  const [quantity, setQuantity] = useState(1);
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

  function handleOptionChange(optionName: string, value: string) {
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
        <button
          type="button"
          onClick={() => setSizeGuideOpen(true)}
          className="w-fit text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          Size Guide
        </button>
      )}

      {!soldOut && (
        <Input
          label="Quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          className="w-24"
        />
      )}

      {soldOut ? (
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          NO LONGER AVAILABLE.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* No cart exists yet (DECISIONS.md D-016/D-029). disabled is
              fully real; onClick is a deliberate no-op, matching
              Header.tsx's existing SEARCH/ACCOUNT/BAG precedent. */}
          <Button type="button" variant="primary" disabled={!canAddToBag} onClick={() => {}}>
            ADD TO BAG
          </Button>
          {!selectionComplete && (
            <p className="text-utility text-esque-text-secondary">
              Select all options to continue.
            </p>
          )}
        </div>
      )}

      <SizeGuidePanel open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}

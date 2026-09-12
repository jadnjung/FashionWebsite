'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { VariantPicker } from '@/components/product/VariantPicker';
import { SilhouetteIllustration } from '@/components/interactive-model/SilhouetteIllustration';
import { ShopTheLookPanel } from '@/components/interactive-model/ShopTheLookPanel';
import type { HotspotRegion, InteractiveModelGarment } from '@/lib/interactive-model/look';
import { formatPrice } from '@/lib/product/price';
import { getScarcityLabel, getScarcityStatus } from '@/lib/product/scarcity';
import {
  findMatchingVariant,
  getInitialSelections,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';

interface InteractiveModelExperienceProps {
  garments: InteractiveModelGarment[];
}

function initialSelections(garments: InteractiveModelGarment[]): Record<string, OptionSelections> {
  return Object.fromEntries(
    garments.map((garment) => [garment.region, getInitialSelections(garment.product.options)]),
  );
}

// DESIGN_SYSTEM.md §29-31, PROJECT.md §26-30 — the real Interactive Model:
// silhouette hotspots (Stage 1), a live product info panel (Stage 2), and
// unified hover/focus/tap activation (Stage 3). Masked-luminance motion
// (Stage 4) and visual refinement (Stage 5) are deferred — see the design
// spec's Non-Goals and DECISIONS.md D-034. Rendered only once
// InteractiveModel.tsx has confirmed every hotspot region resolved a real
// product; `garments` is never empty here.
export function InteractiveModelExperience({ garments }: InteractiveModelExperienceProps) {
  const [activeRegion, setActiveRegion] = useState<HotspotRegion | null>(null);
  const [selectionsByRegion, setSelectionsByRegion] = useState(() => initialSelections(garments));
  const [shopTheLookOpen, setShopTheLookOpen] = useState(false);

  const activeGarment = garments.find((garment) => garment.region === activeRegion) ?? null;

  // Mouse hover previews a region (DESIGN_SYSTEM.md §29's "hovering a
  // garment"). Click/Enter/Space/tap ACTIVATE the region instead of
  // navigating — DECISIONS.md D-035, corrected by D-043. Deliberately NOT
  // wired to focus too (DECISIONS.md D-037): both hotspot buttons sit
  // before the shared info panel in DOM order, so if merely focusing a
  // button also previewed it, tabbing from the first hotspot to the second
  // would silently replace the panel before a keyboard user could ever tab
  // forward into the first garment's own VIEW PRODUCT/QUICK ADD/size
  // controls — a real, confirmed keyboard-accessibility failure caught by
  // independent review. Requiring an explicit press (Enter/Space, which
  // fires onClick exactly like a click) means the panel a keyboard user
  // reaches via subsequent Tab presses is always the one they deliberately
  // activated, never whichever hotspot they last happened to tab past.
  // Deliberately no onMouseLeave/onBlur handler either: the panel never
  // auto-closes when the pointer leaves a hotspot, so moving the mouse
  // from the hotspot toward the panel's own controls never races the
  // panel closing before you get there.
  //
  // DECISIONS.md D-043: this was originally a *toggle*
  // (`prev === region ? null : region`), matching D-035's stated "clicking
  // toggles the info panel open/closed." An independent review live-
  // reproduced that this was unreachable as designed for mouse users: a
  // browser always fires `mouseenter` before `click` for any click on an
  // element the pointer wasn't already resting on, so `onHover` has
  // already set `activeRegion` to the clicked region by the time `onClick`
  // runs — `prev === region` is therefore always true at click time, and
  // the toggle could only ever collapse to `null`. A mouse user could
  // never use a click to *open* a panel; every click on every hotspot
  // closed whatever hover had just shown. Unconditionally setting the
  // region (an "activate", not a toggle) fixes this for mouse users
  // (hover already shows the panel; a click on the same, already-hovered
  // region is now a harmless no-op instead of an unwanted close) without
  // regressing keyboard users (Enter/Space on a focused hotspot still
  // opens it, exactly as before — D-037's own keyboard verification did
  // not depend on the toggle-to-null branch at all).
  function handleHover(region: HotspotRegion) {
    setActiveRegion(region);
  }

  function handleActivate(region: HotspotRegion) {
    setActiveRegion(region);
  }

  function handleOptionChange(region: HotspotRegion, optionName: string, value: string) {
    setSelectionsByRegion((prev) => ({
      ...prev,
      [region]: { ...prev[region], [optionName]: value },
    }));
  }

  return (
    <section
      aria-label="Interactive Model"
      className="flex flex-col items-center gap-8 bg-esque-surface px-4 py-16 md:px-8"
    >
      {/* Redundant with the section's own aria-label, matching the
          established ProductDetail/RecentlyViewed pattern of a visible-or-
          sr-only heading alongside a landmark aria-label. */}
      <h2 className="sr-only">Interactive Model</h2>
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">LOOK 01</p>

      <div className="w-full max-w-sm">
        <SilhouetteIllustration
          garments={garments}
          activeRegion={activeRegion}
          onHover={handleHover}
          onActivate={handleActivate}
        />
      </div>

      {/* Fixed min-height so the panel's appearance/disappearance never
          reflows the rest of the page. aria-live/aria-atomic — DECISIONS.md
          D-049: activating a hotspot (Enter/Space/click) swaps this panel's
          entire content elsewhere in the DOM from the hotspot buttons
          themselves; nothing previously announced that change to a
          keyboard/screen-reader user, who would otherwise need to guess a
          panel appeared and tab forward to discover it. "polite" (not
          "assertive") because this is the result of the user's own
          deliberate action, not an urgent/error condition — matches the
          non-disruptive tenor of every other state-change announcement in
          this codebase. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="min-h-[22rem] w-full max-w-2xl border-t border-esque-elevated pt-8"
      >
        {activeGarment ? (
          <ActiveGarmentPanel
            garment={activeGarment}
            selections={selectionsByRegion[activeGarment.region]}
            onOptionChange={(optionName, value) =>
              handleOptionChange(activeGarment.region, optionName, value)
            }
          />
        ) : (
          // text-esque-text-secondary, not text-esque-text-muted — DECISIONS.md
          // D-048: this is real, functional prompt copy (not a placeholder
          // label), and muted fails WCAG AA's 4.5:1 contrast minimum at this
          // normal (13px) size against the surface background.
          <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            Select a garment to view details.
          </p>
        )}
      </div>

      {/* Always visible, not gated behind hotspot interaction — the
          deliberate, real screen-reader/non-visual alternative to the
          silhouette map (DECISIONS.md D-035). */}
      <Button variant="secondary" onClick={() => setShopTheLookOpen(true)}>
        SHOP THE LOOK
      </Button>

      <ShopTheLookPanel
        garments={garments}
        open={shopTheLookOpen}
        onClose={() => setShopTheLookOpen(false)}
      />
    </section>
  );
}

interface ActiveGarmentPanelProps {
  garment: InteractiveModelGarment;
  selections: OptionSelections;
  onOptionChange: (optionName: string, value: string) => void;
}

// Stage 2's product info panel — PROJECT.md §27: name, category, price,
// colors/sizes, VIEW PRODUCT, QUICK ADD. CONTENT.md §10's exact CTA
// vocabulary is used for both actions. QUICK ADD is the terminal add
// action here (not a trigger that opens a further selector) — the variant
// picker is already inline the moment this panel is visible, so there's no
// further "focused selector" left to open (DECISIONS.md D-035). No cart
// exists yet (D-016), so QUICK ADD is a real, disabled-gated button with a
// deliberate no-op onClick, matching D-029.
function ActiveGarmentPanel({ garment, selections, onOptionChange }: ActiveGarmentPanelProps) {
  const { product } = garment;
  const soldOut = isProductSoldOut(product.variants);
  const matchedVariant = findMatchingVariant(product.variants, selections);
  const selectionComplete = isSelectionComplete(product.options, selections);
  const displayPrice = matchedVariant?.price ?? product.minPrice;
  const scarcityLabel = matchedVariant
    ? getScarcityLabel(
        getScarcityStatus(matchedVariant.quantityAvailable, matchedVariant.availableForSale),
      )
    : null;
  const canQuickAdd = !soldOut && matchedVariant !== null && matchedVariant.availableForSale;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-12">
      <div className="flex flex-col gap-2">
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          {garment.regionLabel} — {product.productType}
        </p>
        <h3 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
          {product.title}
        </h3>
        <div className="flex items-center gap-3">
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
        {product.description && (
          <p className="max-w-sm text-body text-esque-text-secondary">{product.description}</p>
        )}
      </div>

      {soldOut ? (
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          NO LONGER AVAILABLE.
        </p>
      ) : (
        <div className="flex flex-col gap-4 md:w-72">
          <VariantPicker
            namePrefix={`preview-${product.handle}`}
            options={product.options}
            variants={product.variants}
            selections={selections}
            onChange={onOptionChange}
          />
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/products/${product.handle}`}
              className="flex items-center text-utility uppercase tracking-nav text-esque-text underline-offset-4 transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
            >
              VIEW PRODUCT
            </Link>
            <Button type="button" variant="primary" disabled={!canQuickAdd} onClick={() => {}}>
              QUICK ADD
            </Button>
          </div>
          {!selectionComplete && (
            <p className="text-utility text-esque-text-secondary">
              Select all options to continue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VariantPicker } from '@/components/product/VariantPicker';
import type { InteractiveModelGarment } from '@/lib/interactive-model/look';
import {
  isLookAddValid,
  type LookItemSelectionState,
} from '@/lib/interactive-model/look-selection';
import { formatPrice } from '@/lib/product/price';
import { findMatchingVariant, getInitialSelections } from '@/lib/product/variants';

interface ShopTheLookPanelProps {
  garments: InteractiveModelGarment[];
  open: boolean;
  onClose: () => void;
}

type LookSelectionMap = Record<string, LookItemSelectionState>;

function initialSelectionMap(garments: InteractiveModelGarment[]): LookSelectionMap {
  return Object.fromEntries(
    garments.map((garment) => [
      garment.region,
      {
        included: true,
        options: garment.product.options,
        selections: getInitialSelections(garment.product.options),
      },
    ]),
  );
}

// DESIGN_SYSTEM.md §31 — "Shop the Look": a floating/side panel listing
// every garment currently on the illustration, each with its own variant
// controls, gated by one final ADD LOOK action. Implemented as a native
// <dialog> — the exact mechanism SizeGuidePanel already established
// (DECISIONS.md D-027): showModal()/close() via a ref + effect, side panel
// at md+ / bottom sheet below it, focus-trap/Escape/backdrop all native, no
// hand-rolled dialog code needed. PROJECT.md §29: "select individual
// pieces... add selected pieces... add the complete outfit" is
// implemented as one mechanism, not two separate flows — a per-item
// checkbox (checked by default = included in the outfit) that the user can
// uncheck to exclude a piece; ADD LOOK adds whichever pieces are currently
// checked. No cart exists yet (DECISIONS.md D-016), so ADD LOOK is a real,
// correctly-disabled-gated button whose onClick is a deliberate no-op,
// matching D-029's established precedent exactly.
export function ShopTheLookPanel({ garments, open, onClose }: ShopTheLookPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectionMap, setSelectionMap] = useState<LookSelectionMap>(() =>
    initialSelectionMap(garments),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleToggleIncluded(region: string) {
    setSelectionMap((prev) => ({
      ...prev,
      [region]: { ...prev[region], included: !prev[region].included },
    }));
  }

  function handleOptionChange(region: string, optionName: string, value: string) {
    setSelectionMap((prev) => ({
      ...prev,
      [region]: {
        ...prev[region],
        selections: { ...prev[region].selections, [optionName]: value },
      },
    }));
  }

  const canAddLook = isLookAddValid(garments.map((garment) => selectionMap[garment.region]));

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Shop the Look"
      className="fixed inset-x-0 bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-full md:w-full md:max-w-md"
    >
      <div className="flex items-center justify-between pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">Shop the Look</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {garments.map((garment, index) => {
          const item = selectionMap[garment.region];
          const matchedVariant = findMatchingVariant(garment.product.variants, item.selections);
          const displayPrice = matchedVariant?.price ?? garment.product.minPrice;
          return (
            <div
              key={garment.region}
              className="flex flex-col gap-3 border-b border-esque-elevated pb-6"
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={() => handleToggleIncluded(garment.region)}
                  className="mt-1 h-4 w-4 accent-esque-forest"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
                    {String(index + 1).padStart(2, '0')} — {garment.regionLabel}
                  </p>
                  <p className="text-product-name text-esque-text">{garment.product.title}</p>
                  <p className="text-body text-esque-text-secondary">{formatPrice(displayPrice)}</p>
                </div>
              </label>
              {item.included && (
                <VariantPicker
                  namePrefix={`look-${garment.product.handle}`}
                  options={garment.product.options}
                  variants={garment.product.variants}
                  selections={item.selections}
                  onChange={(optionName, value) =>
                    handleOptionChange(garment.region, optionName, value)
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-6">
        <Button type="button" variant="primary" disabled={!canAddLook} onClick={() => {}}>
          ADD LOOK
        </Button>
      </div>
    </dialog>
  );
}

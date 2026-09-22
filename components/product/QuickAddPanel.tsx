'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VariantPicker } from '@/components/product/VariantPicker';
import { trackEvent } from '@/lib/analytics/gtag';
import {
  findMatchingVariant,
  getInitialSelections,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';
import type { ProductDetail } from '@/lib/shopify/products';

interface QuickAddPanelProps {
  handle: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'loaded'; product: ProductDetail };

// DESIGN_SYSTEM.md §40-41 — the on-grid Quick Add dialog: fetch-state
// machine, VariantPicker reuse, loading/error/not-found/sold-out
// rendering, the ADD TO BAG button. Reuses SizeGuidePanel's exact native
// <dialog> mechanics (showModal()/close() driven by `open` via useEffect,
// onClose wired to the dialog's native close event) rather than a second
// hand-rolled dialog implementation — see DECISIONS.md D-027/D-060. Unlike
// SizeGuidePanel's right-docked side panel, the desktop treatment here is a
// small, centered, capped-width box (DESIGN_SYSTEM.md §40: "lightweight
// overlay... connected to the product card", deliberately distinct wording
// from §46's "side panel" for Size Guide) — see DECISIONS.md D-060.
export function QuickAddPanel({ handle, title, open, onClose }: QuickAddPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });
  const [selections, setSelections] = useState<OptionSelections>({});
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // A fresh fetch runs every time `open` transitions to true, mirroring
  // SearchOverlay's own established "reopening always starts fresh"
  // precedent (DECISIONS.md D-058) rather than caching across opens. No
  // separate reset-on-close effect: the early `return` below when `!open`
  // is sufficient. The zero-delay `setTimeout` mirrors SearchOverlay's own
  // reason for the identical shape: `react-hooks/set-state-in-effect`
  // flags a setState call made synchronously at the top of an effect body
  // (deriving-then-storing a value on every run) but allows one made from
  // inside a callback the effect subscribes to (a legitimate "synchronize
  // with an external system" case, per the rule's own guidance) — no
  // actual debounce is needed here, since this fires once per discrete
  // "open" action, not per keystroke.
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setFetchState({ status: 'loading' });
      fetch(`/api/products/${handle}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error('quick add fetch failed');
          return res.json() as Promise<{ product: ProductDetail | null }>;
        })
        .then(({ product }) => {
          if (!product) {
            setFetchState({ status: 'not-found' });
            return;
          }
          setSelections(getInitialSelections(product.options));
          setFetchState({ status: 'loaded', product });
        })
        .catch(() => {
          // Distinguishes a genuine failure from this request simply
          // having been superseded/aborted (a close, or this same
          // effect's own cleanup) — an abort is not an error, mirroring
          // SearchOverlay's identical guard.
          if (controller.signal.aborted) return;
          setFetchState({ status: 'error' });
        });
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, handle, retryToken]);

  function handleOptionChange(optionName: string, value: string) {
    // Product Behavior: "variant selection" (PROJECT.md §82) — the shared
    // VariantPicker's fourth real call site (DECISIONS.md D-036/D-060).
    trackEvent('variant_selected', {
      item_id: handle,
      option_name: optionName,
      option_value: value,
      context: 'quick_add',
    });
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  }

  const loaded = fetchState.status === 'loaded' ? fetchState : null;
  const soldOut = loaded ? isProductSoldOut(loaded.product.variants) : false;
  const matchedVariant = loaded ? findMatchingVariant(loaded.product.variants, selections) : null;
  const selectionComplete = loaded
    ? isSelectionComplete(loaded.product.options, selections)
    : false;
  const canAddToBag = !soldOut && matchedVariant !== null && matchedVariant.availableForSale;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Quick Add — ${title}`}
      // top-auto: a real, live-verified fix, not copied blindly from
      // SizeGuidePanel's identical base classes. The native <dialog>'s own
      // UA stylesheet sets `inset: 0` (top/right/bottom/left all 0);
      // without overriding `top`, both `top: 0` and our `bottom-0` are
      // simultaneously definite alongside a definite (fit-content) height —
      // an over-constrained abspos box, which browsers resolve by
      // *ignoring* `bottom` and positioning from `top` instead. The panel
      // therefore rendered pinned to the *top* of the viewport at every
      // width below `md`, not as a bottom sheet — confirmed live via
      // computed styles/boundingBox during this task's own verification
      // pass, not assumed. `top-auto` removes `top` from the constraint,
      // so `bottom-0` alone determines position, anchoring the sheet to
      // the viewport's bottom edge as designed. Overridden back to `0` by
      // `md:inset-0` at the desktop breakpoint, where all four insets
      // being `0` plus `md:m-auto` is what actually centers the dialog
      // (the classic fixed + inset-0 + margin:auto technique) — this fix
      // only changes the below-`md` case. See DECISIONS.md D-060.
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-0 md:m-auto md:h-fit md:max-h-[85vh] md:w-full md:max-w-sm"
    >
      <div className="flex items-center justify-between pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">{title}</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* aria-live/aria-atomic — matches SearchOverlay's and
          InteractiveModelExperience's established precedent (DECISIONS.md
          D-049) for content that swaps without navigation: a screen-reader
          user who just opened the dialog is told when loading resolves. */}
      <div aria-live="polite" aria-atomic="true">
        {fetchState.status === 'loading' && (
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 animate-pulse bg-esque-elevated" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-14 animate-pulse bg-esque-elevated" />
              ))}
            </div>
          </div>
        )}

        {fetchState.status === 'error' && (
          <div className="flex flex-col items-start gap-4">
            <p className="font-display text-heading-3 uppercase text-esque-text">
              SOMETHING WENT WRONG.
            </p>
            <Button variant="secondary" onClick={() => setRetryToken((t) => t + 1)}>
              Retry
            </Button>
          </div>
        )}

        {fetchState.status === 'not-found' && (
          <p className="font-display text-heading-3 uppercase text-esque-text">
            THIS PIECE DOESN&apos;T EXIST.
          </p>
        )}

        {loaded &&
          (soldOut ? (
            <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              NO LONGER AVAILABLE.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <VariantPicker
                namePrefix={`quickadd-${handle}`}
                options={loaded.product.options}
                variants={loaded.product.variants}
                selections={selections}
                onChange={handleOptionChange}
              />
              <Button
                type="button"
                variant="primary"
                disabled={!canAddToBag}
                onClick={() => {
                  // No cart exists yet (D-016/D-029) — a real, disabled-
                  // gated click; the bag mutation itself is a deliberate
                  // no-op, matching ProductPurchasePanel/ActiveGarmentPanel
                  // exactly.
                  if (!matchedVariant) return;
                  trackEvent('quick_add_click', {
                    currency: matchedVariant.price.currencyCode,
                    value: Number(matchedVariant.price.amount),
                    items: [
                      {
                        item_id: loaded.product.handle,
                        item_name: loaded.product.title,
                        item_category: loaded.product.productType,
                        item_variant: matchedVariant.id,
                        price: Number(matchedVariant.price.amount),
                      },
                    ],
                    region: 'product_card',
                  });
                }}
              >
                ADD TO BAG
              </Button>
              {!selectionComplete && (
                <p className="text-utility text-esque-text-secondary">
                  Select all options to continue.
                </p>
              )}
            </div>
          ))}
      </div>
    </dialog>
  );
}

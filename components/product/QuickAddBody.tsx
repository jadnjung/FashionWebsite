'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { CartFeedback } from '@/components/cart/CartFeedback';
import { VariantPicker } from '@/components/product/VariantPicker';
import { trackEvent } from '@/lib/analytics/gtag';
import { getPurchaseAmounts } from '@/lib/analytics/purchase-amounts';
import { fetchJsonWithDeadline } from '@/lib/client-request';
import { formatPrice } from '@/lib/product/price';
import { getRemainingQuantity } from '@/lib/product/quantity';
import {
  findMatchingVariant,
  getInitialSelections,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';
import type { ProductDetail } from '@/lib/shopify/products';

interface QuickAddBodyProps {
  handle: string;
  open: boolean;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'loaded'; product: ProductDetail };

// Deferred shopping state; the lightweight parent owns native dialog lifetime.
export function QuickAddBody({ handle, open }: QuickAddBodyProps) {
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });
  const [selections, setSelections] = useState<OptionSelections>({});
  const [retryToken, setRetryToken] = useState(0);
  const [purchaseUnavailable, setPurchaseUnavailable] = useState(false);
  const cart = useCart();

  if (!open && purchaseUnavailable) {
    setPurchaseUnavailable(false);
  }

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
      fetchJsonWithDeadline<{ product: ProductDetail | null }>(
        `/api/products/${encodeURIComponent(handle)}`,
        controller.signal,
      )
        .then(({ product }) => {
          // Every commit belongs to this opening, including initialization.
          // Body decoding may resolve after a close, Retry, or newer request.
          if (controller.signal.aborted) return;
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
    setPurchaseUnavailable(false);
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
  const inBag =
    cart.cart.lines.find((line) => line.variantId === matchedVariant?.id)?.quantity ?? 0;
  const remaining = getRemainingQuantity(matchedVariant?.quantityAvailable, inBag, cart.demo);
  const atBagLimit = matchedVariant?.availableForSale === true && remaining === 0;
  const canAddToBag =
    !soldOut && matchedVariant !== null && matchedVariant.availableForSale && !atBagLimit;

  return (
    <>
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

        {loaded && (
          <p className="mb-4 text-body text-esque-text">
            {formatPrice(matchedVariant?.price ?? loaded.product.minPrice)}
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
                aria-disabled={cart.pending}
                aria-busy={cart.pending}
                className="aria-disabled:cursor-wait aria-disabled:opacity-40"
                onClick={() => {
                  // Track accepted intent; cart recovery owns retries without another intent.
                  if (!canAddToBag || !matchedVariant || cart.pending) return;
                  setPurchaseUnavailable(true);
                  const quantity = 1;
                  const amounts = getPurchaseAmounts(matchedVariant.price.amount, quantity);
                  if (amounts)
                    trackEvent('quick_add_click', {
                      currency: matchedVariant.price.currencyCode,
                      value: amounts.value,
                      items: [
                        {
                          item_id: loaded.product.handle,
                          item_name: loaded.product.title,
                          item_category: loaded.product.productType,
                          item_variant: matchedVariant.id,
                          price: amounts.price,
                          quantity,
                        },
                      ],
                      region: 'product_card',
                    });
                  void cart.addItems([
                    { handle: loaded.product.handle, variantId: matchedVariant.id, quantity },
                  ]);
                }}
              >
                ADD TO BAG
              </Button>
              {atBagLimit && (
                <div role="status" className="text-utility text-esque-text">
                  <p>{inBag} already in your bag. This selection is at its bag limit.</p>
                  {(!purchaseUnavailable || (!cart.notice && !cart.error)) && (
                    <Link
                      href="/bag"
                      className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-esque-text"
                    >
                      VIEW BAG
                    </Link>
                  )}
                </div>
              )}
              {!selectionComplete && (
                // text-esque-text, not -secondary — see
                // ProductPurchasePanel.tsx's identical comment on this same
                // helper copy.
                <p className="text-utility text-esque-text">Select all options to continue.</p>
              )}
            </div>
          ))}
      </div>
      {cart.demo && (
        <p className="mt-4 text-utility text-esque-text-secondary">
          Demo bag. Checkout is unavailable.
        </p>
      )}
      <CartFeedback active={purchaseUnavailable} />
    </>
  );
}

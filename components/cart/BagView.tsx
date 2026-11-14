'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { useWishlist } from '@/components/product/use-wishlist';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics/gtag';
import { formatPrice } from '@/lib/product/price';
import { resolveQuantity } from '@/lib/product/quantity';
import type { CartLine } from '@/lib/cart/model';

function BagLine({ line, onRemove }: { line: CartLine; onRemove: (variantId: string) => void }) {
  const { pending, setQuantity } = useCart();
  const wishlist = useWishlist();
  const saved = wishlist.isWishlisted(line.handle);
  const optionLabel = line.selectedOptions
    .map((option) => `${option.name} ${option.value}`)
    .join(', ');
  const lineLabel = optionLabel ? `${line.title}, ${optionLabel}` : line.title;
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [quantity, setQuantityInput] = useState(String(line.quantity));
  const [previousQuantity, setPreviousQuantity] = useState(line.quantity);
  if (previousQuantity !== line.quantity) {
    setPreviousQuantity(line.quantity);
    setQuantityInput(String(line.quantity));
  }
  return (
    <li className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 border-b border-esque-elevated py-6 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <Link
        href={`/products/${line.handle}`}
        aria-label={`View ${line.title}`}
        className="relative aspect-[4/5] self-start bg-esque-surface"
      >
        {line.image && (
          <Image
            src={line.image.url}
            alt={line.image.altText ?? line.title}
            fill
            sizes="(min-width: 640px) 128px, 96px"
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-col gap-3">
        <Link
          href={`/products/${line.handle}`}
          className="text-product-name underline-offset-4 hover:underline"
        >
          {line.title}
        </Link>
        <p className="text-utility text-esque-text-secondary">
          {line.selectedOptions.map((option) => `${option.name} ${option.value}`).join(' / ')}
        </p>
        <p className="text-body">{formatPrice(line.unitPrice)} each</p>
        <div className="flex flex-wrap items-end gap-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (pending) return;
              event.currentTarget.querySelector('input')?.focus();
              const next = resolveQuantity(quantity, 1, line.quantityMax);
              setQuantityInput(String(next));
              void setQuantity(line.variantId, next);
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="flex flex-col gap-2 text-utility">
              Quantity <span className="sr-only">for {lineLabel}</span>
              <input
                type="number"
                name="quantity"
                min={1}
                max={line.quantityMax}
                step={1}
                value={quantity}
                onChange={(event) => setQuantityInput(event.target.value)}
                readOnly={pending}
                className="h-11 w-20 border border-esque-text-secondary bg-esque-black px-3 text-esque-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text disabled:opacity-40"
              />
            </label>
            <Button
              type="submit"
              variant="secondary"
              disabled={quantity === String(line.quantity)}
              aria-disabled={pending}
              className="aria-disabled:cursor-wait aria-disabled:opacity-40"
            >
              UPDATE
            </Button>
          </form>
          <button
            type="button"
            onClick={() => onRemove(line.variantId)}
            aria-disabled={pending}
            aria-label={`Remove ${lineLabel}`}
            className="min-h-11 py-2 text-utility underline underline-offset-4 aria-disabled:cursor-wait aria-disabled:opacity-40"
          >
            REMOVE
          </button>
          <button
            type="button"
            disabled={!wishlist.ready}
            aria-disabled={saved}
            onClick={() => {
              if (saved || !wishlist.ready) return;
              wishlist.add({
                handle: line.handle,
                title: line.title,
                imageUrl: line.image?.url ?? null,
                imageAlt: line.image?.altText ?? null,
                minPrice: line.productMinPrice,
              });
              setSaveAttempted(true);
              trackEvent('add_to_wishlist', {
                currency: line.productMinPrice.currencyCode,
                value: Number(line.productMinPrice.amount),
                items: [
                  {
                    item_id: line.handle,
                    item_name: line.title,
                    price: Number(line.productMinPrice.amount),
                  },
                ],
              });
            }}
            aria-label={
              saved ? `${line.title} saved to wishlist` : `Save ${line.title} to wishlist`
            }
            className="min-h-11 py-2 text-utility underline underline-offset-4 disabled:opacity-40"
          >
            {saved ? 'SAVED' : 'SAVE TO WISHLIST'}
          </button>
        </div>
        {saveAttempted && (
          <p role="status" className="text-utility">
            {wishlist.persistenceError
              ? 'Saved for this visit. Browser storage is unavailable.'
              : 'Saved to wishlist.'}
          </p>
        )}
        <p className="text-body">{formatPrice(line.lineTotal)}</p>
      </div>
    </li>
  );
}

export function BagView() {
  const {
    demo,
    cart,
    pending,
    error,
    notice,
    storageWarning,
    crossTabWarning,
    retry,
    clear,
    remove,
  } = useCart();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [removalFocusRequest, setRemovalFocusRequest] = useState(0);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (removalFocusRequest === 0) return;
    const nextRemove = listRef.current?.querySelector<HTMLButtonElement>(
      'button[aria-label^="Remove "]',
    );
    (nextRemove ?? headingRef.current)?.focus();
  }, [removalFocusRequest]);

  async function handleRemove(variantId: string) {
    if (pending) return;
    if (!(await remove(variantId))) return;
    setRemovalFocusRequest((value) => value + 1);
  }

  async function handleRecovery(action: () => Promise<boolean>) {
    if (pending || recovering) return;
    setRecovering(true);
    const success = await action();
    setRecovering(false);
    if (success) setRemovalFocusRequest((value) => value + 1);
  }
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-8 md:py-16">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-heading-1 uppercase tracking-display"
      >
        {demo ? 'Demo bag' : 'Bag'}
      </h1>
      <p className="mt-4 max-w-xl text-body text-esque-text-secondary">
        {demo
          ? 'Preview pieces and prices are simulated. Checkout is unavailable.'
          : 'Purchasing is not available yet. Your bag will be connected when the store opens.'}
      </p>
      <p role="status" aria-atomic="true" className="mt-4 text-utility">
        {pending ? 'Updating demo bag…' : (error ?? notice)}
      </p>
      {storageWarning && (
        <p role="status" className="mt-3 text-utility">
          Your demo bag is available in this tab. Saving it between visits is unavailable.
        </p>
      )}
      {demo && crossTabWarning && (
        <p className="mt-3 text-utility">
          Multi-tab updates are unavailable in this browser. Keep this demo bag in one tab.
        </p>
      )}
      {demo && cart.recoveryLines.length > 0 && (
        <section
          aria-label="Saved selections needing attention"
          className="mt-6 flex flex-col gap-4 border border-esque-elevated p-4"
        >
          <h2 className="text-body">Review saved selections</h2>
          <p className="text-utility text-esque-text-secondary">
            These saved selections are excluded from the demo subtotal. Remove them to select a
            different variant or quantity.
          </p>
          {cart.recoveryLines.map((line, index) => (
            <div
              key={`${line.variantId}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-utility">
                {line.title} · {line.variantTitle} · {line.quantity} selected. {line.message}
              </p>
              <button
                type="button"
                aria-disabled={pending}
                onClick={() => void handleRemove(line.variantId)}
                aria-label={`Remove saved selection ${line.title} ${line.variantTitle}`}
                className="min-h-11 py-2 text-utility underline underline-offset-4 aria-disabled:cursor-wait aria-disabled:opacity-40"
              >
                REMOVE SAVED SELECTION
              </button>
            </div>
          ))}
        </section>
      )}
      {demo && (error || recovering) && (
        <div className="mt-4 flex flex-wrap gap-4">
          <Button aria-disabled={pending} onClick={() => void handleRecovery(retry)}>
            TRY AGAIN
          </Button>
          <Button
            variant="secondary"
            aria-disabled={pending}
            onClick={() => void handleRecovery(clear)}
          >
            CLEAR DEMO BAG
          </Button>
        </div>
      )}
      {demo && cart.lines.length > 0 ? (
        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <ul ref={listRef} aria-label="Bag items">
            {cart.lines.map((line) => (
              <BagLine
                key={line.variantId}
                line={line}
                onRemove={(variantId) => void handleRemove(variantId)}
              />
            ))}
          </ul>
          <section
            aria-label="Bag summary"
            className="flex flex-col gap-6 border-t border-esque-elevated pt-6 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="flex items-center justify-between gap-4 text-body">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-utility text-esque-text-secondary">
              Demo subtotal. Shipping and tax are unavailable.
            </p>
            <Button disabled aria-describedby="checkout-unavailable">
              CHECKOUT UNAVAILABLE
            </Button>
            <p id="checkout-unavailable" className="text-utility text-esque-text-secondary">
              Checkout requires the Shopify store connection.
            </p>
          </section>
        </div>
      ) : !pending && demo && !error && cart.recoveryLines.length === 0 ? (
        <p className="my-12 text-body">YOUR BAG IS EMPTY.</p>
      ) : null}
      <Link
        href="/new"
        className="mt-8 inline-flex min-h-11 items-center text-utility underline underline-offset-4"
      >
        CONTINUE BROWSING
      </Link>
    </div>
  );
}

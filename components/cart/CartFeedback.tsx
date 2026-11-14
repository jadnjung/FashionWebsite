'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';

export function CartFeedback({ active }: { active: boolean }) {
  const { demo, pending, error, notice, storageWarning, crossTabWarning, retry } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const [retrying, setRetrying] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (focusRequest === 0) return;
    const target =
      containerRef.current?.querySelector<HTMLElement>('a[href="/bag"]') ??
      containerRef.current?.querySelector<HTMLElement>('[role="status"]');
    target?.focus();
  }, [focusRequest]);
  if (!active) return null;
  return (
    <div ref={containerRef} className="flex flex-col gap-2 text-utility text-esque-text">
      <p role="status" aria-atomic="true" tabIndex={-1}>
        {pending ? 'Updating demo bag…' : (error ?? notice)}
      </p>
      {demo && (error || retrying) && (
        <button
          type="button"
          aria-disabled={pending || retrying}
          onClick={async (event) => {
            if (pending || retrying) return;
            event.currentTarget.focus();
            setRetrying(true);
            const success = await retry();
            setRetrying(false);
            if (success) setFocusRequest((value) => value + 1);
          }}
          className="min-h-11 w-fit py-2 underline underline-offset-4 aria-disabled:cursor-wait aria-disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-esque-text"
        >
          TRY AGAIN
        </button>
      )}
      {demo && !pending && !error && notice && (
        <Link
          href="/bag"
          className="min-h-11 w-fit py-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-esque-text"
        >
          VIEW BAG
        </Link>
      )}
      {storageWarning && (
        <p role="status">
          Your demo bag is available in this tab. Saving it between visits is unavailable.
        </p>
      )}
      {demo && crossTabWarning && (
        <p>Multi-tab updates are unavailable in this browser. Keep this demo bag in one tab.</p>
      )}
    </div>
  );
}

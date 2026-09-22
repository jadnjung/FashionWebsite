'use client';

import { useState } from 'react';
import { QuickAddPanel } from '@/components/product/QuickAddPanel';
import { trackEvent } from '@/lib/analytics/gtag';

interface QuickAddTriggerProps {
  handle: string;
  title: string;
}

// The on-grid Quick Add entry point (DESIGN_SYSTEM.md §40-41, resolves
// DECISIONS.md D-029 — see D-060). A sibling of ProductCard's own <Link>,
// never nested inside it — a <button> can't nest inside an <a> (invalid
// HTML; a click would also fire the outer navigation) — see
// ProductCard.tsx's own comment.
//
// Visibility (DESIGN_SYSTEM.md §37/§39, PROJECT.md §74 "no interaction
// should depend solely on hover"): below `md`, always visible/interactive
// — no hover exists on touch. At `md` and up, hidden at rest
// (opacity-0/pointer-events-none, but still occupying its layout row — no
// display:none, so revealing it never shifts the grid and never causes
// CLS) and revealed by group-hover AND group-focus-within, so tabbing onto
// the button reveals it exactly as it receives focus (a hover-only reveal
// with no focus equivalent is the exact accessibility failure DECISIONS.md
// D-037 already found and fixed once in this codebase). The 200ms
// duration/easing matches this same card's existing secondary-image hover
// crossfade (ProductCard.tsx) — one motion value for two related reveals
// on the same component, not a new one invented for this feature.
export function QuickAddTrigger({ handle, title }: QuickAddTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Product Behavior: "Quick Add usage" (PROJECT.md §82) — the one
          // real open-a-flow step Quick Add has (DECISIONS.md D-060).
          trackEvent('quick_add_open', { item_id: handle, item_name: title });
          setOpen(true);
        }}
        className="w-fit text-left text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 transition-opacity duration-200 ease-esque hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text md:pointer-events-none md:opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:opacity-100"
      >
        QUICK ADD
      </button>
      <QuickAddPanel handle={handle} title={title} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

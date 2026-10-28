'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useTransition } from 'react';
import { trackEvent } from '@/lib/analytics/gtag';

interface QuickAddTriggerProps {
  handle: string;
  title: string;
}

// QuickAddPanel (+ VariantPicker, lib/product/variants.ts) is dynamically
// imported rather than statically bundled here — a real, measured finding
// from this project's Phase 12 follow-up performance pass (DECISIONS.md
// D-071). ProductCard renders this trigger unconditionally for every card,
// and SearchOverlay (mounted unconditionally in ShellClient on every
// route, D-058) renders ProductCard for its own PRODUCTS result group —
// so before this fix, QuickAddPanel's own code shipped in the client
// bundle of every single page on the site, including ones with no
// product grid at all (/about, /contact, /legal/*, /archive). See D-071
// for the full before/after chunk-diff measurement.
//
// Preloading on hover/focus means the chunk is usually already warming by
// the time a desktop visitor actually clicks — this is the same moment
// this trigger's own existing reveal mechanism already fires (see the
// button's group-hover/group-focus-within classes below), so there is no
// new interaction to hook into, matching the vercel-react-best-practices
// skill's bundle-preload guidance.
function preloadQuickAddPanel() {
  void import('@/components/product/QuickAddPanel');
}

// ssr: false — this panel only ever opens from a client click, well after
// hydration, and has no reason to ever render on the server (the `open &&`
// guard below already excludes it from the server-rendered tree for the
// same reason; this is the explicit, documented signal to next/dynamic).
const QuickAddPanel = dynamic(
  () => import('@/components/product/QuickAddPanel').then((mod) => mod.QuickAddPanel),
  { ssr: false },
);

// The on-grid Quick Add entry point (DESIGN_SYSTEM.md §40-41, resolves
// DECISIONS.md D-029 — see D-060). A sibling of ProductCard's own <Link>,
// never nested inside it — a <button> can't nest inside an <a> (invalid
// HTML; a click would also fire the outer navigation) — see
// ProductCard.tsx's own comment.
//
// Visibility (DESIGN_SYSTEM.md §37/§39/§70 "no interaction should depend
// solely on hover"): hidden-until-revealed only on a device that can
// actually hover with a precise pointer — gated on the compound media
// feature `(hover: hover) and (pointer: fine)` (mirrors
// lib/motion/media.ts's `hasFinePointerAndHover`, expressed here as a pure
// CSS arbitrary variant rather than JS, since this is a static class list
// with no new client state to add). Everywhere else — touch devices of any
// width, including a touch tablet at/above `md`, and coarse/hybrid
// pointers — the trigger is always visible/interactive, because no hover
// exists to reveal it with. A width-based (`md:`) gate was used originally
// but was wrong: it hid the button behind hover on any viewport >= 768px
// regardless of input method, so a touch tablet landed on a
// `pointer-events: none` element it could never tap to focus. On a
// qualifying fine-pointer+hover device, the trigger stays hidden at rest
// (opacity-0/pointer-events-none, but still occupying its layout row — no
// display:none, so revealing it never shifts the grid and never causes
// CLS) and is revealed by group-hover AND group-focus-within, so tabbing
// onto the button reveals it exactly as it receives focus (a hover-only
// reveal with no focus equivalent is the exact accessibility failure
// DECISIONS.md D-037 already found and fixed once in this codebase). The
// 200ms duration/easing matches this same card's existing secondary-image
// hover crossfade (ProductCard.tsx) — one motion value for two related
// reveals on the same component, not a new one invented for this feature.
export function QuickAddTrigger({ handle, title }: QuickAddTriggerProps) {
  const [open, setOpen] = useState(false);
  // Separate from `open`: once true, stays true for the rest of this
  // card's lifetime — unlike `open`, which toggles on every close. This
  // decides whether QuickAddPanel is mounted *at all*, not whether its own
  // dialog is currently showModal()'d.
  //
  // Mounting is gated on "has this ever been opened," not "is it open right
  // now" — a real, live-reproduced regression found during review: gating
  // on `open` directly (`{open && <Suspense>...}`) unmounts QuickAddPanel
  // the instant it closes, which tears the <dialog> out of the DOM instead
  // of letting QuickAddPanel's own effect call the real dialog.close() on
  // it. The in-panel Close button's onClick calls `onClose` directly
  // (never dialogRef.current.close()) — confirmed live, with a clean
  // before/after comparison, that this specific path left focus on <body>
  // instead of returning it to this trigger, unlike every other close path
  // (Escape triggers the browser's own native close algorithm, which runs
  // and restores focus correctly *before* React ever unmounts anything, so
  // that path isn't affected). Gating on hasEverOpened instead means
  // QuickAddPanel, once mounted, stays mounted — exactly like it always was
  // before this dynamic-import change — so its own open/close effect is the
  // thing that calls the real dialog.showModal()/close() on every
  // subsequent toggle, restoring native focus-management behavior. The
  // bundle-splitting benefit is unaffected: the dynamically-imported chunk
  // is still never fetched until the first real open (or the hover/focus
  // preload below), and next/dynamic caches the module after that first
  // load regardless of how many times the component mounts/unmounts.
  const [hasEverOpened, setHasEverOpened] = useState(false);
  // Tracks exactly the window between a click and the dynamically-
  // imported QuickAddPanel chunk actually being ready (it stays false, and
  // the transition commits synchronously, once the chunk is cached after
  // its first use anywhere on the page — including via the hover/focus
  // preload above). Chosen over a manual useState loading flag per the
  // vercel-react-best-practices skill's rendering-usetransition-loading
  // rule: React keeps showing this trigger's own pre-click UI — rather
  // than flashing Suspense's fallback — for the whole pending window.
  // aria-busy is the one signal added below. Deliberately no new visible
  // text/copy (CONTENT.md defines no loading-state label for this
  // component) and no disabled attribute (clicking twice is already
  // harmless/idempotent, and disabling a just-clicked, currently-focused
  // button would blur it for no real benefit).
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Product Behavior: "Quick Add usage" (PROJECT.md §82) — the one
          // real open-a-flow step Quick Add has (DECISIONS.md D-060).
          // Fired on click regardless of load timing — opening genuinely
          // starts here even on the rare not-yet-preloaded path.
          trackEvent('quick_add_open', { item_id: handle, item_name: title });
          setHasEverOpened(true);
          startTransition(() => setOpen(true));
        }}
        onMouseEnter={preloadQuickAddPanel}
        onFocus={preloadQuickAddPanel}
        aria-busy={isPending}
        // py-1 — WCAG 2.2 AA (2.5.8): an independent review measured this
        // button's hit box at 84x20 CSS px on mobile/tablet (no vertical
        // padding at all, just the text-utility line box), below the 24x24
        // minimum. Same py-1-grows-the-click-target technique DECISIONS.md
        // D-051 already established for FilterBar's checkbox label — this
        // component was a previously-unaddressed instance of that same
        // issue class, not a new one. Purely additive: this trigger already
        // occupies its own static layout row at every width (never
        // display:none, see the comment above), so growing its box height
        // here changes no post-paint layout and causes no CLS.
        className="w-fit py-1 text-left text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 transition-opacity duration-200 ease-esque hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text [@media(hover:hover)_and_(pointer:fine)]:pointer-events-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:pointer-events-auto [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:pointer-events-auto [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
      >
        QUICK ADD
      </button>
      {hasEverOpened && (
        <Suspense fallback={null}>
          <QuickAddPanel handle={handle} title={title} open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

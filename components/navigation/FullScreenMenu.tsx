'use client';

import Link from 'next/link';
import { useEffect, useRef, type RefObject } from 'react';
import { NAVIGATION } from '@/lib/navigation-data';

interface FullScreenMenuProps {
  open: boolean;
  onClose: () => void;
  // The MENU button in Header, so focus can be returned to it explicitly on
  // close. Deliberately *not* derived from `document.activeElement` at open
  // time: WebKit (desktop and iOS Safari) does not focus a <button> on
  // click the way Chromium/Firefox do, so that heuristic silently loses
  // the trigger on Safari and focus falls back to <body> on close.
  triggerRef: RefObject<HTMLButtonElement | null>;
}

// DESIGN_SYSTEM.md §25-26 — full-screen overlay of oversized primary
// category typography, triggered by Header's MENU button. Real dialog
// semantics (role="dialog" + aria-modal + aria-label), not a styled div:
// focus moves into the menu on open, is trapped inside it while open, and
// returns to the MENU button on close.
export function FullScreenMenu({ open, onClose, triggerRef }: FullScreenMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  // Tracks whether the menu has genuinely been opened at least once, so the
  // `else` branch below only ever returns focus to the trigger after a real
  // open→close transition — never on mount. A naive "skip the first effect
  // run" ref guard is NOT sufficient here: Next.js's App Router enables
  // React Strict Mode by default, which double-invokes every effect once on
  // initial mount in dev (mount → simulated cleanup → mount again) as a
  // diagnostic aid. That means a first-render guard gets consumed by the
  // first of the two dev-only invocations and no longer blocks the second
  // one — `open` is still `false` at that point (mount state, before any
  // interaction), so the second invocation would still hit the `else`
  // branch and steal focus to the MENU trigger. Gating on "has this menu
  // ever actually been open" instead is correct regardless of how many
  // times the effect fires while `open` has never yet been true.
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      firstLinkRef.current?.focus();
    } else if (hasOpenedRef.current) {
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      ref={containerRef}
      id="esque-full-screen-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      hidden={!open}
      className="fixed inset-0 z-40 flex flex-col justify-center gap-4 bg-esque-black px-8 transition-opacity duration-[400ms] ease-esque"
    >
      {NAVIGATION.map((category, index) => (
        <Link
          key={category.href}
          href={category.href}
          ref={index === 0 ? firstLinkRef : undefined}
          className="font-display text-display-l tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest"
        >
          {category.label}
        </Link>
      ))}
    </div>
  );
}

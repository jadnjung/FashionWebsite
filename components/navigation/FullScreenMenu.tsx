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

  useEffect(() => {
    if (open) {
      firstLinkRef.current?.focus();
    } else {
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

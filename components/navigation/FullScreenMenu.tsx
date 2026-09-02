'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { NAVIGATION } from '@/lib/navigation-data';

interface FullScreenMenuProps {
  open: boolean;
  onClose: () => void;
}

export function FullScreenMenu({ open, onClose }: FullScreenMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  // WAI-ARIA dialog pattern: remember whatever had focus right before the
  // dialog opened (the MENU trigger button) so it can be restored on close
  // — DESIGN_SYSTEM.md §25's keyboard requirement ("focus returns to the
  // MENU trigger on close") isn't satisfied by hiding the dialog alone;
  // the browser drops focus to <body> with nothing to reclaim it otherwise.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      firstLinkRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus();
    }
  }, [open]);

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

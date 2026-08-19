'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';
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
  const pathname = usePathname();

  // Always calls the *latest* onClose without needing it in the effect's
  // dependency array below. That distinction matters here, not just style:
  // onClose is a fresh arrow function on every ShellClient render, so a
  // plain `[pathname, onClose]` dependency would re-run the effect (and
  // thus re-close the menu) on *any* ShellClient re-render — including the
  // very render that just opened it, since flipping menuOpen to true also
  // creates a new onClose reference. useEffectEvent is the React-supplied
  // primitive for this: stable identity, always reads current props/state,
  // callable only from inside effects.
  const handleRouteChange = useEffectEvent(() => {
    onClose();
  });

  // Category links close the menu directly via onClick (below) for the
  // common case, but that alone misses browser back/forward navigation
  // while the menu happens to be open. Watching the route itself covers
  // both: without this, ShellClient's menuOpen state survives client-side
  // navigation (it wraps `{children}`, which is what changes), so the
  // destination page would render underneath a still-open, fully opaque
  // full-screen overlay.
  useEffect(() => {
    handleRouteChange();
  }, [pathname]);

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
      data-open={open}
      className="esque-menu fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-esque-black px-8"
    >
      {/* `my-auto` on this inner wrapper (not `justify-center` on the
          scrolling parent above) is what keeps all categories reachable.
          With 6 categories at up to 128px each, content height can exceed
          the viewport — `justify-center` on the parent would push the
          overflow equally off both the top and bottom edges (verified: NEW,
          the first/auto-focused category, landed ~140px above the visible
          viewport at 1280x720). Auto margins on a block-level flex child
          center it when it fits and let it flow naturally from the top,
          scrollable via the parent's `overflow-y-auto`, when it doesn't. */}
      <div className="my-auto flex flex-col gap-4">
        {NAVIGATION.map((category, index) => (
          <Link
            key={category.href}
            href={category.href}
            ref={index === 0 ? firstLinkRef : undefined}
            onClick={onClose}
            // Explicit tabIndex, not left to the anchor's default: WebKit
            // (desktop and iOS Safari) only includes links in the Tab
            // sequence when the system-level "Full Keyboard Access"
            // preference is on — off by default, so real Safari users (and
            // Playwright's mobile-safari project, which mirrors this
            // behavior) would silently skip every link here on Tab press,
            // landing on <body> instead. An explicit tabIndex overrides
            // that WebKit-specific default and keeps this dialog's
            // hand-rolled focus trap (handleKeyDown above) actually
            // reachable by keyboard on every engine.
            tabIndex={0}
            className="font-display text-display-l tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest"
          >
            {category.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

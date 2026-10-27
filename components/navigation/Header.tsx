'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type RefObject, type SVGProps } from 'react';
import { Button } from '@/components/ui/Button';
import { ComingSoonNotice, type ComingSoonFeature } from '@/components/navigation/ComingSoonNotice';

interface HeaderProps {
  menuOpen: boolean;
  onMenuOpen: () => void;
  // Exposes the MENU button's DOM node so FullScreenMenu can return focus
  // to it on close (see FullScreenMenu.tsx for why this must be explicit
  // rather than inferred from document.activeElement).
  menuTriggerRef: RefObject<HTMLButtonElement | null>;
  // Mirrors menuOpen/onMenuOpen/menuTriggerRef exactly, for SearchOverlay
  // (ROADMAP.md Phase 4, DECISIONS.md D-058) — see ShellClient.tsx for why
  // both this and menuOpen live there rather than in Header/the overlay
  // itself (both need it: Header attaches it to a trigger button, the
  // overlay focuses it back on close), and for how inert={menuOpen ||
  // searchOpen} keeps the two overlays mutually exclusive.
  searchOpen: boolean;
  onSearchOpen: () => void;
  searchTriggerRef: RefObject<HTMLButtonElement | null>;
}

// Below `md` there isn't room for four full-text utility buttons (each
// carries Button's fixed px-6/py-3 secondary padding — see DECISIONS.md).
// SEARCH/ACCOUNT are the lower-priority controls (SEARCH is now real,
// ACCOUNT's real behavior lands in ROADMAP.md Phase 10), so they compress
// to icon-only below `md`; MENU and BAG stay as text since PROJECT.md §73
// requires both to remain immediately visible/reachable on mobile. `!`
// (Tailwind v4's important modifier) is required here, not stylistic
// preference: Button's own px-6/py-3 is unscoped, so a plain conflicting
// className has no guaranteed win against it (confirmed empirically — see
// task-11.5-report.md).
const compactUtilityButton = 'px-2.5! md:px-6!';
const tightUtilityButton = 'px-3! md:px-6!';

// Minimal hand-authored inline SVGs (thin single-weight strokes, matching
// DESIGN_SYSTEM.md's Swiss/editorial line language) rather than an icon
// library — no icon dependency exists anywhere else in this codebase.
function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8.5" cy="8.5" r="6" />
      <line x1="13.2" y1="13.2" x2="18" y2="18" strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <circle cx="10" cy="6.5" r="3.5" />
      <path d="M2.5 18c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5" strokeLinecap="round" />
    </svg>
  );
}

export function Header({
  menuOpen,
  onMenuOpen,
  menuTriggerRef,
  searchOpen,
  onSearchOpen,
  searchTriggerRef,
}: HeaderProps) {
  // Bag count is local state for now — DESIGN_SYSTEM.md's data-flow
  // section: no cart exists until ROADMAP.md Phase 2 wires up Shopify.
  const [bagCount] = useState(0);

  // ACCOUNT/BAG have no real behavior yet (see ComingSoonNotice.tsx). This
  // is an acknowledgment, not a decision the visitor needs to act on, so it
  // still never requires a manual close — but WCAG 2.2.1 requires a timed
  // auto-dismiss to also offer user control, so it now dismisses on any of
  // four triggers rather than a single unconditional 3s cutoff
  // (DECISIONS.md D-083): (1) the passive timeout below, lengthened to
  // 8000ms — long enough to read a 3-4 word acknowledgment more than once,
  // while still bounded; (2) Escape; (3) a click outside the utility nav
  // (see utilityNavRef/the click-listener effect below); (4) the MENU/
  // SEARCH overlay opening (see the render-time adjustment further below).
  const [comingSoonFeature, setComingSoonFeature] = useState<ComingSoonFeature | null>(null);
  // Scopes the outside-click listener below to the whole utility nav, not
  // just the toast's own DOM node — attached to the <nav> below.
  const utilityNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!comingSoonFeature) return;
    const timer = setTimeout(() => setComingSoonFeature(null), 8000);
    return () => clearTimeout(timer);
  }, [comingSoonFeature]);

  // Escape and outside-click, mirroring FullScreenMenu.tsx's/
  // SearchOverlay.tsx's own open-gated attach-in-effect/remove-in-cleanup
  // document-listener idiom exactly. Neither of those files has a real
  // "outside click" concept to copy — they're full-screen overlays with no
  // concept of "outside" — so only the listener attach/cleanup mechanics
  // are shared here, not an outside-click condition.
  useEffect(() => {
    if (!comingSoonFeature) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setComingSoonFeature(null);
    }

    // Scoped to the whole utility nav (MENU/SEARCH/ACCOUNT/BAG), not just
    // the toast element: React's synthetic onClick for whichever button was
    // clicked (e.g. BAG's own onClick, setComingSoonFeature('BAG')) fires
    // first, then the native event continues bubbling to this document
    // listener. If this only excluded the toast's own node, clicking BAG
    // while ACCOUNT's toast was showing would set 'BAG' via that onClick,
    // then this listener would immediately clobber it back to null as an
    // "outside" click in the same click. Treating a click anywhere inside
    // the utility nav as "inside" avoids that race — none of the four
    // trigger buttons can ever be treated as an outside click by this
    // listener, so it never fights with what a button's own onClick just
    // set. Clicking MENU/SEARCH also won't dismiss via this listener, but
    // that's fine — the render-time adjustment below handles those
    // explicitly and independently. A click on the toast's own text is
    // "outside" by this check and does dismiss it — the toast has no
    // interactive content, and "click it to dismiss" is a reasonable toast
    // convention, not a bug.
    function handleClick(event: MouseEvent) {
      if (!utilityNavRef.current?.contains(event.target as Node)) {
        setComingSoonFeature(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    // `capture: true`, not the bubble phase: confirmed live (under
    // concurrent server load, which delays a Suspense boundary resolving)
    // that a click landing on a transient loading-fallback element can fail
    // to ever reach a bubble-phase document listener, leaving the toast to
    // fall back to the full passive timeout instead of dismissing
    // immediately. A capture-phase listener runs top-down before the event
    // reaches its target, so it isn't affected by whatever happens to the
    // target subtree afterward. `removeEventListener` must repeat `{
    // capture: true }` — it's part of matching the exact listener
    // registration, not an optional hint.
    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [comingSoonFeature]);

  // Dismisses the toast the instant MENU/SEARCH opens. Derived state, not
  // an effect: this is "adjusting state when a prop changes" (the same
  // shape as DECISIONS.md D-082's quantityMax re-sync), which this
  // project's react-hooks/set-state-in-effect rule forbids doing via
  // useEffect(() => { if (overlayOpen) setComingSoonFeature(null) },
  // [menuOpen, searchOpen]) — so the previous overlayOpen value is tracked
  // in state and compared during render instead. Beyond overlapping with
  // outside-click above, this has a real purpose on its own: Header becomes
  // inert while an overlay is open (see searchOpen's own prop-doc comment
  // above), so a still-pending toast could otherwise reappear the instant
  // the overlay later closes and inert is removed, even if a lot of time
  // has passed.
  const overlayOpen = menuOpen || searchOpen;
  const [prevOverlayOpen, setPrevOverlayOpen] = useState(overlayOpen);
  if (overlayOpen !== prevOverlayOpen) {
    setPrevOverlayOpen(overlayOpen);
    if (overlayOpen) setComingSoonFeature(null);
  }

  return (
    <header
      role="banner"
      className="relative flex h-[72px] items-center justify-between border-b border-esque-surface bg-esque-black px-4 md:px-8"
    >
      <Link href="/" className="font-display text-lg tracking-nav text-esque-text">
        ESQUE
      </Link>

      <nav ref={utilityNavRef} aria-label="Utility" className="flex items-center gap-2 md:gap-6">
        <Button
          ref={menuTriggerRef}
          variant="secondary"
          aria-expanded={menuOpen}
          aria-controls="esque-full-screen-menu"
          onClick={onMenuOpen}
          className={tightUtilityButton}
        >
          MENU
        </Button>
        <Button
          ref={searchTriggerRef}
          variant="secondary"
          aria-expanded={searchOpen}
          aria-controls="esque-search-overlay"
          onClick={onSearchOpen}
          className={`inline-flex items-center justify-center ${compactUtilityButton}`}
        >
          <SearchIcon className="h-5 w-5 md:hidden" />
          <span className="sr-only md:not-sr-only">SEARCH</span>
        </Button>
        {/* ACCOUNT: real behavior lands in ROADMAP.md Phase 10; clicking
            shows ComingSoonNotice instead of doing nothing. */}
        <Button
          variant="secondary"
          onClick={() => setComingSoonFeature('ACCOUNT')}
          className={`inline-flex items-center justify-center ${compactUtilityButton}`}
        >
          <AccountIcon className="h-5 w-5 md:hidden" />
          <span className="sr-only md:not-sr-only">ACCOUNT</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => setComingSoonFeature('BAG')}
          className={tightUtilityButton}
        >
          {`BAG (${bagCount})`}
        </Button>
      </nav>
      <ComingSoonNotice feature={comingSoonFeature} />
    </header>
  );
}

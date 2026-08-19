'use client';

import Link from 'next/link';
import { useState, type RefObject, type SVGProps } from 'react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  menuOpen: boolean;
  onMenuOpen: () => void;
  // Exposes the MENU button's DOM node so FullScreenMenu can return focus
  // to it on close (see FullScreenMenu.tsx for why this must be explicit
  // rather than inferred from document.activeElement).
  menuTriggerRef: RefObject<HTMLButtonElement | null>;
}

// Below `md` there isn't room for four full-text utility buttons (each
// carries Button's fixed px-6/py-3 secondary padding — see DECISIONS.md).
// SEARCH/ACCOUNT are the lower-priority, not-yet-wired controls (real
// behavior lands in ROADMAP.md Phase 4/10), so they compress to icon-only
// below `md`; MENU and BAG stay as text since PROJECT.md §73 requires both
// to remain immediately visible/reachable on mobile. `!` (Tailwind v4's
// important modifier) is required here, not stylistic preference: Button's
// own px-6/py-3 is unscoped, so a plain conflicting className has no
// guaranteed win against it (confirmed empirically — see task-11.5-report.md).
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

export function Header({ menuOpen, onMenuOpen, menuTriggerRef }: HeaderProps) {
  // Bag count is local state for now — DESIGN_SYSTEM.md's data-flow
  // section: no cart exists until ROADMAP.md Phase 2 wires up Shopify.
  const [bagCount] = useState(0);

  return (
    <header
      role="banner"
      className="flex h-[72px] items-center justify-between border-b border-esque-surface bg-esque-black px-4 md:px-8"
    >
      <Link href="/" className="font-display text-lg tracking-nav text-esque-text">
        ESQUE
      </Link>

      <nav aria-label="Utility" className="flex items-center gap-2 md:gap-6">
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
        {/* SEARCH/ACCOUNT: real behavior lands in ROADMAP.md Phase 4/10. */}
        <Button
          variant="secondary"
          onClick={() => {}}
          className={`inline-flex items-center justify-center ${compactUtilityButton}`}
        >
          <SearchIcon className="h-5 w-5 md:hidden" />
          <span className="sr-only md:not-sr-only">SEARCH</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => {}}
          className={`inline-flex items-center justify-center ${compactUtilityButton}`}
        >
          <AccountIcon className="h-5 w-5 md:hidden" />
          <span className="sr-only md:not-sr-only">ACCOUNT</span>
        </Button>
        <Button variant="secondary" onClick={() => {}} className={tightUtilityButton}>
          {`BAG (${bagCount})`}
        </Button>
      </nav>
    </header>
  );
}

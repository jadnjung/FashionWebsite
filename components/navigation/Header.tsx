'use client';

import Link from 'next/link';
import { useState, type RefObject } from 'react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  menuOpen: boolean;
  onMenuOpen: () => void;
  // Exposes the MENU button's DOM node so FullScreenMenu can return focus
  // to it on close (see FullScreenMenu.tsx for why this must be explicit
  // rather than inferred from document.activeElement).
  menuTriggerRef: RefObject<HTMLButtonElement | null>;
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

      <nav aria-label="Utility" className="flex items-center gap-4 md:gap-6">
        <Button
          ref={menuTriggerRef}
          variant="secondary"
          aria-expanded={menuOpen}
          aria-controls="esque-full-screen-menu"
          onClick={onMenuOpen}
        >
          MENU
        </Button>
        {/* SEARCH/ACCOUNT: real behavior lands in ROADMAP.md Phase 4/10. */}
        <Button variant="secondary" onClick={() => {}}>
          SEARCH
        </Button>
        <Button variant="secondary" onClick={() => {}}>
          ACCOUNT
        </Button>
        <Button variant="secondary" onClick={() => {}}>
          {`BAG (${bagCount})`}
        </Button>
      </nav>
    </header>
  );
}

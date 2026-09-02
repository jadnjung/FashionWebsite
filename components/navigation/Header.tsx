'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  menuOpen: boolean;
  onMenuOpen: () => void;
}

export function Header({ menuOpen, onMenuOpen }: HeaderProps) {
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
          variant="secondary"
          className="text-utility"
          aria-expanded={menuOpen}
          aria-controls="esque-full-screen-menu"
          onClick={onMenuOpen}
        >
          MENU
        </Button>
        {/* SEARCH/ACCOUNT: real behavior lands in ROADMAP.md Phase 4/10. */}
        <Button variant="secondary" className="text-utility" onClick={() => {}}>
          SEARCH
        </Button>
        <Button variant="secondary" className="text-utility" onClick={() => {}}>
          ACCOUNT
        </Button>
        <Button variant="secondary" className="text-utility" onClick={() => {}}>
          {`BAG (${bagCount})`}
        </Button>
      </nav>
    </header>
  );
}

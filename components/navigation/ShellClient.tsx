'use client';

import { useRef, useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { FullScreenMenu } from '@/components/navigation/FullScreenMenu';

// Owns the shell-wide client state (currently just menu-open) so that
// app/layout.tsx can stay a Server Component and keep its `metadata`
// export — Next.js forbids `metadata` exports in Client Components.
// Task 10 extends this component with Footer rather than adding more
// state to layout.tsx.
export function ShellClient({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Owned here (not inside Header or FullScreenMenu) because both need it:
  // Header attaches it to the MENU button; FullScreenMenu focuses it back
  // on close.
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* WAI-ARIA APG modal dialog pattern: everything behind the open
          FullScreenMenu is marked inert. The Tab-trap inside FullScreenMenu
          only intercepts keydown, which screen-reader virtual-cursor
          navigation bypasses entirely — inert additionally removes this
          wrapper's contents from the accessibility tree and from focus/hit
          testing at the browser level while the menu is open, including the
          MENU trigger itself (correct: it's visually covered too). Native
          DOM attribute, no library required. */}
      <div inert={menuOpen}>
        <Header
          menuOpen={menuOpen}
          onMenuOpen={() => setMenuOpen(true)}
          menuTriggerRef={menuTriggerRef}
        />
        <main id="main-content">{children}</main>
      </div>
      <FullScreenMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        triggerRef={menuTriggerRef}
      />
    </>
  );
}

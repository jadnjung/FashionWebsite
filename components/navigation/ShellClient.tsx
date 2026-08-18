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
      <Header
        menuOpen={menuOpen}
        onMenuOpen={() => setMenuOpen(true)}
        menuTriggerRef={menuTriggerRef}
      />
      <FullScreenMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        triggerRef={menuTriggerRef}
      />
      <main id="main-content">{children}</main>
    </>
  );
}

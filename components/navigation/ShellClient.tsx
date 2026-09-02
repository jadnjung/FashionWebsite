'use client';

import { useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { FullScreenMenu } from '@/components/navigation/FullScreenMenu';

// Next.js does not allow a `metadata` export in a Client Component, so the
// shell's interactive state (menuOpen, shared by Header and FullScreenMenu)
// lives here rather than in app/layout.tsx directly. app/layout.tsx stays a
// Server Component and renders this as a wrapper around {children}.
export function ShellClient({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} />
      <FullScreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main id="main-content">{children}</main>
    </>
  );
}

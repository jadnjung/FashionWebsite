'use client';

import { useState } from 'react';
import { Header } from '@/components/navigation/Header';

// Owns the shell-wide client state (currently just menu-open) so that
// app/layout.tsx can stay a Server Component and keep its `metadata`
// export — Next.js forbids `metadata` exports in Client Components.
// Tasks 9 and 10 extend this component with FullScreenMenu and Footer
// rather than adding more state to layout.tsx.
export function ShellClient({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} />
      <main id="main-content">{children}</main>
    </>
  );
}

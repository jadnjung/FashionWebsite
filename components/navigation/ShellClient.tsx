'use client';

import { useRef, useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { FullScreenMenu } from '@/components/navigation/FullScreenMenu';

// Owns the shell-wide client state (currently just menu-open) so that
// app/layout.tsx can stay a Server Component and keep its `metadata`
// export — Next.js forbids `metadata` exports in Client Components.
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
          DOM attribute, no library required.
          Footer lives inside this same wrapper (as a sibling after <main>)
          so it's covered by the same inert behavior — otherwise its links
          would stay focusable/screen-reader-reachable while the full-screen
          menu visually covers the whole viewport, including the footer.
          The wrapper is a flex column filling the body's height (body is
          `flex flex-col` + `min-h-full` in app/layout.tsx) with `main`
          allowed to grow, so Footer is pushed to the bottom of the
          viewport on short pages instead of trailing directly under a
          short <main> with empty space beneath it.

          The skip-to-content link lives here too (moved from app/layout.tsx),
          as the first child inside this same inert wrapper: it's background
          content just like Header/main/Footer — visually covered by the
          full-screen menu when open — so it must become unreachable then
          too. Previously it sat outside the wrapper as a layout.tsx sibling
          and stayed focusable/in the accessibility tree even while the menu
          was open. */}
      <div inert={menuOpen} className="flex min-h-full flex-1 flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-esque-forest focus:px-4 focus:py-2 focus:text-esque-text"
        >
          Skip to content
        </a>
        <Header
          menuOpen={menuOpen}
          onMenuOpen={() => setMenuOpen(true)}
          menuTriggerRef={menuTriggerRef}
        />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <FullScreenMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        triggerRef={menuTriggerRef}
      />
    </>
  );
}

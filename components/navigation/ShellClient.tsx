'use client';

import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { FullScreenMenu } from '@/components/navigation/FullScreenMenu';
import { SearchOverlay } from '@/components/navigation/SearchOverlay';
import { CustomCursor } from '@/components/navigation/CustomCursor';
import { ACCESS_EVENT_COOKIE_NAME, parseAccessEventCookie } from '@/lib/access/cookies';
import { trackEvent } from '@/lib/analytics/gtag';

// Owns the shell-wide client state (currently just menu-open) so that
// app/layout.tsx can stay a Server Component and keep its `metadata`
// export — Next.js forbids `metadata` exports in Client Components.
//
// `footer` is accepted as a prop (a Server Component subtree passed through,
// per React's children/props-as-slots composition model) rather than this
// file importing and rendering `Footer` directly — DECISIONS.md D-046.
// `Footer` has no interactivity of its own; importing it directly here would
// pull its code into this client module's bundle on every storefront page
// for no behavioral benefit, purely because of where it happened to be
// rendered from.
export function ShellClient({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Owned here (not inside Header or FullScreenMenu) because both need it:
  // Header attaches it to the MENU button; FullScreenMenu focuses it back
  // on close.
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  // Identical pair for SearchOverlay (ROADMAP.md Phase 4, DECISIONS.md
  // D-058) — same reason as menuOpen/menuTriggerRef above: Header attaches
  // it to the SEARCH button, SearchOverlay focuses it back on close.
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  // Access Funnel: "successful access" (PROJECT.md §82) — DECISIONS.md
  // D-055. ShellClient mounts on every storefront page, including the one
  // a successful password redirects to, so this is the natural place to
  // observe "did the visitor just pass the gate." The real access cookies
  // are httpOnly (unreadable here by design); actions.ts additionally sets
  // a short-lived, non-httpOnly signal cookie on success specifically for
  // this. Read and immediately cleared so it can only ever fire once per
  // grant, not on every subsequent storefront page view.
  useEffect(() => {
    const tier = parseAccessEventCookie(document.cookie);
    if (!tier) return;
    trackEvent('access_granted', { tier });
    document.cookie = `${ACCESS_EVENT_COOKIE_NAME}=; Max-Age=0; path=/`;
  }, []);

  return (
    <>
      {/* WAI-ARIA APG modal dialog pattern: everything behind an open
          full-screen overlay (FullScreenMenu or SearchOverlay) is marked
          inert. The Tab-trap inside each overlay only intercepts keydown,
          which screen-reader virtual-cursor navigation bypasses entirely —
          inert additionally removes this wrapper's contents from the
          accessibility tree and from focus/hit testing at the browser
          level while either overlay is open, including both the MENU and
          SEARCH triggers themselves (correct: they're visually covered
          too). This is also the mechanism that keeps Menu and Search
          mutually exclusive: whichever overlay is open, Header's *other*
          trigger button sits inside this now-inert wrapper and cannot be
          reached by mouse, touch, or keyboard — no separate "close the
          other overlay first" logic is needed. Native DOM attribute, no
          library required.
          Footer lives inside this same wrapper (as a sibling after <main>)
          so it's covered by the same inert behavior — otherwise its links
          would stay focusable/screen-reader-reachable while a full-screen
          overlay visually covers the whole viewport, including the footer.
          The wrapper is a flex column filling the body's height (body is
          `flex flex-col` + `min-h-full` in app/layout.tsx) with `main`
          allowed to grow, so Footer is pushed to the bottom of the
          viewport on short pages instead of trailing directly under a
          short <main> with empty space beneath it.

          The skip-to-content link lives here too (moved from app/layout.tsx),
          as the first child inside this same inert wrapper: it's background
          content just like Header/main/Footer — visually covered by an open
          overlay — so it must become unreachable then too. Previously it
          sat outside the wrapper as a layout.tsx sibling and stayed
          focusable/in the accessibility tree even while the menu was open. */}
      <div inert={menuOpen || searchOpen} className="flex min-h-full flex-1 flex-col">
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
          searchOpen={searchOpen}
          onSearchOpen={() => setSearchOpen(true)}
          searchTriggerRef={searchTriggerRef}
        />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        {footer}
      </div>
      <FullScreenMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        triggerRef={menuTriggerRef}
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        triggerRef={searchTriggerRef}
      />
      <CustomCursor />
    </>
  );
}

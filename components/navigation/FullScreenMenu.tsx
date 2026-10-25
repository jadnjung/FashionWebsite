'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';
import { NAVIGATION } from '@/lib/navigation-data';
import { trackEvent } from '@/lib/analytics/gtag';

// Derives a stable, DOM-safe id for a category's subcategory list from its
// href ("/tops" -> "menu-subcategories-tops") rather than its label, since
// the href is already guaranteed unique across NAVIGATION (it's a real
// route) and needs no case/punctuation normalization the way "ETC." would.
function subcategoriesListId(categoryHref: string): string {
  return `menu-subcategories-${categoryHref.replace(/^\//, '').replace(/\//g, '-')}`;
}

// Module-scope, not defined inside FullScreenMenu — an inline component
// defined inside another component's body would be a fresh function
// identity every render, defeating React's ability to treat it as the
// same element across renders for no reason (rerender-no-inline-components).
// Mirrors Header.tsx's SearchIcon/AccountIcon treatment (viewBox 20x20,
// strokeWidth 1.5, aria-hidden — purely decorative, the button itself
// carries the accessible name).
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={`transition-transform duration-200 ease-esque ${expanded ? 'rotate-180' : ''}`}
    >
      <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface FullScreenMenuProps {
  open: boolean;
  onClose: () => void;
  // The MENU button in Header, so focus can be returned to it explicitly on
  // close. Deliberately *not* derived from `document.activeElement` at open
  // time: WebKit (desktop and iOS Safari) does not focus a <button> on
  // click the way Chromium/Firefox do, so that heuristic silently loses
  // the trigger on Safari and focus falls back to <body> on close.
  triggerRef: RefObject<HTMLButtonElement | null>;
}

// DESIGN_SYSTEM.md §25-26 — full-screen overlay of oversized primary
// category typography, triggered by Header's MENU button. Real dialog
// semantics (role="dialog" + aria-modal + aria-label), not a styled div:
// focus moves into the menu on open, is trapped inside it while open, and
// returns to the MENU button on close.
export function FullScreenMenu({ open, onClose, triggerRef }: FullScreenMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  // Tracks whether the menu has genuinely been opened at least once, so the
  // `else` branch below only ever returns focus to the trigger after a real
  // open→close transition — never on mount. A naive "skip the first effect
  // run" ref guard is NOT sufficient here: Next.js's App Router enables
  // React Strict Mode by default, which double-invokes every effect once on
  // initial mount in dev (mount → simulated cleanup → mount again) as a
  // diagnostic aid. That means a first-render guard gets consumed by the
  // first of the two dev-only invocations and no longer blocks the second
  // one — `open` is still `false` at that point (mount state, before any
  // interaction), so the second invocation would still hit the `else`
  // branch and steal focus to the MENU trigger. Gating on "has this menu
  // ever actually been open" instead is correct regardless of how many
  // times the effect fires while `open` has never yet been true.
  const hasOpenedRef = useRef(false);
  const pathname = usePathname();
  // Accordion: at most one category's subcategories are revealed at a
  // time, keyed by category.href. Click/tap on the disclosure button
  // (keyboard Enter/Space included, free from native <button> semantics)
  // is the mechanism that works completely on its own; onMouseEnter below
  // is additive, mouse-only progressive enhancement that mirrors
  // DESIGN_SYSTEM.md §25's hover-reveal and SilhouetteIllustration.tsx's
  // own onHover-previews/onClick-activates split (DECISIONS.md D-037/
  // D-043) — never required, per DESIGN_SYSTEM.md §70's ban on hover-only
  // critical information.
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  // Tracks which category's disclosure button was last *clicked* (not
  // hovered), independently of `expandedCategory` itself. Needed because
  // a real mouse click is preceded by a real mouseenter on the same row
  // (the pointer must physically cross the row to reach the button) —
  // without this, the disclosure button's onClick couldn't tell "the
  // hover-preview above already set this category open, so my click should
  // commit that open state" apart from "this category was already open
  // because of MY previous click, so this click should close it." Reading
  // expandedCategory itself for that decision made the button's very first
  // click on an unvisited category silently expand-then-immediately-
  // collapse in one gesture (live-reproduced: Playwright's `.click()`
  // fires a real mousemove-over-the-target, i.e. a real mouseenter,
  // immediately before the click event, and so does an actual mouse user
  // the first time their cursor reaches the button). A ref, not state —
  // this only needs to be read inside the click handler itself, never
  // rendered.
  const lastClickedCategoryRef = useRef<string | null>(null);

  // Always calls the *latest* onClose without needing it in the effect's
  // dependency array below. That distinction matters here, not just style:
  // onClose is a fresh arrow function on every ShellClient render, so a
  // plain `[pathname, onClose]` dependency would re-run the effect (and
  // thus re-close the menu) on *any* ShellClient re-render — including the
  // very render that just opened it, since flipping menuOpen to true also
  // creates a new onClose reference. useEffectEvent is the React-supplied
  // primitive for this: stable identity, always reads current props/state,
  // callable only from inside effects.
  const handleRouteChange = useEffectEvent(() => {
    onClose();
  });

  // Category links close the menu directly via onClick (below) for the
  // common case, but that alone misses browser back/forward navigation
  // while the menu happens to be open. Watching the route itself covers
  // both: without this, ShellClient's menuOpen state survives client-side
  // navigation (it wraps `{children}`, which is what changes), so the
  // destination page would render underneath a still-open, fully opaque
  // full-screen overlay.
  useEffect(() => {
    handleRouteChange();
  }, [pathname]);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      firstLinkRef.current?.focus();
    } else if (hasOpenedRef.current) {
      triggerRef.current?.focus();
      // Every reopen starts fresh — mirrors SearchOverlay.tsx's identical
      // reset-on-close for `query`/`searchResultsState`. Without this, a
      // category expanded during a previous open would still render
      // expanded (and animate its `esque-submenu-reveal` entrance again)
      // the instant the menu reopens, before any new hover/click asked
      // for that.
      setExpandedCategory(null);
      lastClickedCategoryRef.current = null;
    }
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      ref={containerRef}
      id="esque-full-screen-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-open={open}
      className="esque-menu fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-esque-black px-8"
    >
      {/* `my-auto` on this inner wrapper (not `justify-center` on the
          scrolling parent above) is what keeps all categories reachable.
          With 6 categories at up to 128px each, content height can exceed
          the viewport — `justify-center` on the parent would push the
          overflow equally off both the top and bottom edges (verified: NEW,
          the first/auto-focused category, landed ~140px above the visible
          viewport at 1280x720). Auto margins on a block-level flex child
          center it when it fits and let it flow naturally from the top,
          scrollable via the parent's `overflow-y-auto`, when it doesn't. */}
      <div className="my-auto flex flex-col gap-4">
        {NAVIGATION.map((category, index) => {
          const subcategories = category.subcategories ?? [];
          const hasSubcategories = subcategories.length > 0;
          const isExpanded = expandedCategory === category.href;
          const subcategoryListId = subcategoriesListId(category.href);

          return (
            <div
              key={category.href}
              className="flex flex-col gap-3"
              // Mouse-only preview (see expandedCategory's own comment
              // above for why this is purely additive). Fires on the whole
              // row, not just the category Link, so hovering the
              // disclosure button itself also previews — and hovering a
              // category with no subcategories collapses whatever panel
              // was previously open, keeping the accordion's "at most one
              // open" invariant true for hover too, not just click.
              onMouseEnter={() => setExpandedCategory(hasSubcategories ? category.href : null)}
            >
              <div className="flex items-center gap-3">
                <Link
                  href={category.href}
                  ref={index === 0 ? firstLinkRef : undefined}
                  onClick={() => {
                    // Discovery: "category nav clicks" (PROJECT.md §82). Wired
                    // here specifically (rather than, e.g., the homepage's
                    // CategoryShowcase, a Server Component) since this is
                    // already a client boundary — no new client-JS cost — and
                    // is PROJECT.md §73's primary mobile/full-screen category
                    // navigation surface. See DECISIONS.md D-055.
                    trackEvent('category_nav_click', {
                      category: category.label,
                      href: category.href,
                    });
                    onClose();
                  }}
                  data-cursor="OPEN"
                  // Explicit tabIndex, not left to the anchor's default: WebKit
                  // (desktop and iOS Safari) only includes links in the Tab
                  // sequence when the system-level "Full Keyboard Access"
                  // preference is on — off by default, so real Safari users (and
                  // Playwright's mobile-safari project, which mirrors this
                  // behavior) would silently skip every link here on Tab press,
                  // landing on <body> instead. An explicit tabIndex overrides
                  // that WebKit-specific default and keeps this dialog's
                  // hand-rolled focus trap (handleKeyDown above) actually
                  // reachable by keyboard on every engine.
                  tabIndex={0}
                  className="font-display text-display-l tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest"
                >
                  {category.label}
                </Link>
                {hasSubcategories && (
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={subcategoryListId}
                    aria-label={`${category.label} subcategories`}
                    onClick={() => {
                      // See lastClickedCategoryRef's own comment above:
                      // the decision to open vs. collapse is driven by
                      // the last *click*, not by whatever the hover
                      // preview already set expandedCategory to.
                      const shouldCollapse = lastClickedCategoryRef.current === category.href;
                      lastClickedCategoryRef.current = shouldCollapse ? null : category.href;
                      setExpandedCategory(shouldCollapse ? null : category.href);
                    }}
                    // Explicit tabIndex — same WebKit default-Tab-sequence
                    // quirk as the category Link above and FullScreenMenu's
                    // other interactive elements.
                    tabIndex={0}
                    // h-6 w-6 (24x24px) — WCAG 2.5.8's minimum touch-target
                    // size, the same bar this codebase just applied to
                    // QuickAddTrigger's hit box (commit b37a937).
                    className="flex h-6 w-6 shrink-0 items-center justify-center text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest"
                  >
                    <ChevronIcon expanded={isExpanded} />
                  </button>
                )}
              </div>
              {hasSubcategories && isExpanded && (
                // Conditionally mounted, not always-present-and-hidden —
                // see app/globals.css's .esque-submenu-reveal comment for
                // why (keeps collapsed subcategory links out of the
                // Tab-focus-trap's querySelectorAll results entirely,
                // rather than relying on visibility to hide a still-
                // present, still-tabbable link).
                <ul
                  id={subcategoryListId}
                  className="esque-submenu-reveal flex flex-wrap gap-x-6 gap-y-2 pl-1"
                >
                  {subcategories.map((subcategory) => (
                    <li key={subcategory.href}>
                      <Link
                        href={subcategory.href}
                        onClick={() => {
                          // Same taxonomy entry as the top-level category
                          // links above (category_nav_click) — see
                          // lib/analytics/events.ts; a subcategory link is
                          // the same kind of discovery event, just a level
                          // deeper.
                          trackEvent('category_nav_click', {
                            category: subcategory.label,
                            href: subcategory.href,
                          });
                          onClose();
                        }}
                        tabIndex={0}
                        // text-heading-3 — smaller than the top-level
                        // category's text-display-l, per DESIGN_SYSTEM.md
                        // §25's "secondary navigation remains smaller."
                        // `uppercase` is a presentational transform only:
                        // navigation-data.ts's labels stay Title Case in
                        // source (CONTENT.md §2 wants navigation rendered
                        // UPPERCASE, but nothing else in the codebase
                        // consumes these exact label strings expecting
                        // Title Case, so the source data has no reason to
                        // change). Same hover treatment as the top-level
                        // links and SearchOverlay.tsx's own CATEGORIES
                        // result group, which this list's markup mirrors.
                        className="font-display text-heading-3 uppercase tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest"
                      >
                        {subcategory.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

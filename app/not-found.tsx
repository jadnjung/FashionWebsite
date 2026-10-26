import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NOT_FOUND_DESCRIPTION,
  NOT_FOUND_HEADING,
  NOT_FOUND_HOME_LABEL,
  NOT_FOUND_TITLE,
} from '@/lib/content/not-found';

// Next.js already auto-injects <meta name="robots" content="noindex"> for
// any notFound()-triggered render (confirmed against current docs, and by
// this project's own curl verification — DECISIONS.md D-052) — this only
// adds a real, on-brand <title>/description instead of silently falling
// back to the root layout's generic "Esque" title. No canonical/openGraph:
// a 404 has no one real URL to canonicalize to (it renders at whatever bad
// URL was requested).
//
// Copy is imported from lib/content/not-found.ts, not inlined — proxy.ts's
// terminal 404 response for an unrecognized catalog subcategory (DECISIONS.md
// D-072) needs the exact same text and would otherwise be a second,
// hand-typed copy of it with no guard against drifting from this one.
export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
  description: NOT_FOUND_DESCRIPTION,
};

// CONTENT.md §6 — 404 copy is `THIS PIECE DOESN'T EXIST.`. Every category
// link (Header, FullScreenMenu) and footer link points to a real route, so
// this page is reachable only via direct/stale URL entry, not normal
// navigation.
//
// A truly-unmatched URL renders via Next.js's synthetic global not-found
// route, which only ever consults the ROOT app/not-found.tsx (verified
// against current Next.js internals — route-group-specific not-found files
// are never used for this case). The shell (Header/Footer/FullScreenMenu,
// via ShellClient) now renders in the root layout itself (DECISIONS.md
// D-074), so this page is wrapped by the real Header/Footer like any other
// route — the ESQUE-wordmark link below is a deliberate second, in-content
// way back home (CONTENT.md §6's own error-recovery expectation), not this
// page's only one anymore.
//
// Renders a <div>, not a <main>: ShellClient's own <main id="main-content">
// already wraps {children} (including this page) at the root layout level —
// a second nested <main> here would be invalid (HTML disallows nesting
// <main> landmarks) and would break tests/e2e/smoke.spec.ts's single-main-
// landmark assertion. Unlike error.tsx, not-found.tsx has no reset/error-
// boundary semantics, so it stays a Server Component — no client
// interactivity needed.
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-l tracking-display text-esque-text">
        {NOT_FOUND_HEADING}
      </h1>
      {/* WCAG 2.2 AA (2.5.8): measured at 50.1x19.5px — under the 24px
          minimum on the vertical axis. `py-2` grows the clickable box
          (Footer.tsx's established technique) without changing the
          visible text size. No compensating negative margin: this is a
          standalone link alone in a `flex flex-col items-center ... gap-4
          text-center` block with generous surrounding space.

          Also restores the focus-visible outline classes every other
          instance of this exact hand-styled-link pattern in this codebase
          carries (DECISIONS.md D-010 requires a visible focus indicator on
          every interactive element) — this link was missing them. */}
      <Link
        href="/"
        className="py-2 text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
      >
        {NOT_FOUND_HOME_LABEL}
      </Link>
    </div>
  );
}

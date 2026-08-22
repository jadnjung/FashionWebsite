import Link from 'next/link';

// CONTENT.md §6 — 404 copy is `THIS PIECE DOESN'T EXIST.`. Every category
// link (Header, FullScreenMenu) and footer link points to a route that
// doesn't exist yet in this shell-only pass, so this page is reachable from
// normal navigation, not just direct URL entry.
//
// A truly-unmatched URL renders via Next.js's synthetic global not-found
// route, which only ever consults the ROOT app/not-found.tsx (verified
// against current Next.js internals — route-group-specific not-found files
// are never used for this case). Since the shell (Header/Footer/
// FullScreenMenu) now lives in app/(storefront)/layout.tsx rather than the
// root layout (moved there so app/(access) can render without it — see this
// task's own description), this page no longer has Header/Footer to
// navigate back out through. The link below replaces that escape hatch,
// reusing the same "ESQUE" wordmark-as-home-link pattern Header already
// uses, rather than inventing new copy.
//
// Follows the same visual pattern as app/loading.tsx and app/error.tsx
// (dark background inherited from body, font-display, text-esque-text/
// text-display-l). Unlike error.tsx, not-found.tsx has no reset/error-
// boundary semantics, so it stays a Server Component — no client
// interactivity needed.
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-l tracking-display text-esque-text">
        THIS PIECE DOESN&apos;T EXIST.
      </h1>
      <Link
        href="/"
        className="text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline"
      >
        ESQUE
      </Link>
    </main>
  );
}

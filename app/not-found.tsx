// CONTENT.md §6 — 404 copy is `THIS PIECE DOESN'T EXIST.`. Every category
// link (Header, FullScreenMenu) and footer link points to a route that
// doesn't exist yet in this shell-only pass, so this page is reachable from
// normal navigation, not just direct URL entry. Follows the same visual
// pattern as app/loading.tsx and app/error.tsx (dark background inherited
// from body, font-display, text-esque-text/text-display-l). Unlike
// error.tsx, not-found.tsx has no reset/error-boundary semantics, so it
// stays a Server Component — no client interactivity needed.
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-display-l tracking-display text-esque-text">
        THIS PIECE DOESN&apos;T EXIST.
      </h1>
    </div>
  );
}

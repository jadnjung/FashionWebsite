import Link from 'next/link';
import { getUpcomingDrop } from '@/lib/home/upcoming-drop';

// DESIGN_SYSTEM.md §35, CONTENT.md §8 — the "COLLECTION 001" block below is
// real, verbatim copy, unchanged, with zero Shopify dependency of its own.
// The piece count (PROJECT.md §8's committed 6-piece launch catalog) stays
// static rather than live-queried from Shopify — with only one real
// collection in the catalog, a live count computed from the unscoped root
// products connection couldn't yet prove itself distinct from hardcoding
// (identical reasoning to DECISIONS.md D-030's PDP drop/collection-context
// deferral). Revisit once a real, collection-scoped product count is worth
// building against a second collection.
//
// Now `async` to add exactly one new, isolated Shopify read (DECISIONS.md
// D-033's established pattern, same as lib/home/selected-pieces.ts): when
// an upcoming drop exists, a second line links to it. Deliberately does
// NOT read cookies — the link always shows "coming [date]" regardless of
// the visitor's own unlock status; personalization happens on
// /collections/[handle] itself, not here. Reading cookies in an RSC would
// force dynamic rendering (D-033/D-044-046/D-055 Part 5a), which would
// regress the homepage's `○ (Static)` build classification — confirmed via
// `pnpm build`'s route table after this change.
export async function DropStatus() {
  const upcoming = await getUpcomingDrop();
  const dropDateLabel = upcoming
    ? new Date(upcoming.dropDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <section
      aria-label="Drop Status"
      className="flex min-h-[50svh] flex-col items-center justify-center gap-3 bg-esque-surface text-center"
    >
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        COLLECTION 001
      </p>
      <h2 className="font-display text-heading-1 uppercase tracking-display text-esque-text">
        06 PIECES
      </h2>
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        AVAILABLE UNTIL GONE
      </p>
      {upcoming && (
        <Link
          href={`/collections/${upcoming.handle}`}
          className="mt-4 text-utility uppercase tracking-metadata text-esque-text underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          {upcoming.title.toUpperCase()} — COMING {dropDateLabel} — EXPLORE COLLECTION →
        </Link>
      )}
    </section>
  );
}

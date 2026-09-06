// DESIGN_SYSTEM.md §35, CONTENT.md §8 — real, verbatim copy; zero Shopify
// dependency. The piece count (PROJECT.md §8's committed 6-piece launch
// catalog) is static rather than live-queried from Shopify — with only
// one real collection in the catalog, a live count computed from the
// unscoped root products connection couldn't yet prove itself distinct
// from hardcoding (identical reasoning to DECISIONS.md D-030's PDP
// drop/collection-context deferral). Revisit once a real, collection-
// scoped product count is worth building against a second collection.
export function DropStatus() {
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
    </section>
  );
}

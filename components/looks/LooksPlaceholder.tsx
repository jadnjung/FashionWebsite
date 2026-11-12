// Honest fallback for the homepage "Shop the Look" ring (DECISIONS.md
// D-091) when Shopify has no curated looks yet — or no store is configured
// — mirroring D-033's graceful-degradation precedent. Formerly the
// Interactive Model's placeholder (D-034); copy unchanged.
export function LooksPlaceholder() {
  return (
    <section
      aria-label="Shop the Look"
      className="flex min-h-[80svh] flex-col items-center justify-center gap-4 bg-esque-surface px-4 text-center"
    >
      {/* DESIGN_SYSTEM.md §29's own suggested copy for this scene. */}
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">LOOK 01</p>
      <div
        aria-hidden="true"
        className="flex aspect-[4/5] w-full max-w-sm items-center justify-center bg-esque-elevated"
      >
        {/* DESIGN_SYSTEM.md §65's own literal placeholder example for this
            asset type. text-esque-text-secondary, not text-esque-text-muted:
            this text is aria-hidden (screen readers don't need "this would
            be a photo" context) but still visually rendered to sighted
            users, and aria-hidden does not exempt visible text from WCAG
            1.4.3's contrast requirement — muted fails it at this size,
            secondary passes. See DECISIONS.md D-048. */}
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          ESQUE PLACEHOLDER — MODEL, FULL BODY
        </p>
      </div>
      <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        ARRIVING SOON.
      </h2>
    </section>
  );
}

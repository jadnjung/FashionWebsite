// DESIGN_SYSTEM.md §29-31, PROJECT.md §26-30 — Esque's signature
// Interactive Model. ROADMAP.md Phase 8 owns the real feature in full
// (silhouette hotspots, product info panel, mobile tap behavior, masked-
// luminance highlight motion, Shop the Look) as its own five-stage
// signature feature. This is a clearly-labeled placeholder slot only —
// reserving the scene's place in the homepage's scroll sequence without
// attempting any hotspot/interactivity work here. See DECISIONS.md D-032.
export function InteractiveModelPlaceholder() {
  return (
    <section
      aria-label="Interactive Model"
      className="flex min-h-[80svh] flex-col items-center justify-center gap-4 bg-esque-surface px-4 text-center"
    >
      {/* DESIGN_SYSTEM.md §29's own suggested copy for this scene. */}
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">LOOK 01</p>
      <div
        aria-hidden="true"
        className="flex aspect-[4/5] w-full max-w-sm items-center justify-center bg-esque-elevated"
      >
        {/* DESIGN_SYSTEM.md §65's own literal placeholder example for this
            asset type. */}
        <p className="text-utility uppercase tracking-metadata text-esque-text-muted">
          ESQUE PLACEHOLDER — MODEL, FULL BODY
        </p>
      </div>
      <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        ARRIVING SOON.
      </h2>
    </section>
  );
}

// DESIGN_SYSTEM.md §29-31, PROJECT.md §26-30 — Esque's signature
// Interactive Model. ROADMAP.md Phase 8's real feature (silhouette
// hotspots, product info panel, mobile tap behavior, Shop the Look) is
// InteractiveModelExperience.tsx; this placeholder is that feature's own
// honest fallback, rendered by InteractiveModel.tsx whenever Shopify
// hasn't resolved a real product for every hotspot region (unconfigured
// store, or a real store missing Tops/Bottoms products) — mirrors
// DECISIONS.md D-033's graceful-degradation precedent. Masked-luminance
// motion (Stage 4) and visual refinement (Stage 5) remain deferred either
// way — see DECISIONS.md D-034. Relocated from components/home/ as part of
// that phase (content unchanged — see DECISIONS.md D-034).
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

// Pure(ish) capability checks for motion-sensitive features (custom cursor,
// homepage parallax) — DESIGN_SYSTEM.md §22-23/§59, INTERACTIONS.md §17.
// Each function takes the browser API it needs as a parameter rather than
// reading `window`/`navigator` directly, so it stays testable in this
// project's Node-only vitest environment (no jsdom — see
// lib/product/variants.ts's header comment). Mirrors the injected-interface
// pattern lib/product/recently-viewed.ts already established for
// localStorage. Two real, concurrent consumers this same phase
// (CustomCursor, HeroParallax) justify extracting this now — not a
// speculative abstraction. See DECISIONS.md D-040/D-041.

type MatchMediaFn = (query: string) => { matches: boolean };

/**
 * DESIGN_SYSTEM §23 / INTERACTIONS §17 — governs whether ambient/decorative
 * motion (cursor follow, parallax) should run at all. Reduced-motion users
 * disable "cursor inertia" and "parallax" explicitly per INTERACTIONS §17,
 * so both features are gated on this, not just partially softened.
 */
export function prefersReducedMotion(matchMedia: MatchMediaFn): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * DESIGN_SYSTEM §23's "disable for touch" and INTERACTIONS §16's "reduce...
 * pointer-dependent effects" on mobile — true only for a device with a
 * real, precise, hover-capable pointer (mouse/trackpad). A single compound
 * query covers touchscreens and coarse/hybrid pointers alike, so no
 * separate touch-specific detection is needed.
 */
export function hasFinePointerAndHover(matchMedia: MatchMediaFn): boolean {
  return matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * DESIGN_SYSTEM §23's "disable for low-performance devices" — a best-effort,
 * honest heuristic, not a precise measurement. `hardwareConcurrency`
 * (logical CPU cores) is broadly supported; `deviceMemory` (Chromium-only,
 * rounded/capped for privacy) is used only when present. Thresholds are
 * conservative (<=2 cores, <=2GB reported memory) so ordinary mid-range
 * hardware (commonly 4+ cores) is never misclassified — a false negative
 * (an actually-weak device slipping through) is the accepted failure mode,
 * not a false positive on ordinary hardware. Returns false (never
 * "low-performance") when neither signal is available, rather than
 * guessing from absence of data.
 */
export function isLowPerformanceDevice(
  hardwareConcurrency: number | undefined,
  deviceMemory: number | undefined,
): boolean {
  if (typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 2) return true;
  if (typeof deviceMemory === 'number' && deviceMemory <= 2) return true;
  return false;
}

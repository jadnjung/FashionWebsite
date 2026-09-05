// Periodic large/standard visual rhythm for the product grid —
// DESIGN_SYSTEM.md §36-38's "unconventional...grid...may vary product
// presentation while maintaining alignment and rhythm" — implemented as a
// simple repeating pattern that works for any category size, not a fixed
// layout hand-tuned to exactly 6 products. The large editorial-image
// insert from DESIGN_SYSTEM's illustrative example sequence is
// deliberately not implemented here — see the design spec's Non-Goals (it
// needs real campaign photography that doesn't exist yet).

export type GridItemLayout = 'featured' | 'standard';

const FEATURED_INTERVAL = 3;

export function getGridItemLayout(index: number): GridItemLayout {
  return index % FEATURED_INTERVAL === 0 ? 'featured' : 'standard';
}

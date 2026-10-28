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

// `md`-tier (8-column) dead-half-row fix — a distinct issue from this
// file's own periodic rhythm, at a different tier and for a different
// mechanical reason than ProductGrid.tsx's already-documented/accepted
// `lg`-tier gap. The `lg` gap happens mid-sequence, when a 12-col row
// can't fit a featured (8) item alongside whatever came before it in the
// same row — a column-width-doesn't-divide-evenly problem, left as-is per
// that component's own non-dense-grid-flow reasoning.
//
// This is a different failure mode, only visible at `md`: at 8 columns, a
// featured item (md:col-span-8) always fills its own row alone, and a
// standard item (md:col-span-4) only fills a row when paired with exactly
// one other standard item (4 + 4 = 8). A complete featured/standard/
// standard triple is therefore always clean at `md` — the gap appears only
// when the array ends mid-pair: the trailing item is `standard`, is the
// very last item, AND is the *first* standard of what would have been a
// pair (`index % FEATURED_INTERVAL === 1`), leaving no second standard to
// fill the row's other half. When total count % 3 === 0, the trailing
// item is also `standard`, but it's the *second* of its pair
// (`index % FEATURED_INTERVAL === 2`) and already pairs fine with the
// standard before it — deliberately excluded here, since widening that
// case would push an already-correct row to 12/8 columns and overflow it.
// When total count % 3 === 1, the trailing item is `featured`, which
// always fills its own row regardless of position — never a gap, also
// excluded.
//
// Scoped to `md` only (not `lg`, where standard is col-span-4 of 12 and
// doesn't have this "exactly half" pairing requirement at all, and not the
// base/mobile tier, which has the identical arithmetic — see
// ProductGrid.tsx's own comment on why that's a known, separately-tracked,
// out-of-scope finding rather than fixed here too).
export function isUnpairedTrailingStandardAtMd(index: number, total: number): boolean {
  return (
    getGridItemLayout(index) === 'standard' &&
    index === total - 1 &&
    index % FEATURED_INTERVAL === 1
  );
}

import { ProductCard } from '@/components/catalog/ProductCard';
import { getGridItemLayout, type GridItemLayout } from '@/lib/catalog/grid-layout';
import type { ProductListItem } from '@/lib/shopify/products';

const LAYOUT_CLASSES: Record<GridItemLayout, string> = {
  featured: 'col-span-4 md:col-span-8 lg:col-span-8',
  standard: 'col-span-2 md:col-span-4 lg:col-span-4',
};

// DESIGN_SYSTEM.md §15/§36-38 — 12/8/4-column responsive grid (the first
// real implementation of that scale; previously conceptual per
// ROADMAP.md Phase 1) with a periodic large/standard rhythm rather than a
// uniform ecommerce grid. Plain (non-dense) grid-auto-flow: an occasional
// unfilled cell when a featured item doesn't fit a row's remaining width
// is an acceptable, minor cosmetic gap — `grid-flow-dense` was considered
// and deliberately rejected: dense packing can visually reorder a later,
// smaller item ahead of an earlier, larger one whenever it backfills a
// gap, so a sighted keyboard/screen-reader user's tab order would stop
// matching the visual reading order (WCAG 1.3.2/2.4.3) — confirmed
// reachable in this exact pattern (a 12-col row of one 8-col "featured"
// item plus one 4-col "standard" item, repeating every 3 items, produces
// exactly this backfill at the 3rd repetition). CLAUDE.md is explicit that
// accessibility isn't traded for visual polish. See the design spec's
// Non-Goals for why the grid also doesn't include the editorial-image
// insert from DESIGN_SYSTEM's illustrative example sequence.
export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8">
      {products.map((product, index) => {
        const layout = getGridItemLayout(index);
        return (
          <div key={product.id} className={LAYOUT_CLASSES[layout]}>
            <ProductCard product={product} layout={layout} />
          </div>
        );
      })}
    </div>
  );
}

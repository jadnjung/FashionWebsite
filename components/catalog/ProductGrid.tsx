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
// uniform ecommerce grid. `grid-flow-dense` lets a later standard item
// backfill a gap a featured item leaves when it doesn't fit the remaining
// row width, keeping the grid tightly packed at any product count without
// a hand-tuned layout — dense packing only changes visual position, never
// DOM/tab order, so keyboard and screen-reader navigation stays in the
// grid's real (server-rendered) order. See the design spec's Non-Goals for
// why this doesn't include the editorial-image insert from DESIGN_SYSTEM's
// illustrative example sequence.
export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-flow-dense grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8">
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

import Image from 'next/image';
import Link from 'next/link';
import type { GridItemLayout } from '@/lib/catalog/grid-layout';
import type { ProductListItem } from '@/lib/shopify/products';

// Featured cards render at roughly two-thirds of the viewport on desktop
// (paired with one standard card per row, per DESIGN_SYSTEM.md §38's "1
// large + 1 medium" composition) and full width below that; standard cards
// render at roughly half on mobile/tablet and a third on desktop. Sizing
// `sizes` per layout — rather than one flat value for every card,
// regardless of how large it actually renders — keeps next/image selecting
// a resolution that matches each card's real width. A flat "33vw always"
// hint would under-request the grid's largest, most visually important
// images and let them render soft.
const IMAGE_SIZES: Record<GridItemLayout, string> = {
  featured: '(min-width: 1024px) 67vw, 100vw',
  standard: '(min-width: 1024px) 33vw, 50vw',
};

interface ProductCardProps {
  product: ProductListItem;
  layout: GridItemLayout;
}

// DESIGN_SYSTEM.md §39 — default: image + name, no price. Hover: crossfade
// to a 2nd photograph via pure CSS (group/group-hover opacity) — matches
// D-013's "cheapest motion tier that satisfies the need" and keeps this a
// Server Component; no client JS is needed for the hover effect. Quick Add
// (§40) and the custom-cursor VIEW label (§39/§18) are out of scope this
// pass — see the design spec's Non-Goals.
//
// PROJECT.md §40 / CONTENT.md §8: sold-out products stay visible with a
// SOLD OUT badge, independent of the Availability filter's state — this
// checks the product's own `availableForSale`, never the filter.
export function ProductCard({ product, layout }: ProductCardProps) {
  const [primary, secondary] = product.images;

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.altText ?? product.title}
            fill
            sizes={IMAGE_SIZES[layout]}
            className="object-cover"
          />
        )}
        {secondary && (
          // Decorative/redundant with the primary image — alt="" +
          // aria-hidden keeps it out of the accessible name entirely rather
          // than duplicating the product title a second time.
          <Image
            src={secondary.url}
            alt=""
            aria-hidden="true"
            fill
            sizes={IMAGE_SIZES[layout]}
            className="object-cover opacity-0 transition-opacity duration-200 ease-esque group-hover:opacity-100"
          />
        )}
        {!product.availableForSale && (
          <span className="absolute left-3 top-3 bg-esque-black px-2 py-1 text-metadata tracking-metadata text-esque-text">
            SOLD OUT
          </span>
        )}
      </div>
      <p className="text-product-name text-esque-text">{product.title}</p>
    </Link>
  );
}

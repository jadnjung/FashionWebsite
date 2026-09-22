import Image from 'next/image';
import type { ProductSummary } from '@/lib/shopify/products';

interface ArchivedProductTileProps {
  product: ProductSummary;
}

// A deliberate, explicit variant component — not a boolean flag on
// ProductCard (vercel-composition-patterns' explicit-variants guidance).
// An archived tile differs from ProductCard in two real dimensions: the
// label (UNAVAILABLE, in a different position/role than ProductCard's
// SOLD OUT badge — see below) and the link target (there is no honest
// destination: linking to /products/[handle] would imply the piece can
// still be bought). This component is therefore not interactive at all —
// no <Link>, no data-cursor, no click handler of any kind.
//
// Purchasability here is a property of the collection's archived status,
// never of this product's own inventory (which this view doesn't even
// fetch) — see docs/superpowers/specs/2026-09-23-archive-design.md's
// "The UNAVAILABLE divergence" section. The UNAVAILABLE paragraph reuses
// ProductPurchasePanel's exact sold-out-paragraph classNames (the closer,
// more literal match to PROJECT.md §41's "purchasing controls are
// replaced with: UNAVAILABLE" than ProductCard's image-corner SOLD OUT
// badge, which is a supplementary indicator shown alongside otherwise-
// normal purchase controls elsewhere on the page, not a replacement for
// them). Image-container/title classNames are reused from ProductCard for
// visual consistency — deliberate duplication, not a shared abstraction
// neither component actually needs.
export function ArchivedProductTile({ product }: ArchivedProductTileProps) {
  return (
    <article className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.altText ?? product.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <p className="text-product-name text-esque-text">{product.title}</p>
      {product.description && (
        <p className="text-body text-esque-text-secondary">{product.description}</p>
      )}
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        UNAVAILABLE
      </p>
    </article>
  );
}

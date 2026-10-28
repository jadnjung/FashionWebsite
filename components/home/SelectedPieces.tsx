import { ProductCard } from '@/components/catalog/ProductCard';
import type { ProductListItem } from '@/lib/shopify/products';

interface SelectedPiecesProps {
  products: ProductListItem[];
}

// DESIGN_SYSTEM.md §33 — an unconventional, curated composition (one large
// piece + up to two smaller pieces), not the catalog's periodic browsing
// grid (components/catalog/ProductGrid) — a different visual language for
// a different job: a curated homepage moment, not a paginated listing.
//
// Reuses ProductCard as-is: its image+name/no-price/hover-crossfade/
// SOLD-OUT-badge behavior already matches DESIGN_SYSTEM.md §37/§39's
// "Prices hidden until product interaction" exactly, and its graceful
// "no image -> solid surface-color block" fallback already IS this
// scene's honest placeholder-photography treatment (PROJECT.md §101 — no
// real campaign photography exists yet) at zero new code.
//
// Layout: single column below `lg` (every card full width — matching
// ProductDetail's own established "single column below lg" precedent),
// splitting to an 8+4-column composition at `lg` and up. The large card's
// width exactly matches ProductGrid's own "featured" assumption (100vw
// below lg, 67% at lg+), so it needs no sizes override; the smaller
// cards' mobile width (100vw, stacked full-width) does NOT match
// "standard"'s existing 50vw mobile assumption (built for ProductGrid's
// 2-up mobile rhythm), so they pass an accurate override rather than let
// next/image under-request resolution and visibly soften the image.
//
// Single-product composition: with no `rest` to pair against, the 8/4
// split has nothing to split against either — the large card widens to
// the full 12 columns at `lg` (base/`md` are already full-width in both
// cases, since nothing else renders alongside it there regardless), so it
// doesn't leave a third of the row empty. Its own `sizes` override follows
// the same reasoning as `rest`'s override above: at 12/12 columns the card
// really is 100vw at every tier, not the normal featured card's 67vw at
// `lg`+, so IMAGE_SIZES.featured's default would under-request resolution
// here too.
//
// Renders nothing when there are no products — see DECISIONS.md D-033.
export function SelectedPieces({ products }: SelectedPiecesProps) {
  if (products.length === 0) return null;
  const [large, ...rest] = products;
  const isSingleProduct = rest.length === 0;

  return (
    <section
      aria-labelledby="selected-pieces-heading"
      className="flex flex-col gap-6 px-4 py-16 md:px-8"
    >
      <h2
        id="selected-pieces-heading"
        className="font-display text-heading-3 uppercase tracking-display text-esque-text"
      >
        Selected Pieces
      </h2>
      <div className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8">
        <div
          className={
            isSingleProduct
              ? 'col-span-4 md:col-span-8 lg:col-span-12'
              : 'col-span-4 md:col-span-8 lg:col-span-8'
          }
        >
          <ProductCard
            product={large}
            layout="featured"
            sizes={isSingleProduct ? '100vw' : undefined}
          />
        </div>
        {rest.length > 0 && (
          <div className="col-span-4 flex flex-col gap-6 md:col-span-8 lg:col-span-4 lg:gap-8">
            {rest.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout="standard"
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

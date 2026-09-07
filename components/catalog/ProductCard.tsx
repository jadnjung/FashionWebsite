/// <reference types="react/experimental" />
// Activates react/experimental's ambient types (ViewTransition isn't in
// @types/react's default index.d.ts) for the whole program — only needs to
// appear once anywhere, kept here for discoverability at the point of use.
// A triple-slash directive, not `import {} from 'react/experimental'`: the
// latter compiles to a real runtime import statement (TypeScript does not
// elide a bare, non-`type`-qualified import just because it has zero named
// bindings), and Turbopack then fails the build trying to resolve
// 'react/experimental' as an actual module — it isn't one; it only exists
// as a virtual path for `@types/react`'s type declarations. A triple-slash
// reference is a pure compiler directive that every tool (tsc, SWC, Babel)
// strips unconditionally, never emitted as code. Confirmed directly: the
// `import {}` form failed `pnpm build` with "Module not found: Can't
// resolve 'react/experimental'" before this fix. A global tsconfig "types"
// array was also considered and rejected: it would stop TypeScript
// auto-including every other @types/* package. See DECISIONS.md D-038.
import Image from 'next/image';
import Link from 'next/link';
import { ViewTransition } from 'react';
import type { GridItemLayout } from '@/lib/catalog/grid-layout';
import { getProductViewTransitionName } from '@/lib/product/view-transition';
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
  // Optional override for next/image's `sizes` hint. IMAGE_SIZES[layout]
  // assumes ProductGrid's own periodic column widths; a caller whose card
  // renders at different real widths (e.g. SelectedPieces' curated
  // 2-column composition) passes its own accurate hint here instead of
  // forcing a mismatched fit onto `layout` — which still governs nothing
  // else (SOLD OUT badge, hover crossfade, focus ring are unaffected).
  sizes?: string;
  // Opt-in, default false — DECISIONS.md D-038. A real, concrete naming
  // collision exists between the homepage's SelectedPieces and the
  // Interactive Model (both independently resolvable to the same product
  // from Collection 001's small catalog), so ProductCard never enables the
  // shared-element transition on its own. Only ProductGrid (category pages
  // and the PDP's own Related Products — single-query, no-duplicate-handle,
  // never co-rendered with the Interactive Model) passes this through.
  enableSharedTransition?: boolean;
}

// DESIGN_SYSTEM.md §39 — default: image + name, no price. Hover: crossfade
// to a 2nd photograph via pure CSS (group/group-hover opacity) — matches
// D-013's "cheapest motion tier that satisfies the need" and keeps this a
// Server Component; no client JS is needed for the hover effect. Quick Add
// (§40) is out of scope this pass — see the design spec's Non-Goals.
// data-cursor="VIEW" (§39/§18) is wired to the custom cursor — DECISIONS.md
// D-040.
//
// PROJECT.md §40 / CONTENT.md §8: sold-out products stay visible with a
// SOLD OUT badge, independent of the Availability filter's state — this
// checks the product's own `availableForSale`, never the filter.
export function ProductCard({
  product,
  layout,
  sizes,
  enableSharedTransition = false,
}: ProductCardProps) {
  const [primary, secondary] = product.images;
  const sizesAttr = sizes ?? IMAGE_SIZES[layout];

  // The whole image container (not just the <Image> itself) is the shared-
  // element target — DECISIONS.md D-038: it renders unconditionally
  // regardless of whether a real photo exists yet (PROJECT.md §101), so
  // wrapping it gives an honest, always-present transition target today (a
  // plain color block growing from grid-cell to PDP-hero size/position)
  // that will automatically look richer once real photography exists.
  const imageContainer = (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
      {primary && (
        <Image
          src={primary.url}
          alt={primary.altText ?? product.title}
          fill
          sizes={sizesAttr}
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
          sizes={sizesAttr}
          className="object-cover opacity-0 transition-opacity duration-200 ease-esque group-hover:opacity-100"
        />
      )}
      {!product.availableForSale && (
        <span className="absolute left-3 top-3 bg-esque-black px-2 py-1 text-metadata tracking-metadata text-esque-text">
          SOLD OUT
        </span>
      )}
    </div>
  );

  return (
    <Link
      href={`/products/${product.handle}`}
      data-cursor="VIEW"
      className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
    >
      {enableSharedTransition ? (
        <ViewTransition
          name={getProductViewTransitionName(product.handle)}
          share="morph"
          default="none"
        >
          {imageContainer}
        </ViewTransition>
      ) : (
        imageContainer
      )}
      <p className="text-product-name text-esque-text">{product.title}</p>
    </Link>
  );
}

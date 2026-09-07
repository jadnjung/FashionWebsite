/// <reference types="react/experimental" />
// Activates react/experimental's ambient ViewTransition types — see
// ProductCard.tsx for the full explanation of why this is a triple-slash
// directive, not `import {} from 'react/experimental'` (the latter fails
// `pnpm build`: it isn't a real module). DECISIONS.md D-038.
import Image from 'next/image';
import { ViewTransition } from 'react';
import { getProductViewTransitionName } from '@/lib/product/view-transition';
import type { ProductImage } from '@/lib/shopify/products';

interface ProductGalleryProps {
  images: ProductImage[];
  productTitle: string;
  // Used only to build the shared-element transition name (DECISIONS.md
  // D-038) pairing this PDP's first image with the grid ProductCard/
  // Interactive Model hotspot the visitor navigated from. Not rendered.
  handle: string;
}

// DESIGN_SYSTEM.md §42-44 — the left, ~60% media column: a vertical stack
// of real product images. No zoom/lightbox this pass — see the design
// spec's Non-Goals (not in ROADMAP.md Phase 5's own checklist). The first
// image gets `priority` — it's the PDP's LCP element, and (DECISIONS.md
// D-038) also the shared-element transition's destination, paired by name
// with ProductCard/SilhouetteIllustration's own use of the same handle.
export function ProductGallery({ images, productTitle, handle }: ProductGalleryProps) {
  const transitionName = getProductViewTransitionName(handle);

  if (images.length === 0) {
    return (
      <ViewTransition name={transitionName} share="morph" default="none">
        <div className="aspect-[4/5] w-full bg-esque-surface" aria-hidden="true" />
      </ViewTransition>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {images.map((image, index) => {
        const media = (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
            <Image
              src={image.url}
              alt={image.altText ?? productTitle}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        );

        // Only the first image is the shared-element transition's
        // destination (DECISIONS.md D-038) — ViewTransition introduces no
        // DOM node of its own, so this stays a direct flex child exactly
        // like every other image, just like <Fragment>/<Suspense>.
        return index === 0 ? (
          <ViewTransition key={image.url} name={transitionName} share="morph" default="none">
            {media}
          </ViewTransition>
        ) : (
          // `contents` (zero layout-box impact, same technique as
          // HeroParallax.tsx) exists purely to carry `key` — `media` itself
          // isn't a standalone element instance here, so `key` can't be
          // spliced onto it directly without this wrapper or a
          // cloneElement call.
          <div key={image.url} className="contents">
            {media}
          </div>
        );
      })}
    </div>
  );
}

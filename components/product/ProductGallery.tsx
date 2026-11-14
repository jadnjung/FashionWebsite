/// <reference types="react/experimental" />
// Activates react/experimental's ambient ViewTransition types — see
// ProductCard.tsx for the full explanation of why this is a triple-slash
// directive, not `import {} from 'react/experimental'` (the latter fails
// `pnpm build`: it isn't a real module). DECISIONS.md D-038.
import Image from 'next/image';
import { ViewTransition } from 'react';
import { getProductViewTransitionName } from '@/lib/product/view-transition';
import type { ProductImage } from '@/lib/shopify/products';
import { ProductGalleryControls } from './ProductGalleryControls';

interface ProductGalleryProps {
  images: ProductImage[];
  productTitle: string;
  // Used only to build the shared-element transition name (DECISIONS.md
  // D-038) pairing this PDP's first image with the grid ProductCard/
  // Interactive Model hotspot the visitor navigated from. Not rendered.
  handle: string;
}

// Keep the image stack and first-image transition server-owned. The client
// wrapper enhances these links with navigation and a viewer. Original-image
// destinations and the full image stack are included in the server response.
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
    <ProductGalleryControls images={images} productTitle={productTitle}>
      <div className="flex flex-col gap-4">
        {images.map((image, index) => {
          const media = (
            <div
              data-gallery-item={index}
              className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface [touch-action:pan-y_pinch-zoom]"
            >
              <Image
                src={image.url}
                alt={image.altText ?? productTitle}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
                priority={index === 0}
              />
              <a
                href={image.url}
                data-gallery-image={index}
                aria-label={`Enlarge ${productTitle}, image ${index + 1} of ${images.length}`}
                className="absolute inset-0 flex cursor-zoom-in items-end justify-end p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-esque-text"
              >
                <span className="bg-esque-black/90 px-3 py-2 text-utility text-esque-text">
                  Enlarge image
                </span>
              </a>
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
            // the former HeroParallax.tsx) exists purely to carry `key` — `media` itself
            // isn't a standalone element instance here, so `key` can't be
            // spliced onto it directly without this wrapper or a
            // cloneElement call.
            <div key={image.url} className="contents">
              {media}
            </div>
          );
        })}
      </div>
    </ProductGalleryControls>
  );
}

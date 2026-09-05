import Image from 'next/image';
import type { ProductImage } from '@/lib/shopify/products';

interface ProductGalleryProps {
  images: ProductImage[];
  productTitle: string;
}

// DESIGN_SYSTEM.md §42-44 — the left, ~60% media column: a vertical stack
// of real product images. No zoom/lightbox this pass — see the design
// spec's Non-Goals (not in ROADMAP.md Phase 5's own checklist). The first
// image gets `priority` — it's the PDP's LCP element.
export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full bg-esque-surface" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {images.map((image, index) => (
        <div
          key={image.url}
          className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface"
        >
          <Image
            src={image.url}
            alt={image.altText ?? productTitle}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}

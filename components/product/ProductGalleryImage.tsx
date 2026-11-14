'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ProductImage } from '@/lib/shopify/products';

interface ProductGalleryImageProps {
  image: ProductImage;
  productTitle: string;
  zoomed: boolean;
  onRetry: () => void;
}

// The viewer keys this component by its image. Loading/error state resets on
// navigation and reopening, and late load events stay with the old instance.
export function ProductGalleryImage({
  image,
  productTitle,
  zoomed,
  onRetry,
}: ProductGalleryImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="relative h-full min-h-full">
      <Image
        key={attempt}
        src={image.url}
        alt={image.altText ?? productTitle}
        width={image.width ?? 1600}
        height={image.height ?? 2000}
        sizes={zoomed ? '200vw' : '100vw'}
        draggable={false}
        aria-busy={status === 'loading'}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={zoomed ? 'block h-auto max-w-none' : 'h-full w-full object-contain'}
        style={zoomed ? { width: `max(200vw, ${image.width ?? 1600}px)` } : undefined}
      />
      {status === 'loading' && (
        <p
          aria-live="polite"
          className="absolute top-4 left-4 bg-esque-black/95 px-3 py-2 text-utility text-esque-text-secondary"
        >
          Loading image…
        </p>
      )}
      {status === 'error' && (
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-4 bg-esque-black/95 p-4">
          <p role="alert" className="text-body text-esque-text">
            This image could not load. Try again.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setStatus('loading');
              setAttempt((current) => current + 1);
              onRetry();
            }}
          >
            Retry image
          </Button>
        </div>
      )}
    </div>
  );
}

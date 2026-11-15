'use client';

import NextImage, { type ImageProps } from 'next/image';
import { useState } from 'react';

type ProductImageProps = Omit<ImageProps, 'onLoad' | 'onError'> & {
  fallbackTitle: string;
};

/** A small enhancement around the server-rendered responsive image. Its parent
 * owns the aspect ratio and destination. A failed request stays failed until
 * the source changes, avoiding background retry loops. */
export function ProductImage({ fallbackTitle, ...props }: ProductImageProps) {
  const sourceKey =
    typeof props.src === 'string'
      ? props.src
      : 'default' in props.src
        ? props.src.default.src
        : props.src.src;
  return <ProductImageRequest key={sourceKey} {...props} fallbackTitle={fallbackTitle} />;
}

function ProductImageRequest({ fallbackTitle, ...props }: ProductImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <>
      <NextImage
        {...props}
        aria-busy={status === 'loading'}
        aria-hidden={status === 'error' ? true : undefined}
        style={{
          ...props.style,
          visibility: status === 'error' ? 'hidden' : props.style?.visibility,
        }}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      {status === 'error' && props['aria-hidden'] !== true && props['aria-hidden'] !== 'true' && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-esque-surface p-3 text-center text-utility text-esque-text-secondary"
          aria-live="polite"
        >
          <span className="max-w-full [overflow-wrap:anywhere]">{fallbackTitle}</span>
          <span>Image unavailable.</span>
        </div>
      )}
    </>
  );
}

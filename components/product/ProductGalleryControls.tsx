'use client';

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';
import { Button } from '@/components/ui/Button';
import type { ProductImage } from '@/lib/shopify/products';
import { ProductGalleryImage } from './ProductGalleryImage';

interface ProductGalleryControlsProps {
  images: ProductImage[];
  productTitle: string;
  children: ReactNode;
}

interface SwipeStart {
  x: number;
  y: number;
  time: number;
  index: number;
}

export function ProductGalleryControls({
  images,
  productTitle,
  children,
}: ProductGalleryControlsProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageViewportRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const swipeRef = useRef<SwipeStart | null>(null);
  const suppressClickUntilRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const viewerOpen = viewerIndex !== null;
  const viewerImage = viewerIndex === null ? null : images[viewerIndex];

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || !('IntersectionObserver' in window)) return;
    const items = Array.from(gallery.querySelectorAll<HTMLElement>('[data-gallery-item]'));
    const observer = new IntersectionObserver(
      () => {
        const center = window.innerHeight / 2;
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        items.forEach((item, index) => {
          const bounds = item.getBoundingClientRect();
          const distance = Math.abs((bounds.top + bounds.bottom) / 2 - center);
          if (distance < nearestDistance) {
            nearestIndex = index;
            nearestDistance = distance;
          }
        });
        setActiveIndex(nearestIndex);
      },
      { rootMargin: '-15% 0px -35% 0px' },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!viewerOpen || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [viewerOpen]);

  function wrapIndex(index: number) {
    return (index + images.length) % images.length;
  }

  function navigateGallery(index: number, moveFocus = false) {
    const nextIndex = wrapIndex(index);
    setActiveIndex(nextIndex);
    const item = galleryRef.current?.querySelector<HTMLElement>(
      `[data-gallery-item="${nextIndex}"]`,
    );
    // Immediate scrolling also respects reduced-motion preferences and keeps
    // the selected image, focused link and announced position in sync.
    item?.scrollIntoView({ block: 'center', behavior: 'instant' });
    if (moveFocus) {
      item?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    }
  }

  function navigateViewer(index: number) {
    setViewerIndex(wrapIndex(index));
    setZoomed(false);
    imageViewportRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  function closeViewer() {
    dialogRef.current?.close();
  }

  function handleImageClick(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-gallery-image]');
    if (
      !link ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      typeof dialogRef.current?.showModal !== 'function'
    ) {
      return;
    }
    event.preventDefault();
    if (performance.now() < suppressClickUntilRef.current) return;
    triggerRef.current = link;
    setViewerIndex(Number(link.dataset.galleryImage));
    setZoomed(false);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>, index: number) {
    swipeRef.current = null;
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    swipeRef.current = { x: touch.clientX, y: touch.clientY, time: performance.now(), index };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>, inViewer = false) {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || event.touches.length !== 0 || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (
      Math.abs(deltaX) < 50 ||
      Math.abs(deltaX) < Math.abs(deltaY) * 1.5 ||
      performance.now() - start.time > 700
    ) {
      return;
    }
    suppressClickUntilRef.current = performance.now() + 400;
    const nextIndex = start.index + (deltaX < 0 ? 1 : -1);
    if (inViewer) navigateViewer(nextIndex);
    else navigateGallery(nextIndex);
  }

  return (
    <div ref={galleryRef} role="region" aria-label={`${productTitle} images`}>
      {images.length > 1 && (
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-2 bg-esque-black/95 py-2">
          <Button
            variant="editorial"
            aria-label="Previous image"
            className="min-h-11 px-3 text-utility"
            onClick={() => navigateGallery(activeIndex - 1)}
          >
            ← PREV
          </Button>
          <p role="status" aria-atomic="true" className="text-utility text-esque-text-secondary">
            Image {activeIndex + 1} of {images.length}
          </p>
          <Button
            variant="editorial"
            aria-label="Next image"
            className="min-h-11 px-3 text-utility"
            onClick={() => navigateGallery(activeIndex + 1)}
          >
            NEXT →
          </Button>
        </div>
      )}
      <div
        onClick={handleImageClick}
        onKeyDown={(event) => {
          const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
            '[data-gallery-image]',
          );
          if (!link || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          const index = Number(link.dataset.galleryImage);
          navigateGallery(index + (event.key === 'ArrowRight' ? 1 : -1), true);
        }}
        onTouchStart={(event) => {
          const item = (event.target as HTMLElement).closest<HTMLElement>('[data-gallery-item]');
          if (item) handleTouchStart(event, Number(item.dataset.galleryItem));
        }}
        onTouchEnd={(event) => handleTouchEnd(event)}
        onTouchCancel={() => {
          swipeRef.current = null;
        }}
      >
        {children}
      </div>
      <dialog
        ref={dialogRef}
        aria-label={`${productTitle} image viewer`}
        onClose={() => {
          setViewerIndex(null);
          setZoomed(false);
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          if (zoomed || viewerIndex === null || !['ArrowLeft', 'ArrowRight'].includes(event.key))
            return;
          event.preventDefault();
          navigateViewer(viewerIndex + (event.key === 'ArrowRight' ? 1 : -1));
        }}
        className="fixed inset-0 m-0 h-dvh max-h-dvh w-screen max-w-full overflow-hidden border-0 bg-esque-black p-4 text-esque-text backdrop:bg-esque-black md:p-6"
      >
        {viewerImage && viewerIndex !== null && (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                role="status"
                aria-atomic="true"
                className="text-utility text-esque-text-secondary"
              >
                Image {viewerIndex + 1} of {images.length}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                  aria-pressed={zoomed}
                  className="min-h-11 px-3 text-utility"
                  onClick={() => {
                    setZoomed(!zoomed);
                    imageViewportRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                >
                  {zoomed ? 'ZOOM OUT' : 'ZOOM IN'}
                </Button>
                <Button
                  variant="secondary"
                  aria-label="Close image viewer"
                  className="min-h-11 px-3 text-utility"
                  onClick={closeViewer}
                >
                  CLOSE
                </Button>
              </div>
            </div>
            <div
              ref={imageViewportRef}
              role="region"
              aria-label="Product image"
              tabIndex={0}
              className={`min-h-0 flex-1 overflow-auto bg-esque-surface focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-esque-text ${zoomed ? 'touch-auto' : '[touch-action:pan-y_pinch-zoom]'}`}
              onTouchStart={(event) => {
                if (!zoomed) handleTouchStart(event, viewerIndex);
              }}
              onTouchEnd={(event) => {
                if (!zoomed) handleTouchEnd(event, true);
              }}
              onTouchCancel={() => {
                swipeRef.current = null;
              }}
            >
              <ProductGalleryImage
                key={`${viewerIndex}:${viewerImage.url}`}
                image={viewerImage}
                productTitle={productTitle}
                zoomed={zoomed}
                onRetry={() => imageViewportRef.current?.focus({ preventScroll: true })}
              />
            </div>
            <div className="flex min-h-11 items-center justify-between gap-3">
              <Button
                variant="editorial"
                aria-label="Previous image"
                disabled={images.length < 2}
                className="min-h-11 px-3 text-utility"
                onClick={() => navigateViewer(viewerIndex - 1)}
              >
                ← PREV
              </Button>
              {zoomed && (
                <p className="text-center text-utility text-esque-text-secondary">
                  Scroll to inspect details.
                </p>
              )}
              <Button
                variant="editorial"
                aria-label="Next image"
                disabled={images.length < 2}
                className="min-h-11 px-3 text-utility"
                onClick={() => navigateViewer(viewerIndex + 1)}
              >
                NEXT →
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

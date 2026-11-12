import Link from 'next/link';
import { formatPrice } from '@/lib/product/price';
import type { ClosetProduct } from '@/lib/shopify/products';

interface ClosetInfoPanelProps {
  product: ClosetProduct | null;
  onClose: () => void;
}

/**
 * Details for the garment pulled off the rod (DECISIONS.md D-089): beside
 * it on wide screens, below it on narrow ones. Always mounted so its
 * polite live region announces each newly focused piece — the same
 * pattern as the Interactive Model's panel (DECISIONS.md D-049).
 */
export function ClosetInfoPanel({ product, onClose }: ClosetInfoPanelProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      data-closet-panel
      className={`absolute inset-x-4 bottom-6 z-20 transition-opacity duration-300 ease-esque md:inset-x-8 lg:inset-x-auto lg:bottom-auto lg:right-12 lg:top-1/2 lg:w-[22rem] lg:-translate-y-1/2 ${
        product ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {product && (
        <div className="flex flex-col gap-3 bg-esque-black/80 p-5 backdrop-blur-sm lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            {product.productType}
          </p>
          <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
            {product.title}
          </h2>
          <p className="text-body text-esque-text">{formatPrice(product.minPrice)}</p>
          {product.description && (
            <p className="line-clamp-3 max-w-sm text-body text-esque-text-secondary">
              {product.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link
              href={`/products/${product.handle}`}
              className="py-2 text-utility uppercase tracking-nav text-esque-text underline-offset-4 transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
            >
              VIEW PRODUCT
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="py-2 text-utility uppercase tracking-nav text-esque-text-secondary transition-colors duration-200 ease-esque hover:text-esque-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { ProductGrid } from '@/components/catalog/ProductGrid';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import type { ProductDetail as ProductDetailData, ProductListItem } from '@/lib/shopify/products';

interface ProductDetailProps {
  product: ProductDetailData;
  relatedProducts: ProductListItem[];
}

// DESIGN_SYSTEM.md §42-44 — 60/40 desktop layout (gallery ~58% / purchase
// panel ~42% on the existing 12-column grid, per §15's "based on the grid
// internally" allowance), single column below `lg`. See the design spec's
// Layout section for the exact split and sticky-panel reasoning.
export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  return (
    <div className="flex flex-col gap-16 px-4 py-8 md:px-8 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} productTitle={product.title} />
        </div>
        <div className="lg:col-span-5">
          <ProductPurchasePanel
            title={product.title}
            minPrice={product.minPrice}
            options={product.options}
            variants={product.variants}
          >
            {product.description && (
              <p className="text-body text-esque-text-secondary">{product.description}</p>
            )}
          </ProductPurchasePanel>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section aria-label={`More ${product.productType}`} className="flex flex-col gap-6">
          <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
            More {product.productType}
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}

      <RecentlyViewed
        handle={product.handle}
        title={product.title}
        imageUrl={product.images[0]?.url ?? null}
        imageAlt={product.images[0]?.altText ?? null}
        priceAmount={product.minPrice.amount}
        priceCurrency={product.minPrice.currencyCode}
      />
    </div>
  );
}

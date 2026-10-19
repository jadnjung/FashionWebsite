import { ProductGrid } from '@/components/catalog/ProductGrid';
import type { CollectionDetail } from '@/lib/shopify/collections';
import type { ProductListItem } from '@/lib/shopify/products';

interface CollectionViewProps {
  collection: CollectionDetail;
  products: ProductListItem[];
}

// The unlocked/current state — real, interactive products, unlike
// ArchivedCollectionView's inert ArchivedProductTile grid: these are live,
// purchasable products (real <Link>s to real /products/[handle] PDPs), so
// the ordinary ProductGrid/ProductCard is the correct component. Mirrors
// ArchivedCollectionView's overall shape (heading, optional description,
// grid, empty state) — this is this feature's own "foundation only" pass
// (design spec's Non-Goals): a plain, functional product grid, not the
// full PROJECT.md §35 editorial collection-page experience.
export function CollectionView({ collection, products }: CollectionViewProps) {
  return (
    <div className="flex flex-col gap-8 px-4 py-12 md:px-8">
      <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
        {collection.title}
      </h1>
      {collection.description && (
        <p className="max-w-2xl text-body text-esque-text-secondary">{collection.description}</p>
      )}
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="font-display text-heading-3 uppercase text-esque-text">NOTHING HERE YET.</p>
        </div>
      ) : (
        <ProductGrid products={products} priorityFirstImage />
      )}
    </div>
  );
}

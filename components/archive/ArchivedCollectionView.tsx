import Link from 'next/link';
import { ArchivedProductTile } from '@/components/archive/ArchivedProductTile';
import type { CollectionDetail } from '@/lib/shopify/collections';
import type { ProductSummary } from '@/lib/shopify/products';

interface ArchivedCollectionViewProps {
  collection: CollectionDetail;
  products: ProductSummary[];
}

// Presentational Server Component for /archive/[handle] — page.tsx fetches
// + notFound()s, this renders (mirrors the PDP's page.tsx/ProductDetail
// split, per the design spec's Architecture section: the detail route
// additionally needs the fetched title for generateMetadata).
export function ArchivedCollectionView({ collection, products }: ArchivedCollectionViewProps) {
  return (
    <div className="flex flex-col gap-8 px-4 py-12 md:px-8">
      <Link
        href="/archive"
        className="w-fit text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
      >
        ARCHIVE
      </Link>
      <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
        {collection.title}
      </h1>
      {collection.description && (
        <p className="max-w-2xl text-body text-esque-text-secondary">{collection.description}</p>
      )}
      {products.length === 0 ? (
        // A genuinely unlikely edge case (an archived collection with zero
        // products) — handled honestly rather than left to render an empty
        // grid. Reuses CategoryListing's exact "no active filters"
        // empty-state markup/copy.
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="font-display text-heading-3 uppercase text-esque-text">NOTHING HERE YET.</p>
        </div>
      ) : (
        // DESIGN_SYSTEM.md §15's sitewide 4/8/12-column grid foundation, but
        // a plain, UNIFORM span for every cell — deliberately NOT
        // ProductGrid's featured/standard editorial alternation (design
        // spec: this is a historical record, not discovery browsing).
        // Mirrors WishlistView's exact grid shape for the same reason.
        <div className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8">
          {products.map((product) => (
            <div key={product.id} className="col-span-2 md:col-span-2 lg:col-span-3">
              <ArchivedProductTile product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

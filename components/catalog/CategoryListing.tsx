import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FilterBar } from '@/components/catalog/FilterBar';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import {
  buildProductSearchQuery,
  getSortVariables,
  hasActiveFilters,
  parseCatalogFilters,
  type CatalogSearchParams,
  type SortValue,
} from '@/lib/catalog/filters';
import {
  getCategoryLabel,
  getCategoryProductTypes,
  getSubcategoryLabel,
  getSubcategoryProductType,
  type CategorySlug,
} from '@/lib/catalog/taxonomy';
import { getProducts } from '@/lib/shopify/products';

interface CategoryListingProps {
  category: CategorySlug;
  subcategory?: string;
  searchParams: CatalogSearchParams;
}

// /new has no product-type taxonomy (see lib/catalog/taxonomy.ts) — it
// defaults to newest-first instead of the "featured" default every other
// category uses (design spec's Architecture section).
const DEFAULT_SORT_BY_CATEGORY: Record<CategorySlug, SortValue> = {
  new: 'newest',
  tops: 'featured',
  bottoms: 'featured',
  etc: 'featured',
};

function resolveProductTypes(
  category: CategorySlug,
  subcategory: string | undefined,
): string[] | null {
  if (!subcategory) return getCategoryProductTypes(category);
  const productType = getSubcategoryProductType(category, subcategory);
  if (!productType) notFound();
  return [productType];
}

// Shared by all seven category/subcategory routes — resolves the taxonomy,
// parses URL filters, queries Shopify's root products connection
// (DECISIONS.md D-023), and renders the filter bar + grid + empty/no-match
// states. See the design spec's Architecture section. An unknown
// subcategory 404s here (via notFound(), before any Shopify call is
// attempted) — a real 404, not the error boundary.
export async function CategoryListing({
  category,
  subcategory,
  searchParams,
}: CategoryListingProps) {
  const productTypes = resolveProductTypes(category, subcategory);
  const label = subcategory
    ? getSubcategoryLabel(category, subcategory)
    : getCategoryLabel(category);
  if (subcategory && !label) notFound();

  const defaultSort = DEFAULT_SORT_BY_CATEGORY[category];
  const filters = parseCatalogFilters(searchParams, defaultSort);
  const { sortKey, reverse } = getSortVariables(filters.sort);

  const { products } = await getProducts({
    query: buildProductSearchQuery({
      productTypes,
      available: filters.available,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    }),
    sortKey,
    reverse,
  });

  const pathname = subcategory ? `/${category}/${subcategory}` : `/${category}`;
  const filtersActive = hasActiveFilters(filters, defaultSort);

  return (
    <div className="flex flex-col gap-8 px-4 py-12 md:px-8">
      <h1 className="font-display text-display-l uppercase tracking-display text-esque-text">
        {label}
      </h1>
      <FilterBar pathname={pathname} searchParams={searchParams} filters={filters} />
      {products.length === 0 ? (
        // Two distinct zero-result states (design spec): a genuinely empty
        // category vs. filtered down to zero — hasActiveFilters is the
        // single source of truth for which copy/affordance applies.
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="font-display text-heading-3 uppercase text-esque-text">
            {filtersActive ? 'NOTHING MATCHES.' : 'NOTHING HERE YET.'}
          </p>
          {filtersActive && (
            <Link
              href={pathname}
              className="text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
            >
              Clear Filters
            </Link>
          )}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}

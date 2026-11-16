import {
  hasActiveFilters,
  parseCatalogFilters,
  type CatalogSearchParams,
} from '@/lib/catalog/filters';
import { getCatalogContinuationCursor } from '@/lib/catalog/products';
import {
  getCategoryProductTypes,
  getSubcategoryProductType,
  type CategorySlug,
} from '@/lib/catalog/taxonomy';

/** Filters and alternate orders retain the category canonical. Default-order
 * inventory continuations have distinct content and retain their scoped cursor. */
export function getCatalogCanonicalPath(
  category: CategorySlug,
  searchParams: CatalogSearchParams,
  subcategory?: string,
): string {
  const pathname = subcategory ? `/${category}/${subcategory}` : `/${category}`;
  const defaultSort = category === 'new' ? 'newest' : 'featured';
  const filters = parseCatalogFilters(searchParams, defaultSort);
  if (hasActiveFilters(filters, defaultSort) || filters.sort !== defaultSort) return pathname;
  const productType = subcategory ? getSubcategoryProductType(category, subcategory) : null;
  const productTypes = subcategory
    ? productType
      ? [productType]
      : []
    : getCategoryProductTypes(category);
  const after = Array.isArray(searchParams.after) ? searchParams.after[0] : searchParams.after;
  const cursor = getCatalogContinuationCursor(productTypes, filters, after);
  return cursor ? `${pathname}?${new URLSearchParams({ after: cursor })}` : pathname;
}

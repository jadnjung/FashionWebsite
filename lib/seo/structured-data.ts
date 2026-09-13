// JSON-LD structured-data builders — schema.org Product and BreadcrumbList.
// Verified against Google's current structured-data guidelines
// (developers.google.com/search/docs/appearance/structured-data/product-
// snippet, fetched directly rather than assumed from memory) before
// writing: Product structured data is valid with `offers` alone — review/
// aggregateRating are one of three alternatives (review, aggregateRating,
// offers; at least one required), never all required together. This
// project has no reviews feature, so `offers` (built entirely from real,
// already-fetched Shopify data) is the one used; review/aggregateRating
// are never fabricated. See DECISIONS.md D-052.
//
// offers.availability's value is one of schema.org's ItemAvailability
// enum members (confirmed current set: BackOrder, Discontinued, InStock,
// InStoreOnly, LimitedAvailability, OnlineOnly, OutOfStock, PreOrder,
// PreSale, SoldOut) — this codebase only ever has enough real signal to
// distinguish InStock/OutOfStock (lib/product/variants.ts's
// isProductSoldOut, the same function ProductPurchasePanel already uses),
// so only those two are ever emitted.

import { isProductSoldOut } from '@/lib/product/variants';
import type { ProductDetail, ProductVariant } from '@/lib/shopify/products';
import { SITE_URL } from '@/lib/seo/site';

export interface BreadcrumbItem {
  name: string;
  /** Path only, no origin — e.g. '/', '/tops', '/tops/hoodies'. */
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/** Overall product availability across every variant — never per-variant, since Offer below represents the product as a whole via its minPrice. */
function getOverallAvailability(variants: ProductVariant[]): string {
  return isProductSoldOut(variants)
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';
}

export function buildProductJsonLd(product: ProductDetail) {
  const url = `${SITE_URL}/products/${product.handle}`;
  const image = product.images[0]?.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    // Both optional fields are omitted from the object itself (not just
    // relying on JSON.stringify dropping `undefined` values at
    // serialization time) — keeps the object correct on its own terms for
    // any consumer that inspects it directly, not only its eventual
    // <script> tag output.
    ...(product.description ? { description: product.description } : {}),
    ...(image ? { image } : {}),
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product.minPrice.currencyCode,
      price: product.minPrice.amount,
      availability: getOverallAvailability(product.variants),
    },
  };
}

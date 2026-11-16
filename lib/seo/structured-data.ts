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
// Each Offer uses one actual variant's price, currency and sellability.
// A zero quantity remains sellable when Shopify permits backorders.

import { getProductVariantHref } from '@/lib/product/variant-url';
import type { ProductDetail } from '@/lib/shopify/products';
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

export function buildProductJsonLd(product: ProductDetail) {
  const url = `${SITE_URL}/products/${product.handle}`;
  const image = product.images[0]?.url;
  const available = product.variants.filter((variant) => variant.availableForSale);
  const candidates = available.length ? available : product.variants;
  const variant = candidates.reduce<(typeof candidates)[number] | undefined>(
    (lowest, candidate) =>
      !lowest || Number(candidate.price.amount) < Number(lowest.price.amount) ? candidate : lowest,
    undefined,
  );

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
    ...(variant
      ? {
          offers: {
            '@type': 'Offer',
            url: `${SITE_URL}${getProductVariantHref(product.handle, variant.id)}`,
            priceCurrency: variant.price.currencyCode,
            price: variant.price.amount,
            availability: variant.availableForSale
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  };
}

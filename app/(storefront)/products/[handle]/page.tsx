import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildProductSearchQuery } from '@/lib/catalog/filters';
import { getCategoryForProductType } from '@/lib/catalog/taxonomy';
import { getProduct, getProducts } from '@/lib/shopify/products';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  type BreadcrumbItem,
} from '@/lib/seo/structured-data';

// Request-scoped memoization so generateMetadata and the page component
// (both of which need the same product) issue one Shopify call, not two.
const getCachedProduct = cache(getProduct);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getCachedProduct(handle);
  if (!product) notFound();
  return buildPageMetadata({
    title: `${product.title} — Esque`,
    description: product.description || `Shop ${product.title} from the current Esque collection.`,
    path: `/products/${handle}`,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getCachedProduct(handle);
  if (!product) notFound();

  // Genuinely sequential — needs product.productType, so this cannot run
  // in parallel with the product fetch above; not the kind of avoidable
  // waterfall the async-parallel guidance warns against.
  const { products: sameType } = await getProducts({
    query: buildProductSearchQuery({ productTypes: [product.productType] }),
    first: 5,
  });

  // Breadcrumb mirrors the real navigable hierarchy: Home -> category ->
  // subcategory -> product. Falls back to a shorter Home -> product trail
  // if productType doesn't match a known subcategory (D-023's caveat: a
  // real store's productType strings might not exactly match NAVIGATION's
  // labels) — degrades honestly rather than fabricating a category.
  const categoryMatch = getCategoryForProductType(product.productType);
  const breadcrumbItems: BreadcrumbItem[] = [{ name: 'Home', path: '/' }];
  if (categoryMatch) {
    breadcrumbItems.push(
      { name: categoryMatch.categoryLabel, path: `/${categoryMatch.category}` },
      { name: categoryMatch.subcategoryLabel, path: categoryMatch.subcategoryHref },
    );
  }
  breadcrumbItems.push({ name: product.title, path: `/products/${product.handle}` });

  return (
    <>
      <JsonLd data={buildProductJsonLd(product)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <ProductDetail
        product={product}
        relatedProducts={sameType.filter((item) => item.handle !== product.handle).slice(0, 4)}
      />
    </>
  );
}

import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchivedCollectionView } from '@/components/archive/ArchivedCollectionView';
import { JsonLd } from '@/components/seo/JsonLd';
import { getArchivedCollection } from '@/lib/archive/collections';
import { getProductsByCollection } from '@/lib/shopify/products';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbJsonLd } from '@/lib/seo/structured-data';

// Request-scoped memoization so generateMetadata and the page component
// (both of which need the same collection) issue one Shopify call, not
// two — same cache()-wrapped dedup pattern as the PDP
// (app/(storefront)/products/[handle]/page.tsx).
const getCachedArchivedCollection = cache(getArchivedCollection);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCachedArchivedCollection(handle);
  if (!collection) notFound();
  return buildPageMetadata({
    title: `${collection.title} — Archive — Esque`,
    description: collection.description || `${collection.title}, a past Esque collection.`,
    path: `/archive/${handle}`,
  });
}

// No `dynamic` export needed here — a dynamic route segment with no
// generateStaticParams is already dynamically rendered by default
// (confirmed precedent: /products/[handle] has none either).
export default async function ArchivedCollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  // Parallelized, unlike the PDP's own second fetch: both calls here are
  // independent — each needs only `handle`, already known before either
  // starts — whereas the PDP's related-products fetch genuinely needs
  // product.productType from its first fetch's result and must stay
  // sequential. Awaiting these one at a time would be an avoidable
  // waterfall on the common (archived, valid-handle) path; the products
  // result is simply discarded below on the uncommon not-found path.
  const [collection, productsResult] = await Promise.all([
    getCachedArchivedCollection(handle),
    getProductsByCollection(handle),
  ]);
  if (!collection) notFound();
  const products = productsResult?.products ?? [];

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Archive', path: '/archive' },
          { name: collection.title, path: `/archive/${handle}` },
        ])}
      />
      <ArchivedCollectionView collection={collection} products={products} />
    </>
  );
}

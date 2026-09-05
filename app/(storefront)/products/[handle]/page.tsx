import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { buildProductSearchQuery } from '@/lib/catalog/filters';
import { getProduct, getProducts } from '@/lib/shopify/products';

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
  return {
    title: `${product.title} — Esque`,
    description: product.description || `Shop ${product.title} from the current Esque collection.`,
  };
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

  return (
    <ProductDetail
      product={product}
      relatedProducts={sameType.filter((item) => item.handle !== product.handle).slice(0, 4)}
    />
  );
}

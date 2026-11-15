import { cache, Suspense } from 'react';
import Link from 'next/link';
import { ProductGrid } from '@/components/catalog/ProductGrid';
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
    image: product.images[0]
      ? {
          url: product.images[0].url,
          alt: product.images[0].altText ?? product.title,
          width: product.images[0].width ?? undefined,
          height: product.images[0].height ?? undefined,
        }
      : undefined,
  });
}

async function RelatedProducts({ productType, handle }: { productType: string; handle: string }) {
  const result = await getProducts({
    query: buildProductSearchQuery({ productTypes: [productType] }),
    first: 5,
  }).catch(() => {
    console.error('Related product retrieval failed.');
    return null;
  });
  if (!result)
    return (
      <p className="px-4 py-8 text-body text-esque-text-secondary">
        Related pieces are temporarily unavailable.{' '}
        <Link className="underline" href="/new">
          Browse new arrivals
        </Link>
      </p>
    );
  const related = result.products.filter((item) => item.handle !== handle).slice(0, 4);
  if (!related.length) return null;
  return (
    <section aria-label={`More ${productType}`} className="flex flex-col gap-6 px-4 py-8 md:px-8">
      <h2 className="font-display text-heading-3 uppercase">More {productType}</h2>
      <ProductGrid products={related} />
    </section>
  );
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}) {
  const { handle } = await params;
  const product = await getCachedProduct(handle);
  if (!product) notFound();
  const query = await searchParams;
  const initialVariantId = typeof query.variant === 'string' ? query.variant : undefined;

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
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap gap-2 px-4 pt-6 text-utility text-esque-text-secondary md:px-8"
      >
        {breadcrumbItems.map((item, index) =>
          index === breadcrumbItems.length - 1 ? (
            <span key={item.path} aria-current="page" className="min-w-0 break-words">
              {item.name}
            </span>
          ) : (
            <span key={item.path}>
              <Link className="inline-block py-2 underline" href={item.path}>
                {item.name}
              </Link>
              <span aria-hidden="true" className="px-2">
                /
              </span>
            </span>
          ),
        )}
      </nav>
      <ProductDetail product={product} relatedProducts={[]} initialVariantId={initialVariantId} />
      <Suspense
        fallback={
          <p role="status" className="px-4 py-8 text-body">
            Loading related pieces…
          </p>
        }
      >
        <RelatedProducts productType={product.productType} handle={product.handle} />
      </Suspense>
    </>
  );
}

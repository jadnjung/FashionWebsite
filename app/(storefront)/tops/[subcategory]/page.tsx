import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getSubcategoryLabel, getSubcategoryProductType } from '@/lib/catalog/taxonomy';

// generateMetadata's own notFound() call shapes the not-found state's
// <title>/<meta> (Next.js resolves it via a separate metadata-error path)
// but does NOT by itself guarantee the page's HTTP status — that's
// governed entirely by the page component below.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = getSubcategoryLabel('tops', subcategory);
  if (!label) notFound();
  return {
    title: `${label} — Esque`,
    description: `Shop ${label} from the current Esque collection.`,
  };
}

export default async function TopsSubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { subcategory } = await params;
  // Validated here, before rendering <CategoryListing>, so an unknown
  // subcategory never triggers a Shopify call at all (rather than relying
  // solely on CategoryListing's own internal check, kept as a defensive
  // fallback). This does NOT make the resulting response a hard HTTP 404 —
  // see DECISIONS.md D-026: verified empirically that a dynamically-
  // rendered App Router page calling notFound() gets a 200 status with a
  // noindex tag in this Next.js version regardless of where in the
  // component tree the call happens, which is a documented Next.js
  // tradeoff for streamed/dynamic routes, not something this ordering
  // fixes. The branded 404 UI and the noindex tag are both confirmed
  // present either way.
  if (!getSubcategoryProductType('tops', subcategory)) notFound();
  return (
    <CategoryListing category="tops" subcategory={subcategory} searchParams={await searchParams} />
  );
}

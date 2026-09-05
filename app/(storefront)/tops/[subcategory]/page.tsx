import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getSubcategoryLabel } from '@/lib/catalog/taxonomy';

// notFound() here is officially supported inside generateMetadata (Next.js
// resolves it to the branded not-found UI/metadata) — an unknown
// subcategory 404s before any Shopify call is ever attempted.
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
  return (
    <CategoryListing category="tops" subcategory={subcategory} searchParams={await searchParams} />
  );
}

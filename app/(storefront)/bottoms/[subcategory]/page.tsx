import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getSubcategoryLabel } from '@/lib/catalog/taxonomy';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = getSubcategoryLabel('bottoms', subcategory);
  if (!label) notFound();
  return {
    title: `${label} — Esque`,
    description: `Shop ${label} from the current Esque collection.`,
  };
}

export default async function BottomsSubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { subcategory } = await params;
  return (
    <CategoryListing
      category="bottoms"
      subcategory={subcategory}
      searchParams={await searchParams}
    />
  );
}

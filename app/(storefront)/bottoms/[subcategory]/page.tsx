import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getSubcategoryLabel, getSubcategoryProductType } from '@/lib/catalog/taxonomy';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getCatalogCanonicalPath } from '@/lib/seo/catalog';

// generateMetadata's own notFound() call shapes the not-found state's
// <title>/<meta> (Next.js resolves it via a separate metadata-error path)
// but does NOT by itself guarantee the page's HTTP status — that's
// governed entirely by the page component below (see DECISIONS.md D-026).
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = getSubcategoryLabel('bottoms', subcategory);
  if (!label) notFound();
  return buildPageMetadata({
    title: `${label} — Esque`,
    description: `Shop ${label} from the current Esque collection.`,
    path: getCatalogCanonicalPath('bottoms', await searchParams, subcategory),
  });
}

export default async function BottomsSubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { subcategory } = await params;
  // Validated here, synchronously, before any JSX is returned — see
  // tops/[subcategory]/page.tsx for the full explanation of why this can't
  // be left to <CategoryListing>'s own internal (defensive-fallback) check.
  if (!getSubcategoryProductType('bottoms', subcategory)) notFound();
  return (
    <CategoryListing
      category="bottoms"
      subcategory={subcategory}
      searchParams={await searchParams}
    />
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getSubcategoryLabel, getSubcategoryProductType } from '@/lib/catalog/taxonomy';
import { buildPageMetadata } from '@/lib/seo/metadata';

// generateMetadata's own notFound() call shapes the not-found state's
// <title>/<meta> (Next.js resolves it via a separate metadata-error path)
// but does NOT by itself guarantee the page's HTTP status — that's
// governed entirely by the page component below (see DECISIONS.md D-026).
// Canonical is the bare subcategory path regardless of any Sort/
// Availability/Price filter params this route accepts (DECISIONS.md
// D-052) — searchParams is intentionally not read here.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = getSubcategoryLabel('etc', subcategory);
  if (!label) notFound();
  return buildPageMetadata({
    title: `${label} — Esque`,
    description: `Shop ${label} from the current Esque collection.`,
    path: `/etc/${subcategory}`,
  });
}

export default async function EtcSubcategoryPage({
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
  if (!getSubcategoryProductType('etc', subcategory)) notFound();
  return (
    <CategoryListing category="etc" subcategory={subcategory} searchParams={await searchParams} />
  );
}

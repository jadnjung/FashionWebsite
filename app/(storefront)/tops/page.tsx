import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';
import { buildPageMetadata } from '@/lib/seo/metadata';

// Canonical is the bare path regardless of any Sort/Availability/Price
// filter params this route accepts (DECISIONS.md D-052).
export const metadata: Metadata = buildPageMetadata({
  title: `${getCategoryLabel('tops')} — Esque`,
  description: 'Shop Tops from the current Esque collection.',
  path: '/tops',
});

export default async function TopsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="tops" searchParams={await searchParams} />;
}

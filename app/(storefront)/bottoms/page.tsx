import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';
import { buildPageMetadata } from '@/lib/seo/metadata';

// Canonical is the bare path regardless of any Sort/Availability/Price
// filter params this route accepts (DECISIONS.md D-052).
export const metadata: Metadata = buildPageMetadata({
  title: `${getCategoryLabel('bottoms')} — Esque`,
  description: 'Shop Bottoms from the current Esque collection.',
  path: '/bottoms',
});

export default async function BottomsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="bottoms" searchParams={await searchParams} />;
}

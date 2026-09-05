import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';

export const metadata: Metadata = {
  title: `${getCategoryLabel('bottoms')} — Esque`,
  description: 'Shop Bottoms from the current Esque collection.',
};

export default async function BottomsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="bottoms" searchParams={await searchParams} />;
}

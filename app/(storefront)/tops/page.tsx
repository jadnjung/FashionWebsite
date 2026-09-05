import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';

export const metadata: Metadata = {
  title: `${getCategoryLabel('tops')} — Esque`,
  description: 'Shop Tops from the current Esque collection.',
};

export default async function TopsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="tops" searchParams={await searchParams} />;
}

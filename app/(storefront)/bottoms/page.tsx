import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getCatalogCanonicalPath } from '@/lib/seo/catalog';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  return buildPageMetadata({
    title: `${getCategoryLabel('bottoms')} — Esque`,
    description: 'Shop Bottoms from the current Esque collection.',
    path: getCatalogCanonicalPath('bottoms', await searchParams),
  });
}

export default async function BottomsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="bottoms" searchParams={await searchParams} />;
}

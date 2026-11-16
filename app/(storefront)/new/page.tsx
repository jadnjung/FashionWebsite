import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getCatalogCanonicalPath } from '@/lib/seo/catalog';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  return buildPageMetadata({
    title: 'New — Esque',
    description: 'The latest additions to the current Esque collection.',
    path: getCatalogCanonicalPath('new', await searchParams),
  });
}

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="new" searchParams={await searchParams} />;
}

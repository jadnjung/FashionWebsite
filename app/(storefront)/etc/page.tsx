import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';

// getCategoryLabel('etc') rather than a hardcoded string — CONTENT.md §11:
// "Etc." (with the period) is an intentional naming choice, not a
// placeholder, and this keeps the title in sync with NAVIGATION's label.
export const metadata: Metadata = {
  title: `${getCategoryLabel('etc')} — Esque`,
  description: 'Shop Etc. from the current Esque collection.',
};

export default async function EtcPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="etc" searchParams={await searchParams} />;
}

import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { getCategoryLabel } from '@/lib/catalog/taxonomy';
import { buildPageMetadata } from '@/lib/seo/metadata';

// getCategoryLabel('etc') rather than a hardcoded string — CONTENT.md §11:
// "Etc." (with the period) is an intentional naming choice, not a
// placeholder, and this keeps the title in sync with NAVIGATION's label.
// Canonical is the bare path regardless of any Sort/Availability/Price
// filter params this route accepts (DECISIONS.md D-052).
export const metadata: Metadata = buildPageMetadata({
  title: `${getCategoryLabel('etc')} — Esque`,
  description: 'Shop Etc. from the current Esque collection.',
  path: '/etc',
});

export default async function EtcPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="etc" searchParams={await searchParams} />;
}

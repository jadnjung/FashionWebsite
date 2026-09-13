import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';
import { buildPageMetadata } from '@/lib/seo/metadata';

// Static metadata, independent of Shopify — see the design spec's
// "generateMetadata uses no Shopify data" section. Canonical is the bare
// path regardless of any Sort/Availability/Price filter params this route
// accepts (DECISIONS.md D-052) — those are still a shallow-merge single
// object here (not generateMetadata) since /new has no dynamic segment to
// read.
export const metadata: Metadata = buildPageMetadata({
  title: 'New — Esque',
  description: 'The latest additions to the current Esque collection.',
  path: '/new',
});

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="new" searchParams={await searchParams} />;
}

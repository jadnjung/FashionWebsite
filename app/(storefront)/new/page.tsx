import type { Metadata } from 'next';
import { CategoryListing } from '@/components/catalog/CategoryListing';
import type { CatalogSearchParams } from '@/lib/catalog/filters';

// Static metadata, independent of Shopify — see the design spec's
// "generateMetadata uses no Shopify data" section. Full SEO treatment
// (structured data, canonical URLs, Open Graph) is ROADMAP.md Phase 12.
export const metadata: Metadata = {
  title: 'New — Esque',
  description: 'The latest additions to the current Esque collection.',
};

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CategoryListing category="new" searchParams={await searchParams} />;
}

import type { Metadata } from 'next';
import { CollectionsIndex } from './CollectionsIndex';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Collections — Esque',
  description: 'Every Esque collection — current, upcoming, and archived.',
  path: '/collections',
});

// Matches app/(storefront)/archive/page.tsx's identical, already-proven
// precedent exactly: without this, Next.js would try to statically
// prerender this page at build time (no searchParams/dynamic segment to
// force per-request rendering the way category pages get it for free),
// which would call getCollections() — which does NOT swallow its Shopify
// error — during `pnpm build` itself. In this dev/CI environment (Shopify
// unconfigured), that throws, which would fail the production build
// rather than correctly deferring the failure to a runtime error boundary.
// Confirmed empirically, not assumed: removing this export and running
// `rm -rf .next && PREVIEW_DEMO_MODE= pnpm build` fails during "Generating
// static pages" with "Shopify Storefront API is not configured"; restoring
// it succeeds.
export const dynamic = 'force-dynamic';

export default function CollectionsPage() {
  return <CollectionsIndex />;
}

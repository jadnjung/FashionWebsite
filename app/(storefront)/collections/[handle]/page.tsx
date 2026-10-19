import { cache } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { CollectionTeaser } from './CollectionTeaser';
import { CollectionView } from './CollectionView';
import { JsonLd } from '@/components/seo/JsonLd';
import { DROP_ACCESS_COOKIE_NAME, hasUnlockedCollection } from '@/lib/access/cookies';
import { getDropPhase } from '@/lib/collections/drop-phase';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbJsonLd } from '@/lib/seo/structured-data';
import { getCollection } from '@/lib/shopify/collections';
import { getProductListItemsByCollection } from '@/lib/shopify/products';

// Request-scoped memoization so generateMetadata and the page component
// (both of which need the same collection) issue one Shopify call, not
// two — same cache()-wrapped dedup pattern as the PDP/Archive
// (app/(storefront)/products/[handle]/page.tsx,
// app/(storefront)/archive/[handle]/page.tsx).
const getCachedCollection = cache(getCollection);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCachedCollection(handle);
  if (!collection) notFound();

  const phase = getDropPhase(collection);
  if (phase === 'archived') notFound(); // its real home is /archive/[handle]

  if (phase === 'upcoming') {
    const cookieStore = await cookies();
    const unlocked = hasUnlockedCollection(cookieStore.get(DROP_ACCESS_COOKIE_NAME)?.value, handle);
    if (!unlocked) {
      // Title/description must not leak real content: the collection's own
      // title (e.g. "Collection 002") is a bare sequence identifier, not a
      // spoiler, but `collection.description` may carry real campaign copy
      // written for the eventual public launch.
      return buildPageMetadata({
        title: `${collection.title} — Coming Soon — Esque`,
        description: 'A new Esque collection is coming.',
        path: `/collections/${handle}`,
      });
    }
  }

  return buildPageMetadata({
    title: `${collection.title} — Esque`,
    description: collection.description || `${collection.title}, an Esque collection.`,
    path: `/collections/${handle}`,
  });
}

// No `dynamic` export needed — a dynamic route segment with no
// generateStaticParams is already dynamically rendered by default
// (confirmed precedent: /products/[handle], /archive/[handle]). Reading
// cookies() inside the `upcoming` branch below doesn't change this: the
// route was never a static-generation candidate to begin with.
export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  const collection = await getCachedCollection(handle);
  if (!collection) notFound();

  const phase = getDropPhase(collection);
  // This collection's real home is /archive/[handle]; never render it
  // twice under two URLs with different treatments.
  if (phase === 'archived') notFound();

  // `collection.dropDate` is narrowed to non-null here by TypeScript's own
  // control-flow analysis on the repeated property access — getDropPhase
  // only ever returns 'upcoming' when dropDate is truthy, so this check is
  // redundant in practice but lets the CollectionTeaser call below stay
  // assertion-free rather than reaching for a non-null (`!`) cast.
  if (phase === 'upcoming' && collection.dropDate) {
    const cookieStore = await cookies();
    const unlocked = hasUnlockedCollection(cookieStore.get(DROP_ACCESS_COOKIE_NAME)?.value, handle);
    if (!unlocked) {
      // No product fetch at all — the teaser never even calls
      // getProductListItemsByCollection, and is passed only the
      // collection's bare title/handle/dropDate (CollectionTeaserProps is
      // deliberately narrower than CollectionDetail).
      return (
        <CollectionTeaser
          handle={collection.handle}
          title={collection.title}
          dropDate={collection.dropDate}
        />
      );
    }
  }

  // phase === 'current', or phase === 'upcoming' with a valid unlock
  // cookie. Deliberately does NOT swallow a thrown Shopify error here —
  // same reasoning as Archive's getArchivedCollection: the commerce data
  // is this page's entire reason for existing, so a real failure
  // correctly propagates to app/error.tsx.
  const productsResult = await getProductListItemsByCollection(handle);
  const products = productsResult?.products ?? [];

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          // Updated for DECISIONS.md D-067: /collections (the index) is now
          // a real, linked-to page — this breadcrumb's own true navigational
          // hierarchy is Home -> Collections -> {this collection}, matching
          // /archive/[handle]'s identical Home -> Archive -> {collection}
          // shape (ArchivedCollectionView.tsx). Before D-067, /collections
          // didn't exist, so a 2-level Home -> {collection} breadcrumb was
          // the correct reflection of this page's real reachable hierarchy
          // at the time; this is a consistency fix following that route's
          // own first real intermediate page coming into existence, not a
          // new design decision.
          { name: 'Collections', path: '/collections' },
          { name: collection.title, path: `/collections/${handle}` },
        ])}
      />
      <CollectionView collection={collection} products={products} />
    </>
  );
}

import type { MetadataRoute } from 'next';
import { BUILT_CATEGORY_HREFS } from '@/lib/catalog/taxonomy';
import { LEGAL_PAGES } from '@/lib/legal/pages';
import { NAVIGATION } from '@/lib/navigation-data';
import { SITE_URL } from '@/lib/seo/site';
import { getProducts } from '@/lib/shopify/products';
import { getCollections } from '@/lib/shopify/collections';
import { getDropPhase } from '@/lib/collections/drop-phase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categoryPaths = NAVIGATION.filter((entry) => BUILT_CATEGORY_HREFS.has(entry.href)).flatMap(
    (entry) => [entry.href, ...(entry.subcategories?.map((item) => item.href) ?? [])],
  );
  const paths = new Set([
    '/',
    ...categoryPaths,
    ...LEGAL_PAGES.map((page) => page.href),
    '/contact',
    '/archive',
  ]);
  const configured =
    process.env.PREVIEW_DEMO_MODE === '1' ||
    Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_API_TOKEN);
  if (configured) {
    let after: string | undefined;
    do {
      const page = await getProducts({ first: 100, after });
      page.products.forEach((product) => paths.add(`/products/${product.handle}`));
      if (!page.hasNextPage) break;
      if (!page.endCursor || page.endCursor === after)
        throw new Error('Product sitemap cursor did not advance.');
      after = page.endCursor;
    } while (after);
    after = undefined;
    do {
      const page = await getCollections(100, after);
      for (const collection of page.collections) {
        const phase = getDropPhase(collection);
        if (phase === 'upcoming') continue;
        paths.add(`/${phase === 'archived' ? 'archive' : 'collections'}/${collection.handle}`);
      }
      if (!page.hasNextPage) break;
      if (!page.endCursor || page.endCursor === after)
        throw new Error('Collection sitemap cursor did not advance.');
      after = page.endCursor;
    } while (after);
  }
  return [...paths].map((path) => ({ url: new URL(path, SITE_URL).href }));
}

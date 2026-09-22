import type { MetadataRoute } from 'next';
import { BUILT_CATEGORY_HREFS } from '@/lib/catalog/taxonomy';
import { LEGAL_PAGES } from '@/lib/legal/pages';
import { NAVIGATION } from '@/lib/navigation-data';
import { SITE_URL } from '@/lib/seo/site';

// BUILT_CATEGORY_HREFS: only NAVIGATION entries that correspond to a route
// actually built this far into the roadmap — NAVIGATION also lists
// /collections and /about (ROADMAP.md Phase 10/11+, not built yet), which
// would 404 if included here. Relocated to lib/catalog/taxonomy.ts
// (DECISIONS.md D-058) so search's category matching reads the same single
// source of truth rather than a second, independently-drifting copy — a
// deliberate, documented tradeoff rather than teaching NAVIGATION itself
// which of its entries are "live", which would be a bigger change than
// this pass needs (see DECISIONS.md D-052).

// Static routes only. Product PDPs (/products/[handle]) need enumerable
// Shopify product handles, which needs a real store — the same D-016/
// D-023-class limitation every prior phase has hit and documented rather
// than guessed around. /access is deliberately excluded: it's a UI gate,
// not indexable content (its own metadata already sets robots: {index:
// false}, matching DECISIONS.md D-005's "gate is a UI experience, not an
// SEO wall" — the *catalog* stays crawlable, the gate itself needn't be).
//
// The six /legal/* pages and /contact (ROADMAP.md Phase 12, DECISIONS.md
// D-054) are included and indexable like the category pages above, even
// though their content is a labeled draft pending legal review — D-005's
// "gate is a UI experience, not an SEO wall" already accepts the whole
// catalog being crawlable pre-launch, and a customer searching "Esque
// return policy" is exactly the kind of query PROJECT.md §79's SEO
// requirements exist to serve. LEGAL_PAGES is the same list Footer.tsx
// renders its links from, so the two can't silently drift.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const categoryPaths = NAVIGATION.filter((entry) => BUILT_CATEGORY_HREFS.has(entry.href)).flatMap(
    (entry) => [entry.href, ...(entry.subcategories?.map((s) => s.href) ?? [])],
  );
  const legalPaths = LEGAL_PAGES.map((page) => page.href);
  const paths = ['/', ...categoryPaths, ...legalPaths, '/contact', '/archive'];

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
  }));
}

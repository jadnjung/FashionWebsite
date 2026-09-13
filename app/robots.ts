import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

// Allows everything. /access is deliberately NOT disallowed here, even
// though it's excluded from indexing: current Google guidance is explicit
// that noindex and robots.txt Disallow should never be combined for the
// same URL — a disallowed page can't be crawled at all, so Google never
// sees the noindex directive that page's own metadata sets (D-005's UI-
// gate framing), and a disallowed-but-linked URL can still surface in
// search results with no snippet. The page-level `robots: {index: false}`
// metadata (app/(access)/access/page.tsx) is the correct, sufficient
// mechanism on its own. proxy.ts's matcher already excludes this route
// (and /sitemap.xml) from the access-gate redirect, so crawlers reach both
// unconditionally (DECISIONS.md D-005/D-019).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

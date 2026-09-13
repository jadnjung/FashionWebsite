// Shared site-level SEO constants — the single source of truth that
// lib/seo/metadata.ts, lib/seo/structured-data.ts, app/sitemap.ts, and
// app/robots.ts all read, so the site's canonical origin/name is never
// duplicated (and can't drift) across those four call sites.
//
// No real domain is provisioned yet (PROJECT.md §101/ARCHITECTURE.md §96
// list a custom domain as still-open) — this falls back to the same
// localhost default .env.local.example already documents for
// NEXT_PUBLIC_SITE_URL. Once a real domain exists, setting the real env
// var in production is the only change needed; every canonical URL,
// sitemap entry, robots.txt sitemap pointer, and JSON-LD @id/url field
// updates automatically.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const SITE_NAME = 'Esque';

// app/opengraph-image.tsx's own conventional URL and dimensions, mirrored
// here (not imported from there — lib/ should not depend on app/, the
// reverse of every dependency direction elsewhere in this codebase) so
// lib/seo/metadata.ts can reference it explicitly. This is necessary, not
// redundant: Next.js's file-based OG image auto-applies to a route only
// when that route doesn't declare its own openGraph object — confirmed
// empirically (curl against a real build, not assumed from the docs'
// "file-based has higher priority" wording, which reads as if it should
// always win) — every page here DOES declare its own openGraph (to get a
// correct per-page title/description, since Next fully replaces rather
// than merges a parent's openGraph the moment a child sets one), which
// silently drops the ancestor image unless each page re-references it.
// If opengraph-image.tsx's size/alt ever change, update these three to
// match — small, deliberate, documented duplication rather than importing
// across the lib/app boundary for values that essentially never change.
export const OG_IMAGE_PATH = '/opengraph-image';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT = SITE_NAME;

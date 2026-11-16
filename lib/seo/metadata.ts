// Builds the metadata shape every real, indexable route needs: title,
// description, a self-referential canonical URL, and an Open Graph object
// that mirrors title/description explicitly. See DECISIONS.md D-052 for
// the full reasoning; the two load-bearing points:
//
// 1. Canonical uses the route's normalized content URL. Category pages
//    carry Sort/Availability/Price filter params (lib/catalog/filters.ts,
//    DECISIONS.md D-024) that vary the rendered product list without
//    creating genuinely distinct content; per current Google guidance on
//    consolidating duplicate/near-duplicate URLs, the filtered variants
//    point back to the parameter-free category URL. Default-order inventory
//    continuation pages retain their validated cursor (lib/seo/catalog.ts).
// 2. openGraph is fully re-declared per page, not partially inherited.
//    Next.js's metadata merging replaces a parent segment's entire
//    openGraph object the moment a child segment declares its own —
//    confirmed against Next's current generateMetadata docs ("All
//    openGraph fields from app/layout.js are replaced... because
//    app/blog/page.js sets openGraph metadata"). A page that set only
//    { title, description } would silently lose siteName/type/locale,
//    not inherit them — so every call site gets the complete object here.
//
// og:image explicitly re-references the one sitewide app/opengraph-image.tsx
// (file-based convention) on every page, rather than relying on it being
// inherited: confirmed empirically (curl against a real build, not assumed
// from the docs) that Next.js only auto-applies a file-based OG image to
// routes that don't declare their own openGraph object — since every real
// page here must declare one anyway (for its own title/description, see
// above), the image would otherwise silently disappear everywhere except
// the one route with no override. See DECISIONS.md D-052.

import type { Metadata } from 'next';
import {
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from '@/lib/seo/site';

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Normalized canonical path, including a validated continuation query when applicable. */
  path: string;
  image?: { url: string; alt: string; width?: number; height?: number };
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        image ?? {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: OG_IMAGE_ALT,
        },
      ],
    },
  };
}

import { describe, expect, test } from 'vitest';
import { buildPageMetadata } from '@/lib/seo/metadata';

describe('buildPageMetadata', () => {
  test('passes title and description through unchanged', () => {
    const result = buildPageMetadata({
      title: 'Tops — Esque',
      description: 'Shop Tops from the current Esque collection.',
      path: '/tops',
    });
    expect(result.title).toBe('Tops — Esque');
    expect(result.description).toBe('Shop Tops from the current Esque collection.');
  });

  test('sets canonical to exactly the given path, no query string', () => {
    const result = buildPageMetadata({
      title: 'Hoodies — Esque',
      description: 'Shop Hoodies.',
      path: '/tops/hoodies',
    });
    expect(result.alternates).toEqual({ canonical: '/tops/hoodies' });
  });

  test('openGraph mirrors title/description/url, includes the sitewide constants, and re-references the OG image', () => {
    const result = buildPageMetadata({
      title: 'Hoodie 01 — Esque',
      description: 'Shop Hoodie 01 from the current Esque collection.',
      path: '/products/hoodie-01',
    });
    expect(result.openGraph).toEqual({
      title: 'Hoodie 01 — Esque',
      description: 'Shop Hoodie 01 from the current Esque collection.',
      url: '/products/hoodie-01',
      siteName: 'Esque',
      type: 'website',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Esque' }],
    });
  });

  test('every page explicitly re-references the sitewide OG image', () => {
    // Necessary, not redundant: Next.js only auto-applies the file-based
    // opengraph-image to a route that declares no openGraph object of its
    // own — every real page here declares one (for its own title/
    // description), which would otherwise silently drop the image. See
    // lib/seo/site.ts's OG_IMAGE_* comment and DECISIONS.md D-052.
    const result = buildPageMetadata({ title: 'X', description: 'Y', path: '/new' });
    expect(result.openGraph?.images).toEqual([
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'Esque' },
    ]);
  });
});

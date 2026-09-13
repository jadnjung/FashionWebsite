import { describe, expect, test } from 'vitest';
import { LEGAL_PAGES } from '@/lib/legal/pages';

describe('LEGAL_PAGES', () => {
  test('has exactly six entries — the five PROJECT.md §85 policies plus Accessibility', () => {
    expect(LEGAL_PAGES).toHaveLength(6);
  });

  test('every entry has a non-empty slug, href, and label', () => {
    for (const page of LEGAL_PAGES) {
      expect(page.slug.length).toBeGreaterThan(0);
      expect(page.href.length).toBeGreaterThan(0);
      expect(page.label.length).toBeGreaterThan(0);
    }
  });

  test('every href is /legal/<slug>, matching the slug field exactly', () => {
    for (const page of LEGAL_PAGES) {
      expect(page.href).toBe(`/legal/${page.slug}`);
    }
  });

  test('slugs and hrefs are unique — no accidental duplicate route', () => {
    const slugs = LEGAL_PAGES.map((p) => p.slug);
    const hrefs = LEGAL_PAGES.map((p) => p.href);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test('includes the five PROJECT.md §85 required policies by slug', () => {
    const slugs = LEGAL_PAGES.map((p) => p.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(['privacy', 'terms', 'shipping', 'returns', 'refunds']),
    );
  });
});

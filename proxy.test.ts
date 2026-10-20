import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

// Direct unit coverage of proxy()'s own branching logic — fast and
// deterministic, no server/build round-trip needed. The real HTTP-status
// claim this whole feature exists for (DECISIONS.md D-072) still needs a
// live round-trip to mean anything, which is what
// tests/e2e/catalog.spec.ts's "real HTTP status" tests are for; this file
// only pins the pure function's own behavior.
describe('proxy — unrecognized catalog subcategory returns a real 404', () => {
  it('passes a known subcategory through untouched', () => {
    const response = proxy(new NextRequest('http://localhost/tops/hoodies'));
    expect(response).toBeUndefined();
  });

  it('passes a known subcategory with a trailing slash through untouched', () => {
    const response = proxy(new NextRequest('http://localhost/tops/hoodies/'));
    expect(response).toBeUndefined();
  });

  it('passes a category index route (no subcategory segment) through untouched', () => {
    const response = proxy(new NextRequest('http://localhost/tops'));
    expect(response).toBeUndefined();
  });

  it('ignores /new, which has no [subcategory] route at all', () => {
    const response = proxy(new NextRequest('http://localhost/new/anything'));
    expect(response).toBeUndefined();
  });

  it('ignores unrelated routes entirely', () => {
    const response = proxy(new NextRequest('http://localhost/products/some-handle'));
    expect(response).toBeUndefined();
  });

  for (const category of ['tops', 'bottoms', 'etc']) {
    it(`returns a terminal NextResponse with a real 404 status for an unrecognized ${category} subcategory`, async () => {
      const response = proxy(
        new NextRequest(`http://localhost/${category}/not-a-real-subcategory`),
      );
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(404);
      expect(response?.headers.get('content-type')).toBe('text/html; charset=utf-8');

      // The apostrophe is HTML-escaped by proxy.ts's own escapeHtml() (this
      // is a hand-built HTML string, not JSX) — asserting the real,
      // on-the-wire bytes rather than the unescaped source copy.
      const body = await response?.text();
      expect(body).toContain('THIS PIECE DOESN&#39;T EXIST.');
    });
  }

  it('ignores a query string when checking the path', () => {
    const response = proxy(new NextRequest('http://localhost/tops/hoodies?sort=price'));
    expect(response).toBeUndefined();
  });

  it('decodes a percent-encoded but otherwise valid subcategory before checking it', () => {
    // %68 is 'h' — this is "hoodies" with its first letter percent-encoded.
    const response = proxy(new NextRequest('http://localhost/tops/%68oodies'));
    expect(response).toBeUndefined();
  });

  it('404s rather than throwing on a malformed percent-encoded subcategory', () => {
    const response = proxy(new NextRequest('http://localhost/tops/%E0%A4%A'));
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(404);
  });
});

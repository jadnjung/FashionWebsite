import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubcategoryProductType, type CategorySlug } from '@/lib/catalog/taxonomy';
import {
  NOT_FOUND_DESCRIPTION,
  NOT_FOUND_HEADING,
  NOT_FOUND_HOME_LABEL,
  NOT_FOUND_TITLE,
} from '@/lib/content/not-found';

// Matches exactly the three built subcategory routes —
// app/(storefront)/{tops,bottoms,etc}/[subcategory]/page.tsx. Never /new,
// which has no [subcategory] route at all (lib/catalog/taxonomy.ts's
// getCategoryProductTypes returns null for it — there's nothing to check).
const SUBCATEGORY_PATH = /^\/(tops|bottoms|etc)\/([^/]+)\/?$/;

// Resolves DECISIONS.md D-026/D-052: an unrecognized subcategory slug
// (e.g. /tops/not-a-real-subcategory) rendered the correct branded 404 UI
// but returned HTTP 200 + noindex, never a real 404 status. Root cause
// (confirmed against Next 16.3.1's own bundled docs): notFound() inside a
// dynamically-rendered page can only commit a real 404 status *before its
// response starts streaming* — for an ordinary (non-Cache-Components)
// dynamic route, streaming has already begun by the time the page
// component runs, so the status is permanently locked to 200 by then.
//
// Proxy runs before any route renders at all (step 3 of Next's own
// documented execution order, strictly before "Filesystem routes" and
// "Dynamic Routes") — so checking validity here and responding directly
// happens before streaming ever starts. This is categorically different
// from D-052's own disproven attempt, which used NextResponse.rewrite():
// a rewrite only signals *what to render next* and that destination still
// re-enters dynamic rendering, which is what re-commits the response to
// 200. Returning a `NextResponse` instance directly (not via
// `.rewrite()`/`.redirect()`) is Next's own documented "Producing a
// response" mechanism — it short-circuits the request and never reaches
// any page component, so nothing downstream gets a chance to re-open the
// stream. Verified live via `next start` + `curl` (see DECISIONS.md D-072
// for the exact commands and output), not assumed from the docs alone.
//
// getSubcategoryProductType is the exact same synchronous, zero-Shopify-
// call lookup app/(storefront)/tops/[subcategory]/page.tsx (and its
// bottoms/etc siblings) already call before rendering — reused here, not
// reimplemented, so Proxy and the page can never disagree on what counts
// as a valid subcategory.
export function proxy(request: NextRequest) {
  const match = SUBCATEGORY_PATH.exec(request.nextUrl.pathname);
  if (!match) return;

  const [, category, rawSubcategory] = match;
  let subcategory = rawSubcategory;
  try {
    subcategory = decodeURIComponent(rawSubcategory);
  } catch {
    // Malformed percent-encoding can't be a real subcategory slug either —
    // fall through to the 404 branch below using the raw value.
  }

  if (getSubcategoryProductType(category as CategorySlug, subcategory)) return;

  return new NextResponse(renderNotFoundHtml(), {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/tops/:subcategory', '/bottoms/:subcategory', '/etc/:subcategory'],
};

// Escapes the five HTML-significant characters. All four strings
// interpolated below (lib/content/not-found.ts) are fixed, hand-authored
// constants, never request input — this is defense-in-depth for whoever
// edits that module next, not a response to a known-unsafe value today.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// A hand-written, inline-styled HTML document — not app/not-found.tsx's
// real Tailwind-classed JSX rendered through React. Proxy has no access to
// the app's compiled CSS (a hashed build artifact with no stable,
// documented path outside Next's own rendering pipeline — the same reason
// DECISIONS.md D-052 rejected reading .next/server/app/_not-found.html
// directly) and cross-importing an app/-directory page file into Proxy's
// own, separately-bundled bundle is not a documented, supported
// composition (Next's own proxy docs warn against "relying on shared
// modules" beyond simple, side-effect-free lookups like the taxonomy check
// above). Colors/type scale/tracking below are copied directly from
// app/globals.css's @theme block (DESIGN_SYSTEM.md §4/§9/§11), not
// invented — see DECISIONS.md D-072 for the explicit tradeoff this accepts:
// identical copy (shared with app/not-found.tsx, see lib/content/not-found.ts),
// approximated visual presentation (no custom display font, no hover
// micro-interactions) for this one rare, non-primary-journey edge case.
function renderNotFoundHtml(): string {
  const title = escapeHtml(NOT_FOUND_TITLE);
  const description = escapeHtml(NOT_FOUND_DESCRIPTION);
  const heading = escapeHtml(NOT_FOUND_HEADING);
  const homeLabel = escapeHtml(NOT_FOUND_HOME_LABEL);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title}</title>
<meta name="description" content="${description}" />
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0;
    background-color: #050505;
    color: #f3f1ea;
  }
  main {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
  }
  h1 {
    margin: 0;
    max-width: 90vw;
    font-family: 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif;
    font-stretch: condensed;
    font-size: clamp(56px, 8vw, 128px);
    font-weight: 700;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }
  a {
    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #a5a5a0;
    text-decoration: none;
    text-underline-offset: 4px;
  }
  a:hover { color: #f3f1ea; text-decoration: underline; }
  a:focus-visible { outline: 2px solid #f3f1ea; outline-offset: 2px; }
</style>
</head>
<body>
<main>
<h1>${heading}</h1>
<a href="/">${homeLabel}</a>
</main>
</body>
</html>
`;
}

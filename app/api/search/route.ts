import { NextResponse, type NextRequest } from 'next/server';
import { searchCollections } from '@/lib/shopify/collections';
import { searchProducts } from '@/lib/shopify/products';
import {
  MAX_SEARCH_QUERY_LENGTH,
  MIN_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from '@/lib/search-query';

// This project's first Route Handler. Deliberately GET + query param, not
// a Server Action — a live, debounced, cancelable-via-AbortSignal read is
// a different responsibility from this codebase's existing Server-Action
// call sites (discrete form submissions). Already excluded from the
// access gate: proxy.ts's matcher excludes /api unconditionally, with a
// comment anticipating exactly this. GET handlers default to dynamic
// rendering since Next 15.0.0-RC (confirmed against this project's
// installed Next 16.3.1 docs) — reading searchParams needs no additional
// `export const dynamic` override.
//
// searchProducts/searchCollections run concurrently via Promise.all, not
// sequential awaits — two independent Storefront round-trips, so awaiting
// them one at a time would add the second call's full latency on top of
// the first for no reason. If either rejects, Promise.all's own rejection
// propagates straight to the catch block below — the existing generic
// 500/search_failed contract covers a collections-side failure exactly
// the same way it already covers a products-side one; no separate
// partial-success handling is added (see DECISIONS.md D-058/D-069).
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.getAll('q').length > 1) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }
  const query = normalizeSearchQuery(request.nextUrl.searchParams.get('q') ?? '');

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return NextResponse.json(
      { error: 'query_too_long', maxLength: MAX_SEARCH_QUERY_LENGTH },
      { status: 400 },
    );
  }

  if (query.length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ products: [], collections: [] });
  }

  try {
    const [products, collections] = await Promise.all([
      searchProducts(query),
      searchCollections(query),
    ]);
    return NextResponse.json({ products, collections });
  } catch {
    // Upstream errors can contain free-text query values. Keep operational
    // failure visibility without logging customer input or response detail.
    console.error('[api/search] Search lookup failed.');
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

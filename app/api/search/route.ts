import { NextResponse, type NextRequest } from 'next/server';
import { searchCollections } from '@/lib/shopify/collections';
import { searchProducts } from '@/lib/shopify/products';

const MAX_QUERY_LENGTH = 100;

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
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);

  if (!query) {
    return NextResponse.json({ products: [], collections: [] });
  }

  try {
    const [products, collections] = await Promise.all([
      searchProducts(query),
      searchCollections(query),
    ]);
    return NextResponse.json({ products, collections });
  } catch (error) {
    // Logged, never forwarded to the client response — mirrors
    // app/error.tsx's own "log the real error, never show it" contract.
    console.error('[api/search]', error);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

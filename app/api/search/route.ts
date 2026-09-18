import { NextResponse, type NextRequest } from 'next/server';
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
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await searchProducts(query);
    return NextResponse.json({ products });
  } catch (error) {
    // Logged, never forwarded to the client response — mirrors
    // app/error.tsx's own "log the real error, never show it" contract.
    console.error('[api/search]', error);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

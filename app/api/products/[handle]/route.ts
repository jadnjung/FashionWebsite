import { NextResponse, type NextRequest } from 'next/server';
import { getProduct } from '@/lib/shopify/products';

// This codebase's second Route Handler, mirroring app/api/search/route.ts's
// exact pattern — a live, on-demand, cancelable-via-AbortSignal read
// triggered by opening Quick Add (components/catalog/QuickAddTrigger.tsx),
// not a form submission (this project's Server Actions handle those).
// Already excluded from the access gate: proxy.ts's matcher excludes /api
// unconditionally. GET handlers default to dynamic rendering since Next
// 15.0.0-RC — no explicit `export const dynamic` needed (confirmed against
// this project's installed Next 16.3.1 docs by app/api/search/route.ts's
// own precedent). A dynamic route segment ([handle]), not a query
// parameter, because this fetches one specific, already-known resource by
// its canonical identifier — mirroring the page route it's paired with
// (/products/[handle]), unlike search's flat ?q= (which isn't about one
// resource). See DECISIONS.md D-060.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  try {
    const product = await getProduct(handle);
    // { product: null } for a genuinely absent product mirrors getProduct's
    // own null-is-not-an-error contract, exactly like search's
    // { products: [] } for zero results — resource-absence is data, not a
    // wire-level error, so the client branches on `product === null`, never
    // on status code.
    return NextResponse.json({ product });
  } catch (error) {
    // Logged, never forwarded to the client response — mirrors
    // app/api/search/route.ts's and app/error.tsx's "log the real error,
    // never show it" contract.
    console.error('[api/products]', error);
    return NextResponse.json({ error: 'product_fetch_failed' }, { status: 500 });
  }
}

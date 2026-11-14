import { NextResponse, type NextRequest } from 'next/server';
import { applyDemoCartOperation, buildDemoCart } from '@/lib/cart/demo-cart';
import { CartValidationError } from '@/lib/cart/model';

const headers = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  if (process.env.PREVIEW_DEMO_MODE !== '1') {
    return NextResponse.json({ error: 'cart_unconfigured' }, { status: 503, headers });
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'invalid_cart' }, { status: 403, headers });
  }
  if (
    !request.headers.get('content-type')?.startsWith('application/json') ||
    Number(request.headers.get('content-length')) > 16000
  ) {
    return NextResponse.json({ error: 'invalid_cart' }, { status: 400, headers });
  }
  try {
    const raw = await request.text();
    if (raw.length > 16000) throw new CartValidationError('invalid_cart');
    const body: unknown = JSON.parse(raw);
    if (typeof body !== 'object' || body === null || !('lines' in body)) {
      throw new CartValidationError('invalid_cart');
    }
    const cart =
      'operation' in body
        ? applyDemoCartOperation(body.lines, body.operation)
        : buildDemoCart(body.lines);
    return NextResponse.json({ cart }, { headers });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'invalid_cart' }, { status: 400, headers });
    }
    if (error instanceof CartValidationError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'invalid_cart' ? 400 : 422, headers },
      );
    }
    console.error('[api/cart] Demo cart response failed.');
    return NextResponse.json({ error: 'cart_failed' }, { status: 500, headers });
  }
}

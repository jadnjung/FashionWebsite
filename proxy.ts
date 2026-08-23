import { NextResponse, type NextRequest } from 'next/server';
import { isBot } from 'isbot';
import { ACCESS_COOKIE_NAME, VIP_ACCESS_COOKIE_NAME } from '@/lib/access/cookies';

// Next.js renamed Middleware to Proxy (proxy.ts, Node.js runtime, not Edge)
// — verified against current docs, not the deprecated middleware.ts
// convention. See DECISIONS.md D-018.
export function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';

  // Crawlers always pass through, regardless of cookie state — the access
  // gate is a UI-layer experience for human visitors, never an SEO wall.
  // See ARCHITECTURE.md §6, DECISIONS.md D-005, D-019.
  if (isBot(userAgent)) {
    return NextResponse.next();
  }

  const hasAccess =
    request.cookies.has(ACCESS_COOKIE_NAME) || request.cookies.has(VIP_ACCESS_COOKIE_NAME);
  if (hasAccess) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/access';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /access (and any /access/* sub-path) — the gate page itself, avoids
     *   a redirect loop
     * - /api (and any /api/* sub-path) — route handlers, if any need to
     *   bypass the gate
     * - _next/static, _next/image — Next.js internals
     * - favicon.ico — metadata file
     *
     * Each of "access"/"api" is anchored to a full path segment via
     * `(?:$|/)` rather than left as a bare prefix — an unanchored
     * `(?!access|api|...)` would let any future path that merely STARTS
     * WITH one of these strings silently bypass the gate, e.g. a plausible
     * Phase 4 category route like /accessories.
     */
    '/((?!access(?:$|/)|api(?:$|/)|_next/static|_next/image|favicon.ico).*)',
  ],
};

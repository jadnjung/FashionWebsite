import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

afterEach(() => vi.unstubAllEnvs());

function request(body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('demo cart route', () => {
  it('keeps production unavailable regardless of submitted fixtures', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '');
    const response = await POST(request({ lines: [] }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'cart_unconfigured' });
  });

  it('returns a no-store simulated response when explicitly enabled', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const response = await POST(request({ lines: [] }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()).cart.mode).toBe('demo');
  });

  it('rejects foreign origins and malformed input with safe errors', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    expect((await POST(request({ lines: [] }, 'https://elsewhere.test'))).status).toBe(403);
    const response = await POST(request({ lines: [{ quantity: 1 }] }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_cart' });
  });

  it('rejects unavailable variants and recovers on the next valid replacement', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const invalid = await POST(
      request({
        lines: [{ handle: 'preview-featherweight-crewneck', variantId: 'unknown', quantity: 1 }],
      }),
    );
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toEqual({ error: 'variant_unavailable' });
    expect((await POST(request({ lines: [] }))).status).toBe(200);
  });
});

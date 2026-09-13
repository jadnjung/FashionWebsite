import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendGAEvent } from '@next/third-parties/google';
import { isAnalyticsConfigured, trackEvent } from './gtag';

vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}));

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(sendGAEvent).mockClear();
});

describe('isAnalyticsConfigured', () => {
  it('is false when NEXT_PUBLIC_GA4_MEASUREMENT_ID is unset (this project’s current, real state)', () => {
    vi.stubEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID', undefined);
    expect(isAnalyticsConfigured()).toBe(false);
  });

  it('is false for an empty string (the .env.local.example placeholder value)', () => {
    vi.stubEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID', '');
    expect(isAnalyticsConfigured()).toBe(false);
  });

  it('is true once a real measurement ID is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID', 'G-TEST123');
    expect(isAnalyticsConfigured()).toBe(true);
  });
});

describe('trackEvent', () => {
  // This suite runs in vitest's Node environment (vitest.config.ts:
  // `environment: 'node'`, no jsdom) — `window` is genuinely undefined
  // here, exactly like an RSC/SSR render. That makes this the natural,
  // honest place to prove the "outside a browser" no-op branch, the same
  // branch that makes trackEvent safe to import into any module without
  // risking a server-render crash.
  it('never throws when called with no `window` (SSR-safe), whether or not GA4 is configured', () => {
    expect(typeof window).toBe('undefined');
    vi.stubEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID', undefined);
    expect(() => trackEvent('access_gate_view', {})).not.toThrow();

    vi.stubEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID', 'G-TEST123');
    expect(() => trackEvent('access_gate_view', {})).not.toThrow();
  });

  it('never forwards to the real GA4 sink when there is no `window`', () => {
    vi.stubEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID', 'G-TEST123');
    trackEvent('access_granted', { tier: 'general' });
    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it('accepts every documented event with its exact declared property shape without a type error', () => {
    // Primarily a compile-time check (pnpm typecheck fails if any of these
    // shapes drift from lib/analytics/events.ts) — asserting no throw keeps
    // it a real, executed test rather than dead code a bundler could
    // silently drop.
    vi.stubEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID', 'G-TEST123');
    expect(() => {
      trackEvent('view_item', {
        currency: 'USD',
        value: 68,
        items: [{ item_id: 'hoodie-01', item_name: 'Hoodie 01', item_category: 'Hoodies' }],
        sold_out: false,
      });
      trackEvent('add_to_bag_click', {
        currency: 'USD',
        value: 68,
        items: [{ item_id: 'hoodie-01', item_name: 'Hoodie 01', item_variant: 'variant-gid' }],
      });
      trackEvent('quick_add_click', {
        currency: 'USD',
        value: 68,
        items: [{ item_id: 'hoodie-01', item_name: 'Hoodie 01' }],
        region: 'top',
      });
      trackEvent('variant_selected', {
        item_id: 'hoodie-01',
        option_name: 'Size',
        option_value: 'M',
        context: 'pdp',
      });
      trackEvent('category_nav_click', { category: 'Tops', href: '/tops' });
      trackEvent('hotspot_selected', {
        region: 'top',
        item_id: 'hoodie-01',
        item_name: 'Hoodie 01',
      });
      trackEvent('shop_the_look_open', {});
      trackEvent('access_gate_view', {});
      trackEvent('request_access_open', {});
      trackEvent('request_access_attempt', {});
      trackEvent('access_granted', { tier: 'vip' });
    }).not.toThrow();
  });
});

import { describe, expect, test, vi } from 'vitest';
import { getStorefrontClient } from '@/lib/shopify/client';

describe('getStorefrontClient', () => {
  test('throws a clear error when SHOPIFY_STORE_DOMAIN is unset', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', undefined);
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'test-token');
    expect(() => getStorefrontClient()).toThrow(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  });

  test('throws a clear error when SHOPIFY_STOREFRONT_API_TOKEN is unset', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'test-shop.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', undefined);
    expect(() => getStorefrontClient()).toThrow(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  });

  test('returns a configured client when both are set', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'test-shop.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'test-token');
    const client = getStorefrontClient();
    expect(client).toHaveProperty('request');
    expect(typeof client.request).toBe('function');
  });
});

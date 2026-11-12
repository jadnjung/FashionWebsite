import { describe, expect, test } from 'vitest';
import { isShopifyCdnUrl } from '@/lib/shopify/cdn';

describe('isShopifyCdnUrl', () => {
  test('accepts https Shopify CDN URLs', () => {
    expect(isShopifyCdnUrl('https://cdn.shopify.com/s/files/1/item.glb?v=1')).toBe(true);
  });

  test.each([
    ['http://cdn.shopify.com/a.jpg'],
    ['https://cdn.shopify.com.evil.example/a.jpg'],
    ['https://evil.example/cdn.shopify.com/a.jpg'],
    ['https://example.com/a.jpg'],
    ['/preview-demo/product-1.jpg'],
    ['javascript:alert(1)'],
    ['not a url'],
  ])('rejects %s', (url) => {
    expect(isShopifyCdnUrl(url)).toBe(false);
  });
});

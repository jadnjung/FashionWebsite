import { describe, expect, test } from 'vitest';
import { getGarmentTextureUrl, getPlaceholderShape } from '@/lib/home/closet-shape';

describe('getPlaceholderShape', () => {
  test.each([
    ['T-Shirts', 'tee'],
    ['Shirts', 'longsleeve'],
    ['Hoodies', 'longsleeve'],
    ['Sweaters', 'longsleeve'],
    ['Jackets', 'longsleeve'],
    ['Trousers', 'pants'],
    ['Jeans', 'pants'],
    ['Shorts', 'pants'],
    ['Hats', 'generic'],
    ['Jewelry', 'generic'],
    ['Unknown Type', 'generic'],
    ['', 'generic'],
  ])('%s → %s', (productType, shape) => {
    expect(getPlaceholderShape(productType)).toBe(shape);
  });
});

describe('getGarmentTextureUrl', () => {
  test('requests a texture-sized rendition from the Shopify CDN, preserving existing params', () => {
    expect(getGarmentTextureUrl('https://cdn.shopify.com/s/files/1/item.jpg?v=123')).toBe(
      'https://cdn.shopify.com/s/files/1/item.jpg?v=123&width=768',
    );
  });

  test('passes Demo Mode fixture paths through unchanged', () => {
    expect(getGarmentTextureUrl('/preview-demo/product-1.jpg')).toBe('/preview-demo/product-1.jpg');
  });

  test.each([
    ['https://example.com/a.jpg'],
    ['http://cdn.shopify.com/a.jpg'],
    ['https://cdn.shopify.com.evil.example/a.jpg'],
    ['/preview-demo/../../etc/a.jpg'],
    ['/other/a.jpg'],
    ['not a url'],
  ])('rejects %s (renders the untextured placeholder)', (url) => {
    expect(getGarmentTextureUrl(url)).toBeNull();
  });
});

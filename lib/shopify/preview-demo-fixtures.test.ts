import { describe, expect, test } from 'vitest';
import { PREVIEW_PRODUCTS, getPreviewProductDetail } from '@/lib/shopify/preview-demo-fixtures';

describe('PREVIEW_PRODUCTS', () => {
  test('every handle is unique', () => {
    const handles = PREVIEW_PRODUCTS.map((product) => product.handle);
    expect(new Set(handles).size).toBe(handles.length);
  });

  test('every product has at least one image', () => {
    for (const product of PREVIEW_PRODUCTS) {
      expect(product.images.length).toBeGreaterThan(0);
    }
  });

  test('includes at least one sold-out fixture, for scarcity/sold-out UI coverage under Demo Mode', () => {
    expect(PREVIEW_PRODUCTS.some((product) => !product.availableForSale)).toBe(true);
  });
});

describe('getPreviewProductDetail', () => {
  test("returns null for an unrecognized handle, mirroring getProduct's real not-found contract", () => {
    expect(getPreviewProductDetail('does-not-exist')).toBeNull();
  });

  test('maps a known handle to a fully-formed ProductDetail', () => {
    const result = getPreviewProductDetail('preview-featherweight-crewneck');

    expect(result).toEqual({
      id: 'preview-1',
      handle: 'preview-featherweight-crewneck',
      title: 'Featherweight Crewneck Sweater',
      description:
        'Temporary preview placeholder description (free-license stock photography, not final product copy).',
      productType: 'Sweaters',
      tags: [],
      minPrice: { amount: '128.00', currencyCode: 'USD' },
      images: [
        {
          url: '/preview-demo/product-3.jpg',
          altText:
            'Free-license stock photo, temporary preview placeholder — not final product photography.',
          width: 900,
          height: 1125,
        },
      ],
      options: [
        { id: 'opt-size', name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
        { id: 'opt-color', name: 'Color', values: ['Black', 'Ecru'] },
      ],
      variants: [
        {
          id: 'preview-1-variant-1',
          title: 'M / Black',
          availableForSale: true,
          quantityAvailable: 8,
          price: { amount: '128.00', currencyCode: 'USD' },
          selectedOptions: [
            { name: 'Size', value: 'M' },
            { name: 'Color', value: 'Black' },
          ],
        },
      ],
    });
  });

  test('a sold-out fixture maps to an unavailable, zero-quantity variant — not fabricated availability', () => {
    const result = getPreviewProductDetail('preview-relaxed-linen-trouser');

    expect(result?.variants[0]).toMatchObject({
      availableForSale: false,
      quantityAvailable: 0,
    });
  });

  test('every fixture handle in PREVIEW_PRODUCTS resolves to a non-null detail', () => {
    for (const product of PREVIEW_PRODUCTS) {
      expect(getPreviewProductDetail(product.handle)).not.toBeNull();
    }
  });
});

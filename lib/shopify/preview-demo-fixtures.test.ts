import { describe, expect, test } from 'vitest';
import {
  PREVIEW_COLLECTIONS,
  PREVIEW_PRODUCTS,
  getPreviewCollectionDetail,
  getPreviewProductDetail,
  getPreviewProductListItemsByCollection,
  getPreviewProductsByCollection,
} from '@/lib/shopify/preview-demo-fixtures';

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

  // Regression test for D-085: this function previously only ever searched
  // PREVIEW_PRODUCTS, so once collection-002's drop gate is unlocked (D-064),
  // the two real ProductCards its CollectionView renders — built directly
  // from PREVIEW_UPCOMING_PRODUCTS — 404'd on open or Quick Add, because
  // getProduct (and therefore the PDP route and the Quick Add route
  // handler, both of which call it) found no matching entry here.
  test("resolves both PREVIEW_UPCOMING_PRODUCTS handles — collection-002's drop-gate preview cards", () => {
    expect(getPreviewProductDetail('preview-draped-satin-slip')).not.toBeNull();
    expect(getPreviewProductDetail('preview-boxy-denim-jacket')).not.toBeNull();
  });
});

describe('PREVIEW_COLLECTIONS', () => {
  test('every handle is unique', () => {
    const handles = PREVIEW_COLLECTIONS.map((collection) => collection.handle);
    expect(new Set(handles).size).toBe(handles.length);
  });

  test('exactly one entry is archived', () => {
    const archived = PREVIEW_COLLECTIONS.filter(
      (collection) => collection.dropStatus?.toLowerCase() === 'archived',
    );
    expect(archived).toHaveLength(1);
  });
});

describe('getPreviewCollectionDetail', () => {
  test("returns the archived detail for 'collection-000'", () => {
    const result = getPreviewCollectionDetail('collection-000');
    expect(result?.dropStatus).toBe('archived');
    expect(result?.archivedAt).not.toBeNull();
  });

  test("returns the current (non-archived) detail for 'collection-001'", () => {
    const result = getPreviewCollectionDetail('collection-001');
    expect(result?.dropStatus).toBe('active');
    expect(result?.archivedAt).toBeNull();
  });

  test('returns null for an unrecognized handle', () => {
    expect(getPreviewCollectionDetail('does-not-exist')).toBeNull();
  });
});

describe('getPreviewProductsByCollection', () => {
  test("returns the two archive fixtures for 'collection-000'", () => {
    const result = getPreviewProductsByCollection('collection-000');
    expect(result).toHaveLength(2);
    expect(result?.map((p) => p.handle)).toEqual([
      'preview-structured-wool-coat',
      'preview-ribbed-turtleneck',
    ]);
  });

  test("returns the mapped launch products for 'collection-001'", () => {
    const result = getPreviewProductsByCollection('collection-001');
    expect(result).toHaveLength(PREVIEW_PRODUCTS.length);
    expect(
      result?.every((p) => typeof p.description === 'string' && p.description.length > 0),
    ).toBe(true);
  });

  test('returns null for an unrecognized handle', () => {
    expect(getPreviewProductsByCollection('does-not-exist')).toBeNull();
  });
});

describe('getPreviewProductListItemsByCollection', () => {
  // Regression test for a real defect found independently via live Demo
  // Mode verification of the /collections index (ROADMAP.md Phase 11):
  // this function previously had no 'collection-001' case at all, so
  // /collections/collection-001's real, unlocked CollectionView rendered
  // "NOTHING HERE YET." instead of its own real catalog — a fixture-
  // completeness gap from the drop-gate work (D-064), which only ever
  // wired 'collection-002' here, not a defect in the /collections index
  // code itself.
  test("returns PREVIEW_PRODUCTS for 'collection-001' — its own real launch catalog, not an empty list", () => {
    const result = getPreviewProductListItemsByCollection('collection-001');
    expect(result).toHaveLength(PREVIEW_PRODUCTS.length);
    expect(result?.map((p) => p.handle)).toEqual(PREVIEW_PRODUCTS.map((p) => p.handle));
  });

  test("returns the upcoming-drop fixtures for 'collection-002'", () => {
    const result = getPreviewProductListItemsByCollection('collection-002');
    expect(result).toHaveLength(2);
  });

  test('returns null for an unrecognized handle', () => {
    expect(getPreviewProductListItemsByCollection('does-not-exist')).toBeNull();
  });
});

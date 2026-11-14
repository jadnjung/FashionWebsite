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

  test('keeps the richer gallery and variant matrix consistent with the listing', () => {
    const result = getPreviewProductDetail('preview-featherweight-crewneck')!;
    expect(result.images).toEqual(PREVIEW_PRODUCTS[0].images);
    expect(result.images).toHaveLength(3);
    expect(new Set(result.images.map((image) => image.url)).size).toBe(3);
    expect(
      result.images.every((image) => image.altText?.includes('Illustrative stock photo')),
    ).toBe(true);
    expect(
      result.variants.map((variant) => [
        variant.title,
        variant.price.amount,
        variant.availableForSale,
        variant.quantityAvailable,
      ]),
    ).toEqual([
      ['M / Black', '128.00', true, 8],
      ['S / Black', '128.00', true, 3],
      ['L / Black', '128.00', false, 0],
      ['M / Ecru', '136.00', true, 2],
      ['S / Ecru', '136.00', false, 0],
      ['L / Ecru', '140.00', true, 0],
    ]);
    expect(result.variants[0].id).toBe('preview-1-variant-1');
    expect(Math.min(...result.variants.map((variant) => Number(variant.price.amount)))).toBe(
      Number(result.minPrice.amount),
    );
    for (const variant of result.variants) {
      for (const option of variant.selectedOptions) {
        expect(result.options.find((entry) => entry.name === option.name)?.values).toContain(
          option.value,
        );
      }
    }
  });

  test('preserves the single-variant contract for the other fixture products', () => {
    const result = getPreviewProductDetail('preview-tailored-trouser-set')!;
    expect(result.variants).toEqual([
      {
        id: 'preview-2-variant-1',
        title: 'M / Black',
        availableForSale: true,
        quantityAvailable: 8,
        price: { amount: '188.00', currencyCode: 'USD' },
        selectedOptions: [
          { name: 'Size', value: 'M' },
          { name: 'Color', value: 'Black' },
        ],
      },
    ]);
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

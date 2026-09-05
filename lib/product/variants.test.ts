import { describe, expect, test } from 'vitest';
import {
  findMatchingVariant,
  getInitialSelections,
  isOptionValueAvailable,
  isProductSoldOut,
  isSelectionComplete,
} from '@/lib/product/variants';
import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

const SIZE_COLOR_OPTIONS: ProductOption[] = [
  { id: 'opt1', name: 'Size', values: ['S', 'M', 'L'] },
  { id: 'opt2', name: 'Color', values: ['Black Forest'] },
];

const SIZE_COLOR_VARIANTS: ProductVariant[] = [
  {
    id: 'v1',
    title: 'S / Black Forest',
    availableForSale: true,
    quantityAvailable: 5,
    price: { amount: '120.00', currencyCode: 'USD' },
    selectedOptions: [
      { name: 'Size', value: 'S' },
      { name: 'Color', value: 'Black Forest' },
    ],
  },
  {
    id: 'v2',
    title: 'M / Black Forest',
    availableForSale: false,
    quantityAvailable: 0,
    price: { amount: '120.00', currencyCode: 'USD' },
    selectedOptions: [
      { name: 'Size', value: 'M' },
      { name: 'Color', value: 'Black Forest' },
    ],
  },
  {
    id: 'v3',
    title: 'L / Black Forest',
    availableForSale: true,
    quantityAvailable: 2,
    price: { amount: '120.00', currencyCode: 'USD' },
    selectedOptions: [
      { name: 'Size', value: 'L' },
      { name: 'Color', value: 'Black Forest' },
    ],
  },
];

describe('getInitialSelections', () => {
  test('auto-selects a single-value option that is not Size', () => {
    expect(getInitialSelections(SIZE_COLOR_OPTIONS)).toEqual({ Color: 'Black Forest' });
  });

  test('never auto-selects Size, even with only one value (PROJECT.md §39)', () => {
    expect(getInitialSelections([{ id: 'opt1', name: 'Size', values: ['M'] }])).toEqual({});
  });

  test('returns an empty object for a product with no options', () => {
    expect(getInitialSelections([])).toEqual({});
  });
});

describe('findMatchingVariant', () => {
  test('returns null for an incomplete selection', () => {
    expect(findMatchingVariant(SIZE_COLOR_VARIANTS, { Color: 'Black Forest' })).toBeNull();
  });

  test('returns the matching variant for a complete selection', () => {
    expect(findMatchingVariant(SIZE_COLOR_VARIANTS, { Size: 'L', Color: 'Black Forest' })?.id).toBe(
      'v3',
    );
  });

  test('returns null when no variant matches the combination', () => {
    expect(
      findMatchingVariant(SIZE_COLOR_VARIANTS, { Size: 'XL', Color: 'Black Forest' }),
    ).toBeNull();
  });

  test('returns the single variant of an optionless product regardless of (empty) selections', () => {
    const variant: ProductVariant = {
      id: 'default',
      title: 'Default Title',
      availableForSale: true,
      quantityAvailable: 10,
      price: { amount: '50.00', currencyCode: 'USD' },
      selectedOptions: [],
    };
    expect(findMatchingVariant([variant], {})?.id).toBe('default');
  });
});

describe('isOptionValueAvailable', () => {
  test('true for a value some available variant has', () => {
    expect(isOptionValueAvailable(SIZE_COLOR_VARIANTS, 'Size', 'S')).toBe(true);
  });

  test('false for a value only an unavailable variant has', () => {
    expect(isOptionValueAvailable(SIZE_COLOR_VARIANTS, 'Size', 'M')).toBe(false);
  });

  test('false for a value no variant has at all', () => {
    expect(isOptionValueAvailable(SIZE_COLOR_VARIANTS, 'Size', 'XL')).toBe(false);
  });
});

describe('isSelectionComplete', () => {
  test('false when an option has no selection yet', () => {
    expect(isSelectionComplete(SIZE_COLOR_OPTIONS, { Color: 'Black Forest' })).toBe(false);
  });

  test('true when every option has a selection', () => {
    expect(isSelectionComplete(SIZE_COLOR_OPTIONS, { Size: 'S', Color: 'Black Forest' })).toBe(
      true,
    );
  });

  test('true for a product with no options', () => {
    expect(isSelectionComplete([], {})).toBe(true);
  });
});

describe('isProductSoldOut', () => {
  test('false when at least one variant is available', () => {
    expect(isProductSoldOut(SIZE_COLOR_VARIANTS)).toBe(false);
  });

  test('true when every variant is unavailable', () => {
    expect(
      isProductSoldOut(SIZE_COLOR_VARIANTS.map((v) => ({ ...v, availableForSale: false }))),
    ).toBe(true);
  });

  test('false for an empty variants array (defensive — Shopify always returns at least one)', () => {
    expect(isProductSoldOut([])).toBe(false);
  });
});

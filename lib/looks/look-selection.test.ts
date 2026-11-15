import { describe, expect, test } from 'vitest';
import { isLookAddValid, type LookItemSelectionState } from '@/lib/looks/look-selection';
import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

const SIZE_OPTION: ProductOption[] = [{ id: 'opt1', name: 'Size', values: ['S', 'M', 'L'] }];
const VARIANT: ProductVariant = {
  id: 'm',
  title: 'M',
  availableForSale: true,
  quantityAvailable: 0,
  price: { amount: '10', currencyCode: 'USD' },
  selectedOptions: [{ name: 'Size', value: 'M' }],
};

function item(overrides: Partial<LookItemSelectionState> = {}): LookItemSelectionState {
  return {
    included: true,
    options: SIZE_OPTION,
    variants: [VARIANT],
    selections: { Size: 'M' },
    ...overrides,
  };
}

describe('isLookAddValid', () => {
  test('false when no item is included', () => {
    expect(isLookAddValid([item({ included: false }), item({ included: false })])).toBe(false);
  });

  test('true when every included item has a complete selection', () => {
    expect(isLookAddValid([item(), item()])).toBe(true);
  });

  test('false when an included item has an incomplete selection', () => {
    expect(isLookAddValid([item(), item({ selections: {} })])).toBe(false);
  });

  test('excluding an incomplete item makes the remaining selection valid again', () => {
    expect(isLookAddValid([item(), item({ included: false, selections: {} })])).toBe(true);
  });

  test('false for an empty item list', () => {
    expect(isLookAddValid([])).toBe(false);
  });

  test('rejects a complete sold-out or missing combination', () => {
    expect(isLookAddValid([item({ variants: [{ ...VARIANT, availableForSale: false }] })])).toBe(
      false,
    );
    expect(isLookAddValid([item({ selections: { Size: 'S' } })])).toBe(false);
  });

  test('excludes an unavailable piece and accepts explicitly sellable zero stock', () => {
    expect(isLookAddValid([item(), item({ included: false, variants: [] })])).toBe(true);
  });
});

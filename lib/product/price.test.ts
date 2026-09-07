import { describe, expect, test } from 'vitest';
import { formatPrice } from '@/lib/product/price';

describe('formatPrice', () => {
  test('formats a whole-dollar amount as a localized USD string', () => {
    expect(formatPrice({ amount: '180.00', currencyCode: 'USD' })).toBe('$180.00');
  });

  test('formats a fractional amount to two decimal places', () => {
    expect(formatPrice({ amount: '19.5', currencyCode: 'USD' })).toBe('$19.50');
  });
});

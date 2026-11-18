import { describe, expect, it } from 'vitest';
import { getPurchaseAmounts } from './purchase-amounts';

describe('getPurchaseAmounts', () => {
  it.each([
    ['128.00', 1, 128, 128],
    ['128.00', 3, 128, 384],
    ['10.01', 3, 10.01, 30.03],
    ['0.10', 3, 0.1, 0.3],
    ['1.234', 3, 1.234, 3.702],
    ['+1.001e1', 3, 10.01, 30.03],
    ['.1E+1', 3, 1, 3],
    ['10.', 3, 10, 30],
    ['0.000', 3, 0, 0],
    ['-0e9999', 3, 0, 0],
    ['1e-7', 3, 0.0000001, 0.0000003],
    ['1e20', 3, 1e20, 3e20],
  ])('preserves decimal unit and line values for %s times %s', (amount, quantity, price, value) => {
    expect(getPurchaseAmounts(amount, quantity)).toEqual({ price, value });
  });

  it.each([
    '',
    ' ',
    ' 1.00',
    '1.00 ',
    '1\n',
    'NaN',
    'Infinity',
    '0x10',
    '1_000',
    '1e',
    '.',
    '9007199254740993',
    '0.10000000000000001',
    '1e309',
    '1e-324',
    '-0.25',
    '-2.5e-1',
  ])('omits invalid or non-round-tripping unit amount %j', (amount) => {
    expect(getPurchaseAmounts(amount, 3)).toBeNull();
  });

  it('omits an unrepresentable line value even when the unit price round-trips', () => {
    expect(getPurchaseAmounts('9007199254740991', 3)).toBeNull();
    expect(getPurchaseAmounts('1e308', 3)).toBeNull();
  });

  it('bounds optional decimal parsing before processing oversized input', () => {
    expect(getPurchaseAmounts(`1.${'0'.repeat(510)}`, 3)).toEqual({ price: 1, value: 3 });
    expect(getPurchaseAmounts(`1.${'0'.repeat(511)}`, 3)).toBeNull();
    expect(getPurchaseAmounts(`1.${'0'.repeat(10_000)}`, 3)).toBeNull();
  });

  it.each([null, undefined, 0, true, {}, []])('omits non-string amount %j', (amount) => {
    expect(getPurchaseAmounts(amount, 1)).toBeNull();
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'omits telemetry for invalid or unsafe quantity %s',
    (quantity) => {
      expect(getPurchaseAmounts('10.01', quantity)).toBeNull();
    },
  );
});

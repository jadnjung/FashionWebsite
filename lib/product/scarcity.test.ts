import { describe, expect, test } from 'vitest';
import { getScarcityLabel, getScarcityStatus } from '@/lib/product/scarcity';

describe('getScarcityStatus', () => {
  test('unavailable variant is always sold-out, regardless of quantity', () => {
    expect(getScarcityStatus(5, false)).toEqual({ level: 'sold-out' });
    expect(getScarcityStatus(null, false)).toEqual({ level: 'sold-out' });
  });

  test('unknown quantity on an available variant renders nothing — never fabricated', () => {
    expect(getScarcityStatus(null, true)).toBeNull();
  });

  test('zero quantity on an otherwise-available variant is sold-out', () => {
    expect(getScarcityStatus(0, true)).toEqual({ level: 'sold-out' });
  });

  test('1 to 3 remaining is the exact-count "final" tier', () => {
    expect(getScarcityStatus(1, true)).toEqual({ level: 'final', count: 1 });
    expect(getScarcityStatus(3, true)).toEqual({ level: 'final', count: 3 });
  });

  test('4 to 10 remaining is "low", with no exact count', () => {
    expect(getScarcityStatus(4, true)).toEqual({ level: 'low' });
    expect(getScarcityStatus(10, true)).toEqual({ level: 'low' });
  });

  test('above 10 remaining renders nothing — not scarce enough to mention', () => {
    expect(getScarcityStatus(11, true)).toBeNull();
    expect(getScarcityStatus(500, true)).toBeNull();
  });
});

describe('getScarcityLabel', () => {
  test('maps each tier to CONTENT.md §8 vocabulary', () => {
    expect(getScarcityLabel({ level: 'sold-out' })).toBe('SOLD OUT');
    expect(getScarcityLabel({ level: 'final', count: 2 })).toBe('2 REMAIN');
    expect(getScarcityLabel({ level: 'low' })).toBe('LOW STOCK');
  });

  test('null status maps to null label', () => {
    expect(getScarcityLabel(null)).toBeNull();
  });
});

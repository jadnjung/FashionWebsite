import { describe, expect, test } from 'vitest';
import { getGridItemLayout } from '@/lib/catalog/grid-layout';

describe('getGridItemLayout', () => {
  test('the first item, and every third item after it, is featured', () => {
    expect(getGridItemLayout(0)).toBe('featured');
    expect(getGridItemLayout(3)).toBe('featured');
    expect(getGridItemLayout(6)).toBe('featured');
  });

  test('every other item is standard', () => {
    expect(getGridItemLayout(1)).toBe('standard');
    expect(getGridItemLayout(2)).toBe('standard');
    expect(getGridItemLayout(4)).toBe('standard');
    expect(getGridItemLayout(5)).toBe('standard');
  });
});

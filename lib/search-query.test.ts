import { describe, expect, test } from 'vitest';
import {
  MAX_SEARCH_QUERY_LENGTH,
  MIN_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from './search-query';

describe('search query contract', () => {
  test('trims without changing pasted or composed characters', () => {
    expect(normalizeSearchQuery('  café 針織  ')).toBe('café 針織');
    expect(normalizeSearchQuery('e\u0301')).toBe('e\u0301');
  });

  test('preserves overlong input so it can be explained instead of silently searched differently', () => {
    expect(MIN_SEARCH_QUERY_LENGTH).toBe(2);
    expect(MAX_SEARCH_QUERY_LENGTH).toBe(100);
    for (const length of [99, 100, 101]) {
      expect(normalizeSearchQuery('a'.repeat(length))).toHaveLength(length);
    }
  });
});

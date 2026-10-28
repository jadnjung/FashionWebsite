import { describe, expect, test } from 'vitest';
import { getGridItemLayout, isUnpairedTrailingStandardAtMd } from '@/lib/catalog/grid-layout';

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

describe('isUnpairedTrailingStandardAtMd', () => {
  test('N=2: the trailing (and only) standard has no pairing partner', () => {
    expect(isUnpairedTrailingStandardAtMd(1, 2)).toBe(true);
    expect(isUnpairedTrailingStandardAtMd(0, 2)).toBe(false);
  });

  test('N=3: the trailing standard is the second of a complete pair — no gap', () => {
    expect(isUnpairedTrailingStandardAtMd(2, 3)).toBe(false);
  });

  test('N=4: the trailing item is featured (always fills its own row) — never a gap', () => {
    expect(isUnpairedTrailingStandardAtMd(3, 4)).toBe(false);
  });

  test('N=5: the trailing standard is unpaired (index 4), the one before it is not', () => {
    expect(isUnpairedTrailingStandardAtMd(4, 5)).toBe(true);
    expect(isUnpairedTrailingStandardAtMd(3, 5)).toBe(false);
  });

  test('N=6: the trailing standard is the second of a complete pair — no gap', () => {
    expect(isUnpairedTrailingStandardAtMd(5, 6)).toBe(false);
  });

  test('N=7: the trailing item is featured — never a gap', () => {
    expect(isUnpairedTrailingStandardAtMd(6, 7)).toBe(false);
  });

  test('N=8: the trailing standard is unpaired (index 7)', () => {
    expect(isUnpairedTrailingStandardAtMd(7, 8)).toBe(true);
  });

  test('a standard item mid-array (not the last item) is never flagged, even at the same residue', () => {
    // N=8, index 1 is also `standard` with index % 3 === 1, same residue as
    // the true-case above — confirms the predicate checks "is the last
    // item", not just the modulo, in isolation.
    expect(isUnpairedTrailingStandardAtMd(1, 8)).toBe(false);
  });
});

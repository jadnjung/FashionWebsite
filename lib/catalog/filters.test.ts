import { describe, expect, test } from 'vitest';
import {
  buildFilterHref,
  buildProductSearchQuery,
  getSortVariables,
  hasActiveFilters,
  parseCatalogFilters,
} from '@/lib/catalog/filters';

describe('parseCatalogFilters', () => {
  test('defaults to the given defaultSort, unavailable, and no price bounds', () => {
    expect(parseCatalogFilters({}, 'featured')).toEqual({
      sort: 'featured',
      available: false,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  test('honors a category-specific default sort (e.g. New defaults to newest)', () => {
    expect(parseCatalogFilters({}, 'newest').sort).toBe('newest');
  });

  test('reads a valid sort param', () => {
    expect(parseCatalogFilters({ sort: 'price-desc' }, 'featured').sort).toBe('price-desc');
  });

  test('falls back to defaultSort for an unrecognized sort value', () => {
    expect(parseCatalogFilters({ sort: 'bogus' }, 'featured').sort).toBe('featured');
  });

  test('reads available=1 as true, and its absence as false', () => {
    expect(parseCatalogFilters({ available: '1' }, 'featured').available).toBe(true);
    expect(parseCatalogFilters({}, 'featured').available).toBe(false);
    expect(parseCatalogFilters({ available: '0' }, 'featured').available).toBe(false);
  });

  test('parses valid min/max price', () => {
    expect(parseCatalogFilters({ minPrice: '50', maxPrice: '200' }, 'featured')).toMatchObject({
      minPrice: 50,
      maxPrice: 200,
    });
  });

  test('ignores a non-numeric price param', () => {
    expect(parseCatalogFilters({ minPrice: 'free' }, 'featured').minPrice).toBeUndefined();
  });

  test('ignores a negative price param', () => {
    expect(parseCatalogFilters({ minPrice: '-10' }, 'featured').minPrice).toBeUndefined();
  });

  test('drops a contradictory range (max below min) rather than silently returning zero results', () => {
    const filters = parseCatalogFilters({ minPrice: '200', maxPrice: '50' }, 'featured');
    expect(filters.minPrice).toBe(200);
    expect(filters.maxPrice).toBeUndefined();
  });

  test('takes the first value when a param is given more than once', () => {
    expect(parseCatalogFilters({ sort: ['newest', 'price-asc'] }, 'featured').sort).toBe('newest');
  });
});

describe('getSortVariables', () => {
  test('featured has no sortKey (no true curation at the root-query level — see D-023)', () => {
    expect(getSortVariables('featured')).toEqual({ sortKey: undefined, reverse: false });
  });

  test('newest sorts by CREATED_AT, reversed', () => {
    expect(getSortVariables('newest')).toEqual({ sortKey: 'CREATED_AT', reverse: true });
  });

  test('price-asc sorts by PRICE, not reversed', () => {
    expect(getSortVariables('price-asc')).toEqual({ sortKey: 'PRICE', reverse: false });
  });

  test('price-desc sorts by PRICE, reversed', () => {
    expect(getSortVariables('price-desc')).toEqual({ sortKey: 'PRICE', reverse: true });
  });
});

describe('buildProductSearchQuery', () => {
  test('returns undefined when nothing is being filtered', () => {
    expect(buildProductSearchQuery({})).toBeUndefined();
  });

  test('a single product type is not wrapped in parentheses', () => {
    expect(buildProductSearchQuery({ productTypes: ['Hoodies'] })).toBe('product_type:"Hoodies"');
  });

  test('multiple product types are OR-joined and parenthesized', () => {
    expect(buildProductSearchQuery({ productTypes: ['T-Shirts', 'Shirts'] })).toBe(
      '(product_type:"T-Shirts" OR product_type:"Shirts")',
    );
  });

  test('availability alone', () => {
    expect(buildProductSearchQuery({ available: true })).toBe('available_for_sale:true');
  });

  test('price bounds alone, and together', () => {
    expect(buildProductSearchQuery({ minPrice: 50 })).toBe('variants.price:>=50');
    expect(buildProductSearchQuery({ maxPrice: 200 })).toBe('variants.price:<=200');
    expect(buildProductSearchQuery({ minPrice: 50, maxPrice: 200 })).toBe(
      'variants.price:>=50 AND variants.price:<=200',
    );
  });

  test('every clause combines with explicit AND, in a stable order', () => {
    expect(
      buildProductSearchQuery({
        productTypes: ['Hoodies', 'Jackets'],
        available: true,
        minPrice: 50,
        maxPrice: 200,
      }),
    ).toBe(
      '(product_type:"Hoodies" OR product_type:"Jackets") AND available_for_sale:true AND variants.price:>=50 AND variants.price:<=200',
    );
  });

  test('an explicit empty productTypes array is treated the same as none', () => {
    expect(buildProductSearchQuery({ productTypes: [] })).toBeUndefined();
  });
});

describe('hasActiveFilters', () => {
  test('false when sort matches the default and nothing else is set', () => {
    expect(
      hasActiveFilters(
        { sort: 'featured', available: false, minPrice: undefined, maxPrice: undefined },
        'featured',
      ),
    ).toBe(false);
  });

  test("false for New's own default sort (newest) with nothing else set", () => {
    expect(
      hasActiveFilters(
        { sort: 'newest', available: false, minPrice: undefined, maxPrice: undefined },
        'newest',
      ),
    ).toBe(false);
  });

  test('true when sort differs from the default', () => {
    expect(
      hasActiveFilters(
        { sort: 'newest', available: false, minPrice: undefined, maxPrice: undefined },
        'featured',
      ),
    ).toBe(true);
  });

  test('true when availability or a price bound is set, even with the default sort', () => {
    expect(
      hasActiveFilters(
        { sort: 'featured', available: true, minPrice: undefined, maxPrice: undefined },
        'featured',
      ),
    ).toBe(true);
    expect(
      hasActiveFilters(
        { sort: 'featured', available: false, minPrice: 50, maxPrice: undefined },
        'featured',
      ),
    ).toBe(true);
  });
});

describe('buildFilterHref', () => {
  test('adds a param to a path with none', () => {
    expect(buildFilterHref('/tops', {}, { sort: 'newest' })).toBe('/tops?sort=newest');
  });

  test('preserves existing params while changing one', () => {
    expect(buildFilterHref('/tops', { sort: ['featured'] }, { available: '1' })).toBe(
      '/tops?sort=featured&available=1',
    );
  });

  test('removes a param when the change value is undefined', () => {
    expect(
      buildFilterHref('/tops', { sort: ['newest'], available: ['1'] }, { available: undefined }),
    ).toBe('/tops?sort=newest');
  });

  test('returns the bare path when no params remain', () => {
    expect(buildFilterHref('/tops', {}, {})).toBe('/tops');
  });
});

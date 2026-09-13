import { describe, expect, test } from 'vitest';
import {
  getCategoryForProductType,
  getCategoryLabel,
  getCategoryProductTypes,
  getSubcategoryLabel,
  getSubcategoryProductType,
} from '@/lib/catalog/taxonomy';

describe('getCategoryProductTypes', () => {
  test('returns the real Tops subcategory labels as product types', () => {
    expect(getCategoryProductTypes('tops')).toEqual([
      'T-Shirts',
      'Shirts',
      'Hoodies',
      'Sweaters',
      'Jackets',
    ]);
  });

  test('returns the real Bottoms subcategory labels as product types', () => {
    expect(getCategoryProductTypes('bottoms')).toEqual([
      'Jeans',
      'Trousers',
      'Shorts',
      'Sweatpants',
    ]);
  });

  test('returns the real Etc. subcategory labels as product types', () => {
    expect(getCategoryProductTypes('etc')).toEqual(['Hats', 'Jewelry']);
  });

  test('returns null for New — it has no product-type filter, only a sort default', () => {
    expect(getCategoryProductTypes('new')).toBeNull();
  });
});

describe('getSubcategoryProductType', () => {
  test('maps a real subcategory slug to its product type', () => {
    expect(getSubcategoryProductType('tops', 'hoodies')).toBe('Hoodies');
    expect(getSubcategoryProductType('bottoms', 'jeans')).toBe('Jeans');
    expect(getSubcategoryProductType('etc', 'jewelry')).toBe('Jewelry');
  });

  test('returns null for an unknown subcategory slug', () => {
    expect(getSubcategoryProductType('tops', 'not-a-real-subcategory')).toBeNull();
  });

  test('returns null when asked for a subcategory under a category that has none', () => {
    expect(getSubcategoryProductType('new', 'anything')).toBeNull();
  });
});

describe('getCategoryLabel', () => {
  test('returns the real NAVIGATION label for each category', () => {
    expect(getCategoryLabel('new')).toBe('NEW');
    expect(getCategoryLabel('tops')).toBe('TOPS');
    expect(getCategoryLabel('bottoms')).toBe('BOTTOMS');
    expect(getCategoryLabel('etc')).toBe('ETC.');
  });
});

describe('getSubcategoryLabel', () => {
  test('returns the real subcategory label', () => {
    expect(getSubcategoryLabel('tops', 'hoodies')).toBe('Hoodies');
  });

  test('returns null for an unknown subcategory slug', () => {
    expect(getSubcategoryLabel('tops', 'not-a-real-subcategory')).toBeNull();
  });
});

describe('getCategoryForProductType', () => {
  test('maps a real Tops product type back to its category/subcategory', () => {
    expect(getCategoryForProductType('Hoodies')).toEqual({
      category: 'tops',
      categoryLabel: 'TOPS',
      subcategoryLabel: 'Hoodies',
      subcategoryHref: '/tops/hoodies',
    });
  });

  test('maps a real Bottoms product type back to its category/subcategory', () => {
    expect(getCategoryForProductType('Jeans')).toEqual({
      category: 'bottoms',
      categoryLabel: 'BOTTOMS',
      subcategoryLabel: 'Jeans',
      subcategoryHref: '/bottoms/jeans',
    });
  });

  test('maps a real Etc. product type back to its category/subcategory', () => {
    expect(getCategoryForProductType('Jewelry')).toEqual({
      category: 'etc',
      categoryLabel: 'ETC.',
      subcategoryLabel: 'Jewelry',
      subcategoryHref: '/etc/jewelry',
    });
  });

  test('returns null for a productType with no matching subcategory', () => {
    expect(getCategoryForProductType('Not A Real Product Type')).toBeNull();
  });
});

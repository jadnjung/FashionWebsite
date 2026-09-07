import { describe, expect, it } from 'vitest';
import { getProductViewTransitionName } from './view-transition';

describe('getProductViewTransitionName', () => {
  it('prefixes an already-safe handle', () => {
    expect(getProductViewTransitionName('hoodie-01')).toBe('esque-product-hoodie-01');
  });

  it('sanitizes characters outside [a-zA-Z0-9-_] to a hyphen', () => {
    expect(getProductViewTransitionName('hoodie 01!')).toBe('esque-product-hoodie-01-');
  });

  it('produces different names for different handles', () => {
    expect(getProductViewTransitionName('hoodie-01')).not.toBe(
      getProductViewTransitionName('hoodie-02'),
    );
  });

  it('preserves underscores (a valid custom-ident character)', () => {
    expect(getProductViewTransitionName('hoodie_01')).toBe('esque-product-hoodie_01');
  });
});

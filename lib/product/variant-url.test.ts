import { describe, expect, test } from 'vitest';
import { getProductVariantHref, getVariantSelections } from './variant-url';
import type { ProductVariant } from '@/lib/shopify/products';

const options = [{ id: 'size', name: 'Size', values: ['S', 'M'] }];
const variant: ProductVariant = {
  id: 'gid://shopify/ProductVariant/12',
  title: 'M',
  availableForSale: true,
  quantityAvailable: 0,
  price: { amount: '10', currencyCode: 'USD' },
  selectedOptions: [{ name: 'Size', value: 'M' }],
};

describe('variant URL contract', () => {
  test('encodes a full variant ID and roundtrips through URLSearchParams', () => {
    const url = new URL(getProductVariantHref('crewneck', variant.id), 'https://esque.test');
    expect(url.pathname).toBe('/products/crewneck');
    expect(url.searchParams.get('variant')).toBe(variant.id);
    expect(getVariantSelections(options, [variant], url.searchParams.get('variant'))).toEqual({
      Size: 'M',
    });
  });
  test('rejects foreign, malformed and absent variant IDs without guessing a size', () => {
    for (const id of [null, '', 'foreign', '<script>'])
      expect(getVariantSelections(options, [variant], id)).toBeNull();
    expect(
      getVariantSelections(
        options,
        [{ ...variant, selectedOptions: [{ name: 'Size', value: 'XXL' }] }],
        variant.id,
      ),
    ).toBeNull();
  });
  test('restores intentional sold-out selections', () => {
    expect(
      getVariantSelections(options, [{ ...variant, availableForSale: false }], variant.id),
    ).toEqual({ Size: 'M' });
  });
});

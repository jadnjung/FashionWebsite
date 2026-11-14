import { describe, expect, it } from 'vitest';
import {
  applyDemoCartOperation,
  buildDemoCart,
  parseCartLines,
  restoreDemoCart,
  type CartLineInput,
} from '@/lib/cart/demo-cart';

const crewneck: CartLineInput = {
  handle: 'preview-featherweight-crewneck',
  variantId: 'preview-1-variant-1',
  quantity: 2,
};

describe('demo cart boundary', () => {
  it('returns canonical selected variant details and exact minor-unit totals', () => {
    const cart = buildDemoCart([crewneck]);
    expect(cart.totalQuantity).toBe(2);
    expect(cart.subtotal).toEqual({ amount: '256.00', currencyCode: 'USD' });
    expect(cart.lines[0]).toMatchObject({
      ...crewneck,
      title: 'Featherweight Crewneck Sweater',
      selectedOptions: [
        { name: 'Size', value: 'M' },
        { name: 'Color', value: 'Black' },
      ],
      unitPrice: { amount: '128.00', currencyCode: 'USD' },
    });
  });

  it('merges duplicate variant references and checks their combined quantity', () => {
    expect(buildDemoCart([crewneck, crewneck]).lines[0].quantity).toBe(4);
    expect(() => buildDemoCart([{ ...crewneck, quantity: 7 }, crewneck])).toThrow(
      'quantity_unavailable',
    );
  });

  it('rejects unknown products, variants, unavailable variants and mismatched variant ownership', () => {
    expect(() => buildDemoCart([{ ...crewneck, handle: 'unknown' }])).toThrow(
      'variant_unavailable',
    );
    expect(() => buildDemoCart([{ ...crewneck, variantId: 'preview-2-variant-1' }])).toThrow(
      'variant_unavailable',
    );
    expect(() => buildDemoCart([{ ...crewneck, variantId: 'preview-1-variant-3' }])).toThrow(
      'variant_unavailable',
    );
  });

  it('supports sellable zero-stock variants without inventing an inventory cap', () => {
    expect(
      buildDemoCart([{ ...crewneck, variantId: 'preview-1-variant-6', quantity: 2 }]).subtotal
        .amount,
    ).toBe('280.00');
  });

  it('rejects malformed, fractional, unsafe and oversized inputs', () => {
    for (const quantity of [0, -1, 1.5, 100, Infinity, '2']) {
      expect(() => parseCartLines([{ ...crewneck, quantity }])).toThrow('invalid_cart');
    }
    expect(() => parseCartLines(Array.from({ length: 51 }, () => crewneck))).toThrow(
      'invalid_cart',
    );
    expect(() => parseCartLines([{ ...crewneck, handle: '../private' }])).toThrow('invalid_cart');
    expect(parseCartLines([])).toEqual([]);
    expect(() => parseCartLines(null)).toThrow('invalid_cart');
  });

  it('treats replacement requests as idempotent and returns an honest empty cart', () => {
    expect(buildDemoCart([crewneck])).toEqual(buildDemoCart([crewneck]));
    expect(buildDemoCart([])).toEqual({
      mode: 'demo',
      lines: [],
      totalQuantity: 0,
      subtotal: { amount: '0.00', currencyCode: 'USD' },
      recoveryLines: [],
    });
  });

  it('restores valid lines while preserving unavailable and overstock references for explicit removal', () => {
    const overstock = { ...crewneck, variantId: 'preview-1-variant-4', quantity: 3 };
    const unavailable = { ...crewneck, variantId: 'preview-1-variant-3', quantity: 1 };
    const cart = restoreDemoCart([crewneck, overstock, unavailable]);
    expect(cart.lines).toHaveLength(1);
    expect(cart.subtotal.amount).toBe('256.00');
    expect(cart.recoveryLines).toMatchObject([overstock, unavailable]);
    const added = applyDemoCartOperation([crewneck, overstock, unavailable], {
      type: 'add',
      items: [
        { handle: 'preview-fluid-knit-long-sleeve', variantId: 'preview-3-variant-1', quantity: 1 },
      ],
    });
    expect(added.lines).toHaveLength(2);
    expect(added.recoveryLines).toHaveLength(2);
    const removed = applyDemoCartOperation([crewneck, overstock], {
      type: 'remove',
      variantId: overstock.variantId,
    });
    expect(removed.lines[0].quantity).toBe(2);
    expect(removed.recoveryLines).toEqual([]);
  });
});

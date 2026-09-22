import { describe, expect, it, vi } from 'vitest';
import {
  dispatchAnalyticsEvent,
  isKnownAnalyticsEvent,
  sanitizeEventProperties,
  type AnalyticsEventName,
} from './events';

describe('isKnownAnalyticsEvent', () => {
  it('accepts every documented event name', () => {
    const names: AnalyticsEventName[] = [
      'view_item',
      'add_to_bag_click',
      'quick_add_open',
      'quick_add_click',
      'variant_selected',
      'add_to_wishlist',
      'category_nav_click',
      'search',
      'hotspot_selected',
      'shop_the_look_open',
      'access_gate_view',
      'request_access_open',
      'request_access_attempt',
      'access_granted',
    ];
    for (const name of names) {
      expect(isKnownAnalyticsEvent(name)).toBe(true);
    }
  });

  it('rejects an unknown/typo’d event name', () => {
    expect(isKnownAnalyticsEvent('produtc_view')).toBe(false);
    expect(isKnownAnalyticsEvent('add_to_cart')).toBe(false);
    expect(isKnownAnalyticsEvent('')).toBe(false);
  });
});

describe('sanitizeEventProperties', () => {
  it('returns the same reference untouched when nothing needs stripping', () => {
    const properties = { item_id: 'hoodie-01', item_name: 'Hoodie 01' };
    expect(sanitizeEventProperties(properties)).toBe(properties);
  });

  it('strips a PII-shaped key (email) before sending', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = sanitizeEventProperties({ tier: 'general', email: 'visitor@example.com' });
    expect(result).toEqual({ tier: 'general' });
    expect(result).not.toHaveProperty('email');
    warnSpy.mockRestore();
  });

  it('strips PII-shaped keys case-insensitively (Email, PASSWORD, firstName)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = sanitizeEventProperties({
      Email: 'a@b.com',
      PASSWORD: 'hunter2',
      firstName: 'Jamie',
      region: 'top',
    });
    expect(result).toEqual({ region: 'top' });
    warnSpy.mockRestore();
  });

  it('never mutates the input object', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = { email: 'a@b.com', tier: 'vip' };
    sanitizeEventProperties(input);
    expect(input).toEqual({ email: 'a@b.com', tier: 'vip' });
    warnSpy.mockRestore();
  });
});

describe('dispatchAnalyticsEvent', () => {
  it('calls the sink with the event name and sanitized properties', () => {
    const sink = vi.fn();
    dispatchAnalyticsEvent('access_granted', { tier: 'general' }, sink);
    expect(sink).toHaveBeenCalledWith('access_granted', { tier: 'general' });
  });

  it('dispatches a real search event with search_term and result_count', () => {
    const sink = vi.fn();
    dispatchAnalyticsEvent('search', { search_term: 'hoodie', result_count: 3 }, sink);
    expect(sink).toHaveBeenCalledWith('search', { search_term: 'hoodie', result_count: 3 });
  });

  it('dispatches quick_add_open with item_id and item_name', () => {
    const sink = vi.fn();
    dispatchAnalyticsEvent(
      'quick_add_open',
      { item_id: 'hoodie-01', item_name: 'Hoodie 01' },
      sink,
    );
    expect(sink).toHaveBeenCalledWith('quick_add_open', {
      item_id: 'hoodie-01',
      item_name: 'Hoodie 01',
    });
  });

  it('dispatches variant_selected with the new quick_add context value', () => {
    const sink = vi.fn();
    dispatchAnalyticsEvent(
      'variant_selected',
      { item_id: 'hoodie-01', option_name: 'Size', option_value: 'M', context: 'quick_add' },
      sink,
    );
    expect(sink).toHaveBeenCalledWith('variant_selected', {
      item_id: 'hoodie-01',
      option_name: 'Size',
      option_value: 'M',
      context: 'quick_add',
    });
  });

  it('dispatches add_to_wishlist with the standard GA4 items shape', () => {
    const sink = vi.fn();
    dispatchAnalyticsEvent(
      'add_to_wishlist',
      {
        currency: 'USD',
        value: 180,
        items: [{ item_id: 'hoodie-01', item_name: 'Hoodie 01', price: 180 }],
      },
      sink,
    );
    expect(sink).toHaveBeenCalledWith('add_to_wishlist', {
      currency: 'USD',
      value: 180,
      items: [{ item_id: 'hoodie-01', item_name: 'Hoodie 01', price: 180 }],
    });
  });

  it('dispatches quick_add_click with the on-grid region value', () => {
    const sink = vi.fn();
    dispatchAnalyticsEvent(
      'quick_add_click',
      {
        currency: 'USD',
        value: 128,
        items: [{ item_id: 'hoodie-01', item_name: 'Hoodie 01' }],
        region: 'product_card',
      },
      sink,
    );
    expect(sink).toHaveBeenCalledWith(
      'quick_add_click',
      expect.objectContaining({ region: 'product_card' }),
    );
  });

  it('strips PII-shaped properties before they ever reach the sink', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sink = vi.fn();
    dispatchAnalyticsEvent(
      'hotspot_selected',
      // Cast used only to simulate a bypass of the type system (e.g. a
      // spread of a broader object) — real call sites can't construct this.
      { region: 'top', item_id: 'hoodie-01', item_name: 'Hoodie 01', email: 'a@b.com' } as never,
      sink,
    );
    expect(sink).toHaveBeenCalledWith('hotspot_selected', {
      region: 'top',
      item_id: 'hoodie-01',
      item_name: 'Hoodie 01',
    });
    warnSpy.mockRestore();
  });

  it('does not call the sink for an unknown event name', () => {
    const sink = vi.fn();
    dispatchAnalyticsEvent('not_a_real_event' as AnalyticsEventName, {} as never, sink);
    expect(sink).not.toHaveBeenCalled();
  });

  it('never throws when the sink itself throws', () => {
    const sink = vi.fn(() => {
      throw new Error('network error');
    });
    expect(() => dispatchAnalyticsEvent('request_access_open', {}, sink)).not.toThrow();
    expect(sink).toHaveBeenCalled();
  });
});

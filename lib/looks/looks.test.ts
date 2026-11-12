import { describe, expect, test, vi } from 'vitest';
import { getHomepageLooks } from '@/lib/looks/looks';
import * as looksModule from '@/lib/shopify/looks';

describe('getHomepageLooks', () => {
  test('returns the looks getLooks resolves', async () => {
    const look = { handle: 'look-01', title: null, image: null, products: [] };
    vi.spyOn(looksModule, 'getLooks').mockResolvedValue([look]);
    await expect(getHomepageLooks()).resolves.toEqual([look]);
  });

  test('resolves to an empty list and logs, rather than throwing, when Shopify fails', async () => {
    const error = new Error('not configured');
    vi.spyOn(looksModule, 'getLooks').mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(getHomepageLooks()).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Shop the Look'), error);
  });
});

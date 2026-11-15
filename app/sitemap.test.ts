import { afterEach, expect, test, vi } from 'vitest';
import sitemap from './sitemap';
import { getProducts } from '@/lib/shopify/products';
import { getCollections } from '@/lib/shopify/collections';
vi.mock('@/lib/shopify/products', () => ({ getProducts: vi.fn() }));
vi.mock('@/lib/shopify/collections', () => ({ getCollections: vi.fn() }));
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});
test('enumerates product pages and eligible collection routes without fabricated dates', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  vi.mocked(getProducts)
    .mockResolvedValueOnce({
      products: [{ handle: 'one' }] as never,
      hasNextPage: true,
      endCursor: 'next',
    })
    .mockResolvedValueOnce({
      products: [{ handle: 'two' }] as never,
      hasNextPage: false,
      endCursor: null,
    });
  vi.mocked(getCollections).mockResolvedValue({
    collections: [
      { handle: 'current', dropStatus: null, dropDate: null, archivedAt: null },
      { handle: 'past', dropStatus: 'archived', dropDate: null, archivedAt: '2026-01-01' },
      { handle: 'future', dropStatus: null, dropDate: '2099-01-01', archivedAt: null },
    ] as never,
    hasNextPage: false,
    endCursor: null,
  });
  const result = await sitemap();
  const paths = result.map((item) => new URL(item.url).pathname);
  expect(paths).toEqual(
    expect.arrayContaining([
      '/products/one',
      '/products/two',
      '/collections/current',
      '/archive/past',
    ]),
  );
  expect(paths).not.toContain('/collections/future');
  expect(paths).not.toContain('/archive/future');
  expect(paths).not.toContain('/collections/past');
  expect(result.every((item) => item.lastModified === undefined)).toBe(true);
  expect(getProducts).toHaveBeenLastCalledWith({ first: 100, after: 'next' });
});
test('unconfigured mode emits static entries without reaching commerce', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '');
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', '');
  vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', '');
  expect((await sitemap()).length).toBeGreaterThan(5);
  expect(getProducts).not.toHaveBeenCalled();
});
test('repeated continuation is an observable error', async () => {
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  vi.mocked(getProducts).mockResolvedValue({ products: [], hasNextPage: true, endCursor: 'same' });
  await expect(sitemap()).rejects.toThrow('cursor did not advance');
});

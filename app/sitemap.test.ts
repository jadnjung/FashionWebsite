import { afterEach, expect, test, vi } from 'vitest';
import sitemap, { revalidate } from './sitemap';
import { getProducts } from '@/lib/shopify/products';
import { getCollections } from '@/lib/shopify/collections';
vi.mock('@/lib/shopify/products', () => ({ getProducts: vi.fn() }));
vi.mock('@/lib/shopify/collections', () => ({ getCollections: vi.fn() }));
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
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

test('regeneration re-reads publication and lifecycle facts and recovers after a failed read', async () => {
  expect(revalidate).toBe(60);
  vi.stubEnv('PREVIEW_DEMO_MODE', '1');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-20T11:59:59Z'));
  vi.mocked(getProducts).mockResolvedValue({
    products: [{ handle: 'existing' }] as never,
    hasNextPage: false,
    endCursor: null,
  });
  vi.mocked(getCollections).mockResolvedValue({
    collections: [
      { handle: 'release', dropStatus: null, dropDate: '2026-11-20T12:00:00Z', archivedAt: null },
    ] as never,
    hasNextPage: false,
    endCursor: null,
  });
  const before = await sitemap();
  expect(before.some((item) => item.url.endsWith('/collections/release'))).toBe(false);
  vi.setSystemTime(new Date('2026-11-20T12:01:00Z'));
  vi.mocked(getProducts).mockRejectedValueOnce(new Error('Synthetic temporary failure'));
  await expect(sitemap()).rejects.toThrow('Synthetic temporary failure');
  vi.mocked(getProducts).mockResolvedValue({
    products: [{ handle: 'newly-published' }] as never,
    hasNextPage: false,
    endCursor: null,
  });
  const refreshed = await sitemap();
  expect(refreshed.some((item) => item.url.endsWith('/collections/release'))).toBe(true);
  expect(refreshed.some((item) => item.url.endsWith('/products/newly-published'))).toBe(true);
  expect(refreshed.some((item) => item.url.endsWith('/products/existing'))).toBe(false);
});

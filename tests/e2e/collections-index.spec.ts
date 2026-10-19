import { test, expect } from '@playwright/test';

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env sets only
// the Klaviyo fixtures) — every route below therefore calls a genuinely
// unconfigured Shopify client. This mirrors archive.spec.ts's/catalog.spec.ts's/
// pdp.spec.ts's already-established precedent and is the honest limit of
// what's E2E-verifiable without a live store. Populated-state coverage
// (Demo Mode: collection-000 archived, collection-001 current,
// collection-002 upcoming) is verified manually, not committed here —
// playwright.config.ts has one shared webServer with a fixed env block, so
// the Demo-Mode-ON path cannot be a permanent, committed Playwright test —
// see D-057/D-058/D-060/D-062's established technique.
test.describe('collections index — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/collections');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });

  test('has a real, on-brand <title>, independent of the Shopify call failing', async ({
    page,
  }) => {
    await page.goto('/collections');
    await expect(page).toHaveTitle(/collections/i);
  });
});

test.describe('sitemap', () => {
  test('sitemap.xml lists /collections', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('/collections');
  });
});

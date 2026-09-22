import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env sets only
// the access-gate/Klaviyo fixtures) — every route below therefore calls a
// genuinely unconfigured Shopify client. This mirrors catalog.spec.ts's/
// pdp.spec.ts's already-established precedent and is the honest limit of
// what's E2E-verifiable without a live store — see the design spec's
// Testing section. Populated-state coverage (Demo Mode) is verified
// manually per the implementation plan's Task 14, not committed here
// (playwright.config.ts has one shared webServer with a fixed env block,
// so the Demo-Mode-ON path cannot be a permanent, committed Playwright
// test — see D-057/D-058/D-060's established technique).
test.describe('archive index — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });

  test('has a real, on-brand <title>, independent of the Shopify call failing', async ({
    page,
  }) => {
    await page.goto('/archive');
    await expect(page).toHaveTitle(/archive/i);
  });
});

test.describe('archived collection route — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/archive/any-handle');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });
});

test.describe('sitemap', () => {
  test('sitemap.xml lists /archive', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('/archive');
  });
});

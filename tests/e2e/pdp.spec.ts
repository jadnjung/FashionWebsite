import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally
// unset in this E2E environment (playwright.config.ts's webServer.env) —
// every request below hits a genuinely unconfigured Shopify client. This
// is the honest limit of what's E2E-verifiable without a real store — see
// the design spec's Testing section: the not-found path, metadata, and
// every interactive behavior (selection, scarcity, related, recently-
// viewed) all require a real product fetch to succeed first, which an
// unconfigured client can never do. Mirrors catalog.spec.ts's identical
// constraint.
test.describe('product route — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/products/any-handle');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });
});

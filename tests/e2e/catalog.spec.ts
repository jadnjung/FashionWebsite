import { test, expect } from '@playwright/test';

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env sets only
// the Klaviyo fixtures) — every route below therefore calls a
// genuinely unconfigured Shopify client. This mirrors the already-
// established access-gate precedent ("submitting with valid input but
// Klaviyo not configured surfaces the error boundary honestly") and is the
// honest limit of what's E2E-verifiable without a live store — see the
// design spec's Testing section.
const ROUTES = [
  '/new',
  '/tops',
  '/tops/hoodies',
  '/bottoms',
  '/bottoms/jeans',
  '/etc',
  '/etc/jewelry',
];

test.describe('category routes — reachable and fail honestly without a configured store', () => {
  for (const route of ROUTES) {
    test(`${route} surfaces the error boundary rather than crashing uncleanly`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
    });
  }
});

test.describe('category routes — static metadata does not depend on Shopify', () => {
  // Titles use NAVIGATION's own uppercase labels (e.g. "TOPS", "ETC."), not
  // title case — case-insensitive regexes so this asserts the real label is
  // present without over-specifying casing.
  test('each category has a real, on-brand <title>, independent of the Shopify call failing', async ({
    page,
  }) => {
    await page.goto('/tops');
    await expect(page).toHaveTitle(/tops/i);
    await page.goto('/bottoms');
    await expect(page).toHaveTitle(/bottoms/i);
    await page.goto('/etc');
    await expect(page).toHaveTitle(/etc/i);
    await page.goto('/new');
    await expect(page).toHaveTitle(/new/i);
  });

  test('a subcategory route title reflects the subcategory label, not just the parent category', async ({
    page,
  }) => {
    await page.goto('/tops/hoodies');
    await expect(page).toHaveTitle(/hoodies/i);
  });
});

test.describe('unknown subcategory', () => {
  test('a nonexistent subcategory shows the branded 404, not the Shopify error boundary', async ({
    page,
  }) => {
    // Taxonomy resolution happens before any Shopify call, so this is
    // fully testable without a store — a real, previously-uncalled path.
    await page.goto('/tops/not-a-real-subcategory');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toHaveCount(0);
  });

  test('an unknown segment under bottoms also 404s', async ({ page }) => {
    await page.goto('/bottoms/not-a-real-subcategory');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
  });

  test('an unknown segment under etc also 404s', async ({ page }) => {
    await page.goto('/etc/not-a-real-subcategory');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
  });
});

test.describe('unknown subcategory — real HTTP status (DECISIONS.md D-072)', () => {
  // D-026/D-052 both confirmed the branded UI renders correctly but the
  // response status stayed 200 — neither prior investigation ever pinned
  // the actual status code in a permanent test, since neither found a fix
  // to pin it against. proxy.ts now intercepts these three routes directly
  // (before any page renders), so this is newly, genuinely assertable.
  for (const route of [
    '/tops/not-a-real-subcategory',
    '/bottoms/not-a-real-subcategory',
    '/etc/not-a-real-subcategory',
  ]) {
    test(`${route} returns a real HTTP 404, not a soft 200`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(404);
    });
  }

  // Regression guard: proxy.ts must not start 404-ing real subcategories.
  // Status is asserted directly rather than inferred from the rendered UI
  // — the existing describe block above already covers the rendered-UI
  // side for the unrecognized case.
  for (const route of ['/tops/hoodies', '/bottoms/jeans', '/etc/jewelry']) {
    test(`${route} (a real subcategory) still returns 200`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    });
  }
});

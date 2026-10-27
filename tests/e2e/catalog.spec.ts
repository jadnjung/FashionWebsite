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

// lib/catalog/filters.ts's parseCatalogFilters/FilterBar.tsx — a maxPrice
// below minPrice is a contradictory range, dropped rather than silently
// querying a range that would read as "no products". FilterBar surfaces
// that drop instead of leaving it silent. Requires PREVIEW_DEMO_MODE=1
// (this worktree's throwaway playwright.worktree.config.ts) so FilterBar
// actually renders real fixture products instead of this environment's
// usual unconfigured-Shopify error boundary — see that config's own
// comment.
test.describe('FilterBar — dropped max-price feedback', () => {
  test('maxPrice below minPrice: field renders blank, note is visible, aria-describedby wires it to the input', async ({
    page,
  }) => {
    await page.goto('/tops?minPrice=200&maxPrice=50');
    const maxPriceInput = page.getByRole('spinbutton', { name: 'Max Price' });
    const note = page.getByText('Max price below min — ignored.');

    await expect(maxPriceInput).toHaveValue('');
    await expect(note).toBeVisible();

    const describedBy = await maxPriceInput.getAttribute('aria-describedby');
    expect(describedBy).toBe('max-price-dropped-note');
    await expect(page.locator(`#${describedBy}`)).toHaveText('Max price below min — ignored.');

    // minPrice itself is untouched — only maxPrice was dropped.
    await expect(page.getByRole('spinbutton', { name: 'Min Price' })).toHaveValue('200');
  });

  test('a valid range (minPrice < maxPrice): no note, no aria-describedby', async ({ page }) => {
    await page.goto('/tops?minPrice=50&maxPrice=200');
    const maxPriceInput = page.getByRole('spinbutton', { name: 'Max Price' });

    await expect(maxPriceInput).toHaveValue('200');
    await expect(page.getByText('Max price below min — ignored.')).toHaveCount(0);
    await expect(maxPriceInput).not.toHaveAttribute('aria-describedby');
  });

  test('no filters at all: no note', async ({ page }) => {
    await page.goto('/tops');
    await expect(page.getByText('Max price below min — ignored.')).toHaveCount(0);
    await expect(page.getByRole('spinbutton', { name: 'Max Price' })).toHaveValue('');
  });

  // Boundary: minPrice === maxPrice is a valid (if degenerate) single-price
  // range, not a contradictory one — must not be dropped (parseCatalogFilters
  // only drops a strictly-lesser maxPrice).
  test('minPrice equal to maxPrice is a valid range, not dropped', async ({ page }) => {
    await page.goto('/tops?minPrice=100&maxPrice=100');
    const maxPriceInput = page.getByRole('spinbutton', { name: 'Max Price' });

    await expect(maxPriceInput).toHaveValue('100');
    await expect(page.getByText('Max price below min — ignored.')).toHaveCount(0);
    await expect(maxPriceInput).not.toHaveAttribute('aria-describedby');
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

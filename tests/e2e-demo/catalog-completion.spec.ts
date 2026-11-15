import { test, expect, type Page } from '@playwright/test';

async function openFilters(page: Page) {
  const summary = page.locator('main summary').filter({ hasText: /^Filter and sort/ });
  if ((await summary.locator('..').getAttribute('open')) === null) await summary.click();
}

test('collapsed filters keep the first product within the initial viewport', async ({ page }) => {
  await page.goto('/new?sort=featured');
  const summary = page.locator('main summary').filter({ hasText: /^Filter and sort/ });
  await expect(summary).toBeVisible();
  await expect(summary.locator('..')).not.toHaveAttribute('open');
  const firstCard = page.locator('main a[data-cursor="VIEW"]').first();
  await expect(firstCard).toBeVisible();
  const bounds = await firstCard.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeLessThan(page.viewportSize()!.height);
});

test('catalog continuation reaches all 30 synthetic pieces without overlap', async ({ page }) => {
  await page.goto('/new?sort=featured');
  const ids = await page
    .locator('main a[data-cursor="VIEW"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(ids).toHaveLength(24);
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(6);
  const next = await page
    .locator('main a[data-cursor="VIEW"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(next).toHaveLength(6);
  expect(new Set([...ids, ...next]).size).toBe(30);
  await expect(page.getByText('End of results.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'First page', exact: true }).click();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(24);
});

test('current collection continuation includes all 30 fixture products exactly once', async ({
  page,
}) => {
  await page.goto('/collections/collection-001');
  const cards = page.locator('main a[data-cursor="VIEW"]');
  await expect(cards).toHaveCount(24);
  const first = await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  await expect(cards).toHaveCount(6);
  const last = await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const expectedHandles = [
    'featherweight-crewneck',
    'tailored-trouser-set',
    'fluid-knit-long-sleeve',
    'silk-cami-layer',
    'relaxed-linen-trouser',
    'velvet-evening-jacket',
    'default-title',
    'missing-media',
    'sparse-options',
    'long-labels',
    'many-variants',
    'one-option',
    'mixed-gallery',
    'variant-media',
    ...Array.from({ length: 16 }, (_, index) => `catalog-piece-${index + 9}`),
  ].map((handle) => `/products/preview-${handle}`);
  expect([...first, ...last]).toEqual(expectedHandles);
  expect(new Set([...first, ...last]).size).toBe(30);
  await expect(page.getByText('End of results.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'First page', exact: true }).click();
  await expect(cards).toHaveCount(24);
  expect(
    await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).toEqual(first);
});

test('combined facets survive reload and active-chip removal clears the intended value', async ({
  page,
}) => {
  const expected = [
    'preview-catalog-piece-23',
    'preview-catalog-piece-19',
    'preview-catalog-piece-17',
    'preview-catalog-piece-15',
    'preview-catalog-piece-13',
    'preview-catalog-piece-11',
    'preview-catalog-piece-9',
    'preview-mixed-gallery',
    'preview-sparse-options',
    'preview-featherweight-crewneck',
    'preview-fluid-knit-long-sleeve',
  ].map((handle) => `/products/${handle}`);
  const results = () =>
    page
      .locator('main a[data-cursor="VIEW"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  await page.goto('/tops?sort=price-desc&size=M&color=Black&available=1&collection=demo-capsule');
  await openFilters(page);
  await expect(page.getByRole('link', { name: 'Remove size M', exact: true })).toBeVisible();
  await expect.poll(results).toEqual(expected);
  await page.reload();
  await openFilters(page);
  await expect(page.getByRole('link', { name: 'Remove color Black', exact: true })).toBeVisible();
  await expect.poll(results).toEqual(expected);
  await page.getByRole('link', { name: 'Remove size M', exact: true }).click();
  await expect(page).not.toHaveURL(/[?&]size=/);
  await expect(page).toHaveURL(/color=Black/);
  await expect.poll(results).toEqual(expected);
  await page.goBack();
  await openFilters(page);
  await expect(page.getByRole('link', { name: 'Remove size M', exact: true })).toBeVisible();
  await expect.poll(results).toEqual(expected);
  await page.getByRole('link', { name: 'Clear Filters', exact: true }).click();
  await expect(page).not.toHaveURL(/color=|collection=|available=/);
});

test('applying facets on a continuation resets the cursor and restores matching first-page products', async ({
  page,
}) => {
  await page.goto('/new?sort=featured');
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  await expect(page).toHaveURL(/[?&]after=/);
  await openFilters(page);
  const form = page.locator('form[method="get"]');
  await form.locator('summary').filter({ hasText: /^Size/ }).click();
  await form.getByRole('checkbox', { name: 'M', exact: true }).check();
  await form
    .locator('summary')
    .filter({ hasText: /^Color/ })
    .click();
  await form.getByRole('checkbox', { name: 'Black', exact: true }).check();
  await form.getByRole('button', { name: 'APPLY', exact: true }).click();
  await expect(page).not.toHaveURL(/[?&]after=/);
  await expect(page).toHaveURL(/size=M/);
  await expect(page).toHaveURL(/color=Black/);
  await expect(page.locator('main a[data-cursor="VIEW"]').first()).toHaveAttribute(
    'href',
    '/products/preview-featherweight-crewneck',
  );
});

test('sort alone keeps a truly empty category explanation', async ({ page }) => {
  await page.goto('/tops/hoodies?sort=newest');
  await expect(page.getByText('NOTHING HERE YET.', { exact: true })).toBeVisible();
  await expect(page.getByText('NOTHING MATCHES.', { exact: true })).toHaveCount(0);
});

test('a sellable 101st variant and default variant remain reachable', async ({ page }) => {
  await page.goto('/products/preview-many-variants');
  await page
    .locator('label')
    .filter({ hasText: /^Size 101$/ })
    .click();
  const add = page.getByRole('button', { name: 'ADD TO BAG', exact: true }).first();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Added to demo bag.' }).first(),
  ).toBeVisible();
  await page.goto('/products/preview-default-title');
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true }).first()).toBeEnabled();
});

test('selected color media is explicit and an unmapped color keeps useful fallback', async ({
  page,
}) => {
  await page.goto('/products/preview-variant-media');
  await page.locator('label').filter({ hasText: /^M$/ }).click();
  await page
    .locator('label')
    .filter({ hasText: /^Ecru$/ })
    .click();
  const media = page.getByRole('link', { name: /view selected color image/i });
  await expect(media).toBeVisible();
  await media.click();
  await expect(page).toHaveURL(/#product-image-1$/);
  await page
    .locator('label')
    .filter({ hasText: /^Unmapped$/ })
    .click();
  await expect(media).toHaveCount(0);
});

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env) — Selected
// Pieces' fetch always fails here. This is deliberately the load-bearing
// case for this phase's core new architecture (DECISIONS.md D-033): the
// other five rendered scenes must still render correctly regardless.
test.describe('homepage — renders real scene content even with Shopify unconfigured', () => {
  test('the hero renders its real structure, placeholder labels, and CTA', async ({ page }) => {
    await page.goto('/');
    const hero = page.getByRole('region', { name: 'Collection Hero' });
    await expect(page.getByRole('heading', { name: 'ESQUE', level: 1 })).toBeVisible();
    await expect(hero.getByText('COLLECTION 001')).toBeVisible();
    await expect(hero.getByText('ESQUE PLACEHOLDER — CAMPAIGN, HERO')).toBeVisible();
    await expect(hero.getByText('ESQUE PLACEHOLDER — CAMPAIGN STATEMENT')).toBeVisible();
    const cta = hero.getByRole('link', { name: 'ENTER COLLECTION' });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/new$/);
  });

  test('the interactive model placeholder is present and honestly labeled', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Interactive Model' });
    await expect(scene).toBeVisible();
    await expect(scene.getByText('LOOK 01')).toBeVisible();
    await expect(scene.getByText('ESQUE PLACEHOLDER — MODEL, FULL BODY')).toBeVisible();
    await expect(scene.getByRole('heading', { name: 'ARRIVING SOON.' })).toBeVisible();
  });

  test('the collection statement renders its real copy', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Collection Statement' });
    await expect(scene.getByRole('heading', { name: 'NOT MADE TO REMAIN.' })).toBeVisible();
  });

  test('Selected Pieces is entirely absent when Shopify is unconfigured', async ({ page }) => {
    await page.goto('/');
    // Proves the graceful-omission path (DECISIONS.md D-033) — not just
    // "the page didn't crash," but that the specific section is genuinely
    // absent rather than rendered empty or erroring.
    await expect(page.getByRole('heading', { name: 'Selected Pieces' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Selected Pieces' })).toHaveCount(0);
  });

  test('the category showcase links to the real Phase 4 category routes', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Shop by Category' });
    await expect(scene.getByRole('link', { name: 'TOPS' })).toHaveAttribute('href', '/tops');
    await expect(scene.getByRole('link', { name: 'BOTTOMS' })).toHaveAttribute('href', '/bottoms');
    await expect(scene.getByRole('link', { name: 'ETC.' })).toHaveAttribute('href', '/etc');

    await scene.getByRole('link', { name: 'TOPS' }).click();
    await expect(page).toHaveURL(/\/tops$/);
  });

  test('drop status renders the real, committed catalog copy', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Drop Status' });
    await expect(scene.getByText('COLLECTION 001')).toBeVisible();
    await expect(scene.getByRole('heading', { name: '06 PIECES' })).toBeVisible();
    await expect(scene.getByText('AVAILABLE UNTIL GONE')).toBeVisible();
  });

  test('archive preview (Scene 07) is not rendered this pass', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: /archive/i })).toHaveCount(0);
  });
});

test.describe('homepage — structure and responsiveness', () => {
  test('has exactly one h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('renders scenes in the PROJECT.md §23 / DESIGN_SYSTEM.md §58 order', async ({ page }) => {
    await page.goto('/');
    const regionNames = await page
      .getByRole('region')
      .evaluateAll((elements) => elements.map((el) => el.getAttribute('aria-label')));
    expect(regionNames).toEqual([
      'Collection Hero',
      'Interactive Model',
      'Collection Statement',
      // Selected Pieces omitted — Shopify unconfigured in this environment.
      'Shop by Category',
      'Drop Status',
    ]);
  });

  test('produces no horizontal overflow at a 375px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

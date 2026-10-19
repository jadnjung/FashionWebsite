import { test, expect } from '@playwright/test';

// PROJECT.md §90's sitemap entry. Footer's own link to this page, and that
// it resolves to a real (non-404) page, is also covered by
// tests/e2e/smoke.spec.ts's footer suite (mirroring legal.spec.ts's own
// division of labor: smoke.spec.ts sweeps reachability across every footer
// link, this file covers this page's own content/metadata in depth). Unlike
// /collections'/archive's own E2E coverage (collections-index.spec.ts,
// archive.spec.ts), this page has zero Shopify dependency, so there is no
// error-boundary case to settle for here — every assertion below exercises
// real, populated content directly, in every environment. See DECISIONS.md
// D-070.
test.describe('about', () => {
  test('renders with a real heading and title', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
    await expect(page).toHaveTitle(/about/i);
  });

  test('renders real, on-brand foundational content — not a draft notice or placeholder stub', async ({
    page,
  }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: 'The Name' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Drops' })).toBeVisible();
    await expect(page.getByText(/niche, experimental fashion house/i)).toBeVisible();
    // Distinguishes this page from the draft legal pages (DECISIONS.md
    // D-054) — About's content gap is a deferred editorial-scope product
    // decision (PROJECT.md §60/§92), not an unresolved business/legal fact
    // pending counsel review, so neither mechanism belongs here.
    await expect(page.getByText('Draft — Not Yet Final')).toHaveCount(0);
    await expect(page.getByText(/\[Placeholder —/)).toHaveCount(0);
    // The honest, minimal-scope note for the deferred expanded editorial
    // experience — InteractiveModelPlaceholder.tsx's established phrase,
    // reused verbatim rather than new copy.
    await expect(page.getByRole('heading', { name: 'ARRIVING SOON.' })).toBeVisible();
  });

  test('loads with no console or page errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/about');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('Footer link navigates to a real, populated page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toHaveCount(0);
  });
});

test.describe('sitemap', () => {
  test('sitemap.xml lists /about', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('/about');
  });
});

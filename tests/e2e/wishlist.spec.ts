import { test, expect } from '@playwright/test';

// ROADMAP.md Phase 10 — the anonymous-local wishlist. Only what's genuinely
// Shopify-independent and reachable in this dev/CI environment without
// Demo Mode or a fixture probe is covered here, mirroring
// tests/e2e/legal.spec.ts's pattern for exactly this class of
// always-reachable, no-store-needed route. This environment starts with an
// empty localStorage wishlist on every fresh browser context, so the empty
// state is the only state reachable here — the add/toggle/live-refetch
// mechanism itself needs a real PDP render (Demo Mode or a fixture probe),
// which DECISIONS.md D-057 already established is deliberately never
// toggled on for committed Playwright (no per-test mechanism exists to do
// so against the suite's single shared webServer). That verification is a
// live, manual pass, not a committed automated test.
test.beforeEach(async ({ context }) => {
  // Every route under app/(storefront)/** is gated by proxy.ts for human
  // visitors — see smoke.spec.ts's identical setup and its own comment.
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

test.describe('wishlist', () => {
  test('renders the WISHLIST heading and CONTENT.md §7 empty-state copy', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page.getByRole('heading', { level: 1, name: 'Wishlist' })).toBeVisible();
    await expect(page.getByText('NOTHING SAVED YET.')).toBeVisible();
  });

  test('is noindexed — personal, client-side state with nothing universal to rank for', async ({
    page,
  }) => {
    await page.goto('/wishlist');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('has a real main/heading landmark structure', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Wishlist' })).toBeVisible();
  });

  test('loads with no console or page errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/wishlist');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});

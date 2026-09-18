import { test, expect } from '@playwright/test';

// ROADMAP.md Phase 4 — full-screen predictive search overlay, resolving
// DECISIONS.md D-025's deferral. See
// docs/superpowers/specs/2026-09-18-search-design.md for the full
// architecture and why COLLECTIONS/a dedicated results page aren't built.
//
// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally
// unset in this E2E environment (playwright.config.ts's webServer.env sets
// only the access-gate/Klaviyo fixtures) — every products search below
// therefore hits a genuinely unconfigured Shopify client and settles to
// SearchOverlay's own scoped error state. This mirrors catalog.spec.ts's
// same honest-about-the-environment approach. Category matching has no
// Shopify dependency (lib/catalog/taxonomy.ts is pure/local), so it's
// fully, genuinely verifiable here.
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

test.describe('search overlay', () => {
  test('opens via the SEARCH button with the input immediately focused', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'SEARCH' }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toBeFocused();
  });

  test('Escape closes the overlay and returns focus to the SEARCH trigger', async ({ page }) => {
    await page.goto('/');
    const searchTrigger = page.getByRole('button', { name: 'SEARCH' });
    await searchTrigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(searchTrigger).toBeFocused();
  });

  test('clicking CLOSE closes the overlay and returns focus to the SEARCH trigger', async ({
    page,
  }) => {
    await page.goto('/');
    const searchTrigger = page.getByRole('button', { name: 'SEARCH' });
    await searchTrigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'CLOSE' }).click();
    await expect(dialog).toBeHidden();
    await expect(searchTrigger).toBeFocused();
  });

  // Mirrors smoke.spec.ts's own "background content is inert while the
  // menu is open" technique, applied to the reverse pairing: ShellClient's
  // inert={menuOpen || searchOpen} is what keeps Menu and Search mutually
  // exclusive — this proves that mechanism actually holds for Search, not
  // just for Menu.
  test('MENU is unreachable while Search is open (mutual exclusion via inert)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();

    const menuButton = page.getByRole('button', { name: 'MENU' });
    await menuButton.focus();
    await expect(menuButton).not.toBeFocused();
    // The dialog stays open — not toggled by a background element that
    // should be unreachable.
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('a single-character query shows neither CATEGORIES nor PRODUCTS', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });

    await dialog.getByRole('searchbox').fill('h');
    // Give the debounce window a moment to have fired if it incorrectly
    // would — MIN_QUERY_LENGTH=2 means it must not.
    await page.waitForTimeout(400);

    await expect(dialog.getByRole('heading', { name: /categories/i })).toHaveCount(0);
    await expect(dialog.getByRole('heading', { name: /products/i })).toHaveCount(0);
  });

  test('typing a category-matching query shows a real, clickable result that navigates and closes the overlay', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });

    await dialog.getByRole('searchbox').fill('hoodie');
    const result = dialog.getByRole('link', { name: 'TOPS / Hoodies' });
    await expect(result).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /categories/i })).toBeVisible();

    await result.click();
    await expect(page).toHaveURL(/\/tops\/hoodies$/);
    await expect(dialog).toBeHidden();
  });

  // The one assertion that most directly proves the scoped-error design
  // decision (design spec's Error Handling section) actually works: a
  // search-products failure renders inside the dialog, not as the
  // page-level app/error.tsx boundary that catalog.spec.ts's routes hit.
  test("a genuine query surfaces the PRODUCTS section's own scoped error state, not the page-level error boundary", async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });

    await dialog.getByRole('searchbox').fill('hoodie');
    await expect(dialog.getByRole('heading', { name: /products/i })).toBeVisible();
    await expect(dialog.getByText('SOMETHING WENT WRONG.')).toBeVisible();
    const retryButton = dialog.getByRole('button', { name: 'Retry' });
    await expect(retryButton).toBeVisible();

    // Scoped, not the page-level boundary: app/error.tsx renders its
    // message as a real <h1> heading, which must NOT appear anywhere
    // (the dialog's own error text above is a plain, unscoped <p>, not a
    // heading) — and the homepage underneath must still be genuinely
    // present (app/error.tsx would have unmounted the whole (storefront)
    // layout, Header/ESQUE wordmark included, were it the boundary that
    // actually caught this).
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'ESQUE' })).toBeAttached();

    // Retry re-attempts the same query and settles to the same honest
    // error again (this environment's Shopify client stays unconfigured).
    await retryButton.click();
    await expect(dialog.getByText('SOMETHING WENT WRONG.')).toBeVisible();
  });

  test('Tab-cycle focus trap wraps forward and backward across CLOSE, input, and results', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const input = dialog.getByRole('searchbox');
    const closeButton = dialog.getByRole('button', { name: 'CLOSE' });

    await expect(input).toBeFocused();

    // Type a query that produces both a category result and (in this
    // Shopify-unconfigured environment) a settled products error state —
    // waiting for both to settle keeps the focusable set stable for the
    // rest of this test, rather than racing the debounced fetch.
    await input.fill('hoodie');
    const categoryLink = dialog.getByRole('link', { name: 'TOPS / Hoodies' });
    await expect(categoryLink).toBeVisible();
    const retryButton = dialog.getByRole('button', { name: 'Retry' });
    await expect(retryButton).toBeVisible();

    // Backward from the input (not the first focusable element — CLOSE
    // precedes it in DOM order) moves to CLOSE via ordinary tab order, not
    // the trap's own wrap logic.
    await input.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(closeButton).toBeFocused();

    // Shift+Tab from CLOSE (the first focusable element) wraps to the
    // last one — Retry, since the products section settled below the
    // category link.
    await page.keyboard.press('Shift+Tab');
    await expect(retryButton).toBeFocused();

    // Forward Tab from the last element wraps back to the first (CLOSE).
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Mirrors smoke.spec.ts's identical check for .esque-menu — the closed
    // overlay's own non-zero transition-delay (280ms on visibility) is
    // what actually proves the reduced-motion override is suppressing
    // something real, checked on the closed (initial) state.
    const closedDelay = await page
      .locator('#esque-search-overlay')
      .evaluate((el) => getComputedStyle(el).transitionDelay);
    for (const value of closedDelay.split(',')) {
      expect(parseFloat(value)).toBeLessThan(0.05);
    }

    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const duration = await dialog.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration === '0s' || parseFloat(duration) < 0.05).toBe(true);
  });
});

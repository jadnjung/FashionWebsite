import { test, expect, type Page } from '@playwright/test';

// Next.js's App Router ships its own persistent `role="alert"` element
// (`#__next-route-announcer__`, used to announce client-side route changes
// to screen readers) on every page, including this one. It coexists with
// our own branded request-access error `<p role="alert">`, so a plain
// `page.getByRole('alert')` is ambiguous (resolves to two elements) — this
// scopes queries to our own element specifically.
function accessErrorAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

// Whole-site gate removal (design spec "2026-10-18-drop-access-gate-design.md"):
// the general "enter Esque" password screen and its proxy.ts enforcement are
// deleted entirely. /access is no longer a gate a visitor is redirected to —
// it is now the Request Access signup form directly, reached only by
// deliberate navigation (a link from the drop teaser, or typing the URL).
test.describe('whole-site gate removed', () => {
  test('/ is reachable with zero cookies and never redirects to /access', async ({
    page,
    context,
  }) => {
    expect(await context.cookies()).toEqual([]);
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'ESQUE' })).toBeVisible();
  });

  // A second, Shopify-independent route proves this isn't a special case of
  // the homepage alone — ordinary browsing generally is no longer gated.
  test('an ordinary, Shopify-independent route is also reachable with zero cookies and never redirects', async ({
    page,
    context,
  }) => {
    expect(await context.cookies()).toEqual([]);
    await page.goto('/legal/privacy');
    await expect(page).toHaveURL(/\/legal\/privacy$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  });
});

test.describe('request access', () => {
  test('shows email and consent without taking initial focus', async ({ page }) => {
    await page.goto('/access');
    await expect(page.getByLabel('EMAIL', { exact: true })).toBeVisible();
    await expect(page.getByLabel('EMAIL', { exact: true })).not.toBeFocused();
    await expect(page.getByLabel('FIRST NAME')).toHaveCount(0);
  });
  test('server validation describes and focuses the invalid field', async ({ page }) => {
    await page.goto('/access');
    await page.getByLabel('EMAIL', { exact: true }).fill('sam@example.com');
    await page.locator('input[name="consent"]').evaluate((el) => el.removeAttribute('required'));
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
    await expect(accessErrorAlert(page)).toHaveText('Consent is required to request access.');
    await expect(page.locator('input[name="consent"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('input[name="consent"]')).toBeFocused();
  });
  test('an unavailable email service preserves the form for recovery', async ({ page }) => {
    await page.goto('/access');
    await page.getByLabel('EMAIL', { exact: true }).fill('sam@example.com');
    await page.getByText('I agree to receive Esque emails').click();
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
    await expect(accessErrorAlert(page)).toHaveText(
      'Your request could not be submitted. Please try again.',
    );
    await expect(page.getByLabel('EMAIL', { exact: true })).toHaveValue('sam@example.com');
  });
});

// /collections/[handle] is necessarily Shopify-dependent (it must fetch the
// collection to classify its drop phase before it can decide whether to
// render the teaser or the real grid) — this environment has no real
// Shopify store and Playwright's shared webServer can't selectively enable
// PREVIEW_DEMO_MODE for a subset of specs. This is the same honest,
// already-established limitation catalog.spec.ts/pdp.spec.ts/archive.spec.ts
// already live with for their own Shopify-dependent routes, and the one new-
// route assertion that *is* honestly E2E-testable here without a real store
// or Demo Mode. The real teaser/countdown/code-entry/unlock flow is covered
// by unit tests (lib/collections/drop-phase.test.ts, actions.test.ts,
// cookies.test.ts) and was manually verified via a temporary fixture probe
// during implementation, per the design spec's Testing section.
test.describe('collections route — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/collections/any-handle');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });
});

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

test.describe('access gate — request access', () => {
  // /access *is* the request-access form directly now — there is no
  // sibling password screen to reveal it from (AccessForm/EntranceMotion
  // are both deleted), so every test here navigates straight to it.
  test('renders the request-access form with its fields and consent checkbox', async ({ page }) => {
    await page.goto('/access');
    await expect(page.getByRole('heading', { level: 1, name: 'ESQUE' })).toBeVisible();
    await expect(page.getByLabel('FIRST NAME')).toBeVisible();
    await expect(page.getByLabel('EMAIL', { exact: true })).toBeVisible();
    await expect(
      page.getByText('I agree to receive Esque emails, including access and collection updates.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'REQUEST ACCESS' })).toBeVisible();
  });

  test('the server rejects an unchecked consent box even when the client-side required check is bypassed', async ({
    page,
  }) => {
    // Native `required` on the consent checkbox is only a first line of
    // defense (client-side checks are not authorization) — submitting with
    // it left unchecked would normally be blocked by the browser itself
    // before submitRequestAccess ever runs, which would prove nothing about
    // the server. Removing the attribute simulates a client that doesn't
    // enforce it (e.g. a modified client, or one reimplementing the form),
    // so this actually exercises the server's own validation branch and
    // asserts its returned state renders — without navigating away and
    // without hitting the error boundary.
    await page.goto('/access');
    await page.getByLabel('FIRST NAME').fill('Sam');
    await page.getByLabel('EMAIL', { exact: true }).fill('sam@example.com');
    await page.evaluate(() => {
      document.querySelector('input[name="consent"]')?.removeAttribute('required');
    });

    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    await expect(accessErrorAlert(page)).toHaveText('Consent is required to request access.');
    await expect(page).toHaveURL(/\/access$/);
  });

  // DECISIONS.md D-050 — three fields can each independently error here, so
  // the fix must mark exactly the one field the returned state actually
  // names, not all three. A whitespace-only first name (rather than an empty
  // one) reaches the server without needing to bypass the native `required`
  // attribute — the browser's own required check only rejects a truly empty
  // value.
  test('marks only the actually-invalid field aria-invalid, describing it by the error message', async ({
    page,
  }) => {
    await page.goto('/access');
    const firstName = page.getByLabel('FIRST NAME');
    const email = page.getByLabel('EMAIL', { exact: true });
    await firstName.fill('   ');
    await email.fill('sam@example.com');
    await page.getByText('I agree to receive Esque emails').click();
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    const alert = accessErrorAlert(page);
    await expect(alert).toHaveText('First name is required.');
    await expect(firstName).toHaveAttribute('aria-invalid', 'true');
    await expect(firstName).toHaveAttribute('aria-describedby', 'request-access-error');
    await expect(alert).toHaveAttribute('id', 'request-access-error');
    // The other, actually-valid field must not be marked invalid too —
    // misinformation would be worse than no association at all.
    await expect(email).not.toHaveAttribute('aria-invalid');
  });

  test('submitting with valid input but Klaviyo not configured surfaces the error boundary honestly', async ({
    page,
  }) => {
    // KLAVIYO_PRIVATE_API_KEY/KLAVIYO_LIST_ID are intentionally unset in
    // this test run (mirroring the real current project state — no
    // Klaviyo account exists yet, per the design spec's explicit scope).
    // subscribeToAccessList throws, which is a genuine failure per
    // actions.ts's own documented distinction — surfacing the existing,
    // already-tested error.tsx boundary is the correct, honest behavior,
    // not a workaround.
    await page.goto('/access');
    await page.getByLabel('FIRST NAME').fill('Sam');
    await page.getByLabel('EMAIL', { exact: true }).fill('sam@example.com');
    await page.getByText('I agree to receive Esque emails').click();
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
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

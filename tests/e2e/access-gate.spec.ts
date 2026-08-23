import { test, expect, type Page } from '@playwright/test';

// Next.js's App Router ships its own persistent `role="alert"` element
// (`#__next-route-announcer__`, used to announce client-side route changes
// to screen readers) on every page, including this one. It coexists with
// our own branded incorrect-password `<p role="alert">`, so a plain
// `page.getByRole('alert')` is ambiguous (resolves to two elements) —
// this scopes queries to our own element specifically.
function accessErrorAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

// EntranceMotion's giant background "ESQUE" typography (DESIGN_SYSTEM.md §53
// layer 4) is targeted by an exact-text match. AccessForm's own
// <h1>ENTER ESQUE</h1> lives on the same page, but its full text is
// "ENTER ESQUE", not "ESQUE", so it doesn't match today — asserted here
// (rather than just assumed) so a future change that splits "ENTER" and
// "ESQUE" into separate styled text nodes fails this loudly instead of
// silently resolving to the wrong element.
async function backgroundWordmark(page: Page) {
  const locator = page.getByText('ESQUE', { exact: true });
  await expect(locator).toHaveCount(1);
  return locator;
}

test.describe('access gate — password entry', () => {
  test('renders ENTER ESQUE with a password field and both buttons', async ({ page }) => {
    await page.goto('/access');
    await expect(page.getByRole('heading', { name: 'ENTER ESQUE' })).toBeVisible();
    await expect(page.getByLabel('PASSWORD')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ENTER' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'REQUEST ACCESS' })).toBeVisible();
    await expect(page.getByText('ACCESS TO CURRENT COLLECTIONS.')).toBeVisible();
  });

  test('the correct general password grants access and redirects home', async ({ page }) => {
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('ci-test-general-password');
    await page.getByRole('button', { name: 'ENTER' }).click();

    await expect(page).toHaveURL('/');
    // Override 5: control-flow assumption check — validatePassword's
    // redirect() should mean the code below it (which would set a branded
    // error line) never runs on a correct password. If this ever fails, it
    // means that assumption is wrong and the handler needs restructuring.
    await expect(accessErrorAlert(page)).toHaveCount(0);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'esque_access')).toBeTruthy();
    expect(cookies.find((c) => c.name === 'esque_vip_access')).toBeFalsy();
  });

  test('the correct early-access password grants both access cookies and redirects home', async ({
    page,
  }) => {
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('ci-test-vip-password');
    await page.getByRole('button', { name: 'ENTER' }).click();

    await expect(page).toHaveURL('/');
    await expect(accessErrorAlert(page)).toHaveCount(0);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'esque_access')).toBeTruthy();
    expect(cookies.find((c) => c.name === 'esque_vip_access')).toBeTruthy();
  });

  test('an incorrect password shows a branded line, not a generic message, and does not navigate', async ({
    page,
  }) => {
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('definitely-wrong');
    await page.getByRole('button', { name: 'ENTER' }).click();

    const alert = accessErrorAlert(page);
    await expect(alert).toBeVisible();
    const messages = [
      'NOT THIS ONE.',
      'ACCESS NOT RECOGNIZED.',
      'TRY ANOTHER.',
      'ACCESS DENIED.',
      'TRY AGAIN.',
    ];
    await expect(alert).toHaveText(new RegExp(messages.join('|')));
    await expect(page).toHaveURL(/\/access$/);
  });

  test('returns focus to the password field after a failed attempt', async ({ page }) => {
    await page.goto('/access');
    const passwordField = page.getByLabel('PASSWORD');
    await passwordField.fill('definitely-wrong');
    await page.getByRole('button', { name: 'ENTER' }).click();

    await expect(accessErrorAlert(page)).toBeVisible();
    await expect(passwordField).toBeFocused();
  });

  test('two consecutive failures show two different branded lines', async ({ page }) => {
    await page.goto('/access');
    const passwordField = page.getByLabel('PASSWORD');
    const alert = accessErrorAlert(page);

    await passwordField.fill('definitely-wrong');
    await page.getByRole('button', { name: 'ENTER' }).click();
    await expect(alert).toBeVisible();
    const firstMessage = await alert.textContent();

    await passwordField.fill('still-wrong');
    await page.getByRole('button', { name: 'ENTER' }).click();
    // handleSubmit is async (it calls the validatePassword server action),
    // so the click resolves before the state update lands — the old alert
    // is still visible and toBeVisible() would pass immediately, reading
    // stale (first-message) content. Wait for the text to actually change.
    await expect(alert).not.toHaveText(firstMessage ?? '');
    const secondMessage = await alert.textContent();

    expect(secondMessage).not.toBe(firstMessage);
  });

  test('respects prefers-reduced-motion for the incorrect-password animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/access');
    await page.getByLabel('PASSWORD').fill('definitely-wrong');
    await page.getByRole('button', { name: 'ENTER' }).click();

    const alert = accessErrorAlert(page);
    await expect(alert).toBeVisible();
    const duration = await alert.evaluate((el) => getComputedStyle(el).animationDuration);
    expect(duration === '0s' || parseFloat(duration) < 0.05).toBe(true);
  });
});

test.describe('access gate — request access', () => {
  test('REQUEST ACCESS on the entry screen reveals the request-access form', async ({ page }) => {
    await page.goto('/access');
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    // Guards the structural decision (made in the previous task) to hoist
    // ENTER ESQUE above the showRequestAccess conditional in AccessForm —
    // without that, this screen would render heading-less.
    await expect(page.getByRole('heading', { name: 'ENTER ESQUE' })).toBeVisible();
    await expect(page.getByLabel('FIRST NAME')).toBeVisible();
    await expect(page.getByLabel('EMAIL', { exact: true })).toBeVisible();
    await expect(
      page.getByText('I agree to receive Esque emails, including access and collection updates.'),
    ).toBeVisible();
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
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
    await page.getByLabel('FIRST NAME').fill('Sam');
    await page.getByLabel('EMAIL', { exact: true }).fill('sam@example.com');
    await page.evaluate(() => {
      document.querySelector('input[name="consent"]')?.removeAttribute('required');
    });

    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    await expect(accessErrorAlert(page)).toHaveText('Consent is required to request access.');
    await expect(page).toHaveURL(/\/access$/);
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
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
    await page.getByLabel('FIRST NAME').fill('Sam');
    await page.getByLabel('EMAIL', { exact: true }).fill('sam@example.com');
    await page.getByText('I agree to receive Esque emails').click();
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();

    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });
});

test.describe('access gate — entrance motion', () => {
  test('renders the background silhouettes and ESQUE typography behind the form', async ({
    page,
  }) => {
    await page.goto('/access');
    const entrance = page.locator('div[aria-hidden="true"]').first();
    await expect(entrance.locator('svg')).toHaveCount(3);

    const backgroundTypography = await backgroundWordmark(page);
    await expect(backgroundTypography).toBeVisible();
  });

  test('respects prefers-reduced-motion: the typography renders instantly and cursor parallax is disabled', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/access');

    const heading = await backgroundWordmark(page);
    await expect(heading).toHaveCSS('opacity', '1');

    // Move the pointer and confirm the silhouette layers do not receive a
    // transform-driven offset (motion/react's inline style, not a CSS
    // transition the global reduced-motion rule already covers).
    await page.mouse.move(100, 100);
    await page.mouse.move(800, 50);
    const svg = page.locator('div[aria-hidden="true"] svg').first();
    const transform = await svg.evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });

  test('cursor parallax moves silhouette layers, and different depths move by different amounts', async ({
    page,
  }) => {
    // Reduced motion is NOT emulated here (default Playwright preference is
    // "no-preference") — this is the positive complement to the test above:
    // it fails if handlePointerMove is a no-op, or if every layer moved by
    // the same amount regardless of `depth` (i.e. a uniform shift instead of
    // actual parallax).
    await page.goto('/access');
    const svgs = page.locator('div[aria-hidden="true"] svg');
    await expect(svgs).toHaveCount(3);

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport size unavailable in this project');

    const shallow = svgs.nth(0); // SILHOUETTE_LAYERS[0], depth 0.3
    const deep = svgs.nth(2); // SILHOUETTE_LAYERS[2], depth 1.0
    const identity = /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/;

    // Moving into a corner the centered AccessForm never covers, so the
    // pointermove actually lands on EntranceMotion's div rather than being
    // captured by the form's higher z-indexed wrapper. The move is wrapped
    // in expect.poll (rather than a single move + fixed wait) because it's
    // dropped when it races React hydration — observed in practice on
    // mobile-safari's WebKit engine, which hydrates measurably slower here
    // than Chromium: a pointermove dispatched before the listener attaches
    // is simply never seen by it, so retrying (bounded by the poll's own
    // timeout) is what actually makes this robust, not a longer sleep.
    await expect
      .poll(
        async () => {
          await page.mouse.move(viewport.width / 2, viewport.height / 2);
          await page.mouse.move(20, 20);
          return shallow.evaluate((el) => getComputedStyle(el).transform);
        },
        { timeout: 10_000 },
      )
      .not.toMatch(identity);

    const [shallowTransform, deepTransform] = await Promise.all([
      shallow.evaluate((el) => getComputedStyle(el).transform),
      deep.evaluate((el) => getComputedStyle(el).transform),
    ]);
    expect(shallowTransform).not.toMatch(identity);
    expect(deepTransform).not.toMatch(identity);
    expect(deepTransform).not.toBe(shallowTransform);
  });

  test('/access loads without console errors, including after cursor movement', async ({
    page,
  }) => {
    // Mirrors smoke.spec.ts's "homepage loads without console errors" —
    // listeners must be attached before navigation so nothing during initial
    // load or hydration is missed.
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/access');

    // Exercise the parallax code path itself, not just initial load — polling
    // (rather than a single move) is what actually guarantees
    // handlePointerMove ran before asserting, per the hydration-race finding
    // in the "cursor parallax" test above: a pointermove dispatched before
    // React attaches its listener is dropped, not merely delayed.
    const svg = page.locator('div[aria-hidden="true"] svg').first();
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport size unavailable in this project');
    const identity = /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/;
    await expect
      .poll(
        async () => {
          await page.mouse.move(viewport.width / 2, viewport.height / 2);
          await page.mouse.move(20, 20);
          return svg.evaluate((el) => getComputedStyle(el).transform);
        },
        { timeout: 10_000 },
      )
      .not.toMatch(identity);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});

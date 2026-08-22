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

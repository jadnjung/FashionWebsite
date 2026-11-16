import { expect, test } from '@playwright/test';
import { DROP_ACCESS_EVENT_COOKIE_NAME } from '@/lib/access/cookies';

for (const value of ['%', '%E0%A4%A', '%FF']) {
  test(`malformed grant signal ${value} leaves the storefront usable`, async ({
    context,
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await context.addCookies([
      { name: DROP_ACCESS_EVENT_COOKIE_NAME, value, domain: 'localhost', path: '/' },
    ]);
    await page.goto('/new');
    await expect(page.getByRole('heading', { name: 'NEW', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'MENU', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'MENU', exact: true })).toBeFocused();
    expect(errors).toEqual([]);
    expect(
      (await context.cookies()).some((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME),
    ).toBe(false);
  });
}

test('a valid encoded grant signal is emitted and consumed once', async ({ context, page }) => {
  await context.addCookies([
    {
      name: DROP_ACCESS_EVENT_COOKIE_NAME,
      value: encodeURIComponent('été-002'),
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.addInitScript(() => {
    const signals: string[] = [];
    (window as Window & { grantSignals?: string[] }).grantSignals = signals;
    window.addEventListener('esque:analytics', (event) => {
      const { name, properties } = (event as CustomEvent).detail;
      if (name === 'drop_access_granted') signals.push(properties.collection_handle);
    });
  });
  await page.goto('/new');
  await expect
    .poll(() => page.evaluate(() => (window as Window & { grantSignals?: string[] }).grantSignals))
    .toEqual(['été-002']);
  expect(
    (await context.cookies()).some((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME),
  ).toBe(false);
  await page.getByRole('link', { name: 'BAG (0)', exact: true }).click();
  await expect(page).toHaveURL(/\/bag$/);
  expect(
    await page.evaluate(() => (window as Window & { grantSignals?: string[] }).grantSignals),
  ).toEqual(['été-002']);
});

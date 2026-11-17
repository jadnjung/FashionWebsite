import { expect, test, type Page } from '@playwright/test';
import { DROP_ACCESS_EVENT_COOKIE_NAME } from '@/lib/access/cookies';

async function captureGrants(page: Page) {
  const grants: string[] = [];
  await page.exposeFunction('captureDropGrant', (handle: string) => {
    grants.push(handle);
  });
  await page.addInitScript(() => {
    const target = window as typeof window & {
      grantSession: string;
      captureDropGrant: (handle: string) => Promise<void>;
    };
    target.grantSession = crypto.randomUUID();
    window.addEventListener('esque:analytics', (event) => {
      const { name, properties } = (event as CustomEvent).detail;
      if (name === 'drop_access_granted')
        void target.captureDropGrant(properties.collection_handle);
    });
  });
  return grants;
}

test('a grant added after mount is consumed once on client navigation and a later grant can emit again', async ({
  page,
  context,
}) => {
  const grants = await captureGrants(page);
  await page.goto('/new');
  await page.getByRole('button', { name: 'MENU', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'MENU', exact: true })).toBeFocused();
  const session = await page.evaluate(
    () => (window as typeof window & { grantSession: string }).grantSession,
  );
  await context.addCookies([
    {
      name: DROP_ACCESS_EVENT_COOKIE_NAME,
      value: 'collection-002',
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.getByRole('link', { name: 'BAG (0)', exact: true }).click();
  await expect(page).toHaveURL(/\/bag$/);
  expect(
    await page.evaluate(() => (window as typeof window & { grantSession: string }).grantSession),
  ).toBe(session);
  await expect.poll(() => grants).toEqual(['collection-002']);
  expect(
    (await context.cookies()).some((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME),
  ).toBe(false);
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();
  await context.addCookies([
    {
      name: DROP_ACCESS_EVENT_COOKIE_NAME,
      value: 'collection-002',
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.getByRole('link', { name: 'BAG (0)', exact: true }).click();
  await expect(page).toHaveURL(/\/bag$/);
  await expect(page.getByRole('heading', { name: 'Demo bag', exact: true })).toBeVisible();
  await expect.poll(() => grants).toEqual(['collection-002', 'collection-002']);
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/bag$/);
  await page.reload();
  await expect(page.getByRole('link', { name: 'BAG (0)', exact: true })).toBeVisible();
  expect(grants).toEqual(['collection-002', 'collection-002']);
});

test('query-only product continuation consumes a grant without remounting the document', async ({
  page,
  context,
}) => {
  const grants = await captureGrants(page);
  await page.goto('/new?sort=featured');
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(24);
  const session = await page.evaluate(
    () => (window as typeof window & { grantSession: string }).grantSession,
  );
  await context.addCookies([
    {
      name: DROP_ACCESS_EVENT_COOKIE_NAME,
      value: 'collection-002',
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(6);
  expect(new URL(page.url()).pathname).toBe('/new');
  expect(
    await page.evaluate(() => (window as typeof window & { grantSession: string }).grantSession),
  ).toBe(session);
  await expect.poll(() => grants).toEqual(['collection-002']);
  expect(
    (await context.cookies()).some((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME),
  ).toBe(false);
});

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
    await expect
      .poll(async () =>
        (await context.cookies()).some((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME),
      )
      .toBe(false);
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

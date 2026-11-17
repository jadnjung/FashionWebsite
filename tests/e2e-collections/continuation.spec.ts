import { expect, test } from '@playwright/test';

test('collection pages expose exactly 20/20/5 unique destinations and keyboard/history navigation', async ({
  page,
}) => {
  await page.goto('/collections');
  const entries = page.locator('main ul a');
  const visited: string[] = [];
  for (const [index, count] of [20, 20, 5].entries()) {
    await expect(entries).toHaveCount(count);
    visited.push(
      ...(await entries.evaluateAll((links) => links.map((link) => link.getAttribute('href')!))),
    );
    await expect(
      page.getByRole('status').filter({ hasText: `${count} collections on this page.` }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    if (index < 2) {
      const next = page.getByRole('link', { name: 'Next collections', exact: true });
      await next.focus();
      await expect(next).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`after=preview%3A${(index + 1) * 20}`));
      await expect(
        page.getByRole('heading', { name: 'COLLECTIONS', exact: true }),
      ).toBeInViewport();
    }
  }
  expect(new Set(visited).size).toBe(45);
  expect(visited).toContain('/collections/demo-collection-041');
  expect(visited).toContain('/archive/demo-collection-045');
  await expect(page.getByRole('link', { name: 'Next collections' })).toHaveCount(0);
  await page.goBack();
  await expect(entries).toHaveCount(20);
  await expect(page).toHaveURL(/after=preview%3A20/);
  await page.goForward();
  await expect(entries).toHaveCount(5);
  await page.getByRole('link', { name: 'First page', exact: true }).click();
  await expect(entries).toHaveCount(20);
  await expect(page.getByRole('link', { name: 'First page', exact: true })).toHaveCount(0);
});

test('archive crosses an empty intermediate source page to the final archive', async ({ page }) => {
  await page.goto('/archive');
  await expect(page.locator('main ul a')).toHaveCount(20);
  await page.getByRole('link', { name: 'Next collections' }).click();
  await expect(
    page.getByText('NO ARCHIVED COLLECTIONS ON THIS PAGE.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('main ul a')).toHaveCount(0);
  await expect(page.getByText('THE ARCHIVE BEGINS HERE.', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Next collections' }).click();
  await expect(page.locator('main ul a')).toHaveCount(1);
  await page.getByRole('link', { name: 'Demo Collection 045', exact: true }).click();
  await expect(page).toHaveURL(/\/archive\/demo-collection-045$/);
  await expect(
    page.getByRole('heading', { name: 'Demo Collection 045', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('UNAVAILABLE', { exact: true }).first()).toBeVisible();
});

test('later current and upcoming collections populate the homepage and resolve lifecycle routes', async ({
  page,
}) => {
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Collection Hero' });
  await expect(hero.getByText('DEMO COLLECTION 041', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /DEMO COLLECTION 021 — COMING/ }).click();
  await expect(page).toHaveURL(/\/collections\/demo-collection-021$/);
  await expect(
    page.getByRole('heading', { name: 'DEMO COLLECTION 021', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('EARLY ACCESS CODE', { exact: true })).toBeVisible();
  await page.goto('/collections/demo-collection-041');
  await expect(
    page.getByRole('heading', { name: 'Demo Collection 041', exact: true }),
  ).toBeVisible();
  const currentPiece = page
    .locator('main a[href="/products/preview-featherweight-crewneck"]')
    .first();
  await expect(currentPiece).toBeVisible();
  await currentPiece.click();
  await expect(page).toHaveURL(/\/products\/preview-featherweight-crewneck$/);
  await expect(
    page.getByRole('heading', { name: 'Featherweight Crewneck Sweater', exact: true }),
  ).toBeVisible();
});

test('server HTML normalizes index continuation metadata and excludes tracking and repeated cursors', async ({
  request,
}) => {
  for (const pathname of ['/collections', '/archive']) {
    for (const [query, suffix] of [
      ['after=preview%3A20&utm_source=test', '?after=preview%3A20'],
      ['after=invalid', ''],
      ['after=preview%3A0', ''],
      ['after=preview%3A20&after=preview%3A40', ''],
    ]) {
      const response = await request.get(`${pathname}?${query}`);
      expect(response.status()).toBe(200);
      const html = await response.text();
      const destination = `http://localhost:3000${pathname}${suffix}`;
      expect(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]).toBe(destination);
      expect(html.match(/<meta property="og:url" content="([^"]+)"/)?.[1]).toBe(destination);
      expect(html).not.toContain('name="robots" content="noindex');
    }
  }
});

test('native collection and archive continuation works with JavaScript disabled', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3000/collections');
    await expect(page.locator('main ul a')).toHaveCount(20);
    await page.getByRole('link', { name: 'Next collections' }).click();
    await expect(page.locator('main ul a')).toHaveCount(20);
    await page.getByRole('link', { name: 'Next collections' }).click();
    await expect(page.locator('main ul a')).toHaveCount(5);
    await page.getByRole('link', { name: 'First page', exact: true }).click();
    await expect(page.locator('main ul a')).toHaveCount(20);
    await page.goto('http://localhost:3000/archive?after=preview%3A20');
    await expect(
      page.getByText('NO ARCHIVED COLLECTIONS ON THIS PAGE.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Next collections' }).click();
    await expect(page.locator('main ul a')).toHaveCount(1);
  } finally {
    await context.close();
  }
});

import { expect, test } from '@playwright/test';

test('a future client clock preserves the server drop phase and elapsed countdown refreshes once', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2099-01-01T00:00:00Z') });
  let refreshes = 0;
  const refreshBodies: string[] = [];
  page.on('request', (request) => {
    if (
      new URL(request.url()).pathname === '/collections/collection-002' &&
      request.headers().rsc === '1'
    )
      refreshes += 1;
  });
  await page.route('**/collections/collection-002**', async (route) => {
    if (route.request().headers().rsc !== '1') return route.continue();
    const response = await route.fetch();
    refreshBodies.push(await response.text());
    await route.fulfill({ response });
  });
  await page.goto('/collections/collection-002');
  const countdown = page.getByText(/^\d+D \d+H \d+M \d+S$/);
  await expect(countdown).toBeVisible();
  const initial = await countdown.innerText();
  const [days, hours, minutes, seconds] = initial.match(/\d+/g)!.map(Number);
  const remaining = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  expect(remaining).toBeGreaterThan(60);
  await expect(page.getByRole('button', { name: 'Check again', exact: true })).toHaveCount(0);
  expect(refreshes).toBe(0);
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toHaveCount(0);
  await page.clock.fastForward((remaining + 2) * 1000);
  await expect.poll(() => refreshes).toBe(1);
  await expect.poll(() => refreshBodies.length).toBe(1);
  await expect(page.getByRole('heading', { name: 'COLLECTION 002', exact: true })).toBeVisible();
  await expect(countdown).toBeVisible();
  await expect.poll(async () => countdown.innerText()).not.toBe('0D 0H 0M 0S');
  await page.clock.fastForward(60_000);
  expect(refreshes).toBe(1);
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(0);
  await expect(page.getByText('Draped Satin Slip Dress', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Boxy Denim Jacket', { exact: true })).toHaveCount(0);
  expect(refreshBodies[0]).not.toContain('preview-draped-satin-slip');
  expect(refreshBodies[0]).not.toContain('preview-boxy-denim-jacket');
});

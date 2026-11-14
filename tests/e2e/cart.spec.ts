import { expect, test } from '@playwright/test';

test('Bag remains reachable with an honest unconfigured-store state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'BAG (0)', exact: true }).click();
  await expect(page).toHaveURL(/\/bag$/);
  await expect(page.getByRole('heading', { name: 'Bag', exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'Purchasing is not available yet. Your bag will be connected when the store opens.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /checkout/i })).toHaveCount(0);
  const response = await page.request.post('/api/cart', { data: { lines: [] } });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ error: 'cart_unconfigured' });
});

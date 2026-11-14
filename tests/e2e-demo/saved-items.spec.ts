import { expect, test } from '@playwright/test';

const productHandle = 'preview-featherweight-crewneck';
const productTitle = 'Featherweight Crewneck Sweater';

test('saved items survive returning visits and removal leads back to discovery', async ({
  page,
}) => {
  await page.goto(`/products/${productHandle}`);
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'REMOVE FROM WISHLIST', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/wishlist');
  await page.reload();
  await expect(page.getByRole('link', { name: new RegExp(productTitle) })).toBeVisible();
  const remove = page.getByRole('button', { name: `Remove ${productTitle} from wishlist` });
  await remove.focus();
  await remove.press('Enter');
  await expect(page.getByText('NOTHING SAVED YET.')).toBeVisible();
  const discovery = page.getByRole('link', { name: 'Explore New' });
  await expect(discovery).toBeFocused();
  await discovery.press('Enter');
  await expect(page).toHaveURL('/new');
  await page.goto(`/products/${productHandle}`);
  await expect(page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('a saved list synchronizes with another tab and external storage clearing', async ({
  page,
  context,
}) => {
  await page.goto('/wishlist');
  await expect(page.getByText('NOTHING SAVED YET.')).toBeVisible();
  const other = await context.newPage();
  await other.goto(`/products/${productHandle}`);
  await other.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(productTitle) })).toBeVisible();
  await page.getByRole('button', { name: `Remove ${productTitle} from wishlist` }).click();
  await expect(other.getByRole('button', { name: 'ADD TO WISHLIST', exact: true })).toBeVisible();
  await other.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(productTitle) })).toBeVisible();
  await other.evaluate(() => localStorage.clear());
  await expect(page.getByText('NOTHING SAVED YET.')).toBeVisible();
});

test('malformed saved entries recover without losing valid older saves', async ({ page }) => {
  await page.goto(`/products/${productHandle}`);
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('esque:wishlist')!);
    data.items = [null, { handle: '../invalid' }, ...data.items, ...data.items];
    localStorage.setItem('esque:wishlist', JSON.stringify(data));
  });
  await page.goto('/wishlist');
  await expect(page.getByRole('link', { name: new RegExp(productTitle) })).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: `Remove ${productTitle} from wishlist` }),
  ).toBeVisible();
});

test('availability errors preserve cached imagery and offer a working retry', async ({ page }) => {
  await page.goto(`/products/${productHandle}`);
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await page.route(`**/api/products/${productHandle}`, (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'product_fetch_failed' }),
    }),
  );
  await page.goto('/wishlist');
  const savedProduct = page.getByRole('link', { name: new RegExp(productTitle) });
  await expect(savedProduct).toBeVisible();
  await expect(savedProduct.locator('img')).toHaveCount(1);
  await expect(page.getByText('Availability could not be refreshed.')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Retry availability' });
  await expect(retry).toBeEnabled();
  await page.unroute(`**/api/products/${productHandle}`);
  await retry.focus();
  await retry.press('Enter');
  await expect(page.getByText('Availability could not be refreshed.')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: `Remove ${productTitle} from wishlist` }),
  ).toBeFocused();
  await expect(savedProduct).toBeVisible();
});

test('a full store keeps saved items usable and explains session-only persistence', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'esque:wishlist') throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto(`/products/${productHandle}`);
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'REMOVE FROM WISHLIST', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Changes are kept for this visit/)).toBeVisible();
  await page.getByRole('link', { name: 'Wishlist', exact: true }).click();
  await expect(page).toHaveURL('/wishlist');
  await expect(
    page
      .getByRole('list', { name: 'Saved pieces' })
      .getByRole('link', { name: new RegExp(productTitle) }),
  ).toBeVisible();
  await page.getByRole('button', { name: `Remove ${productTitle} from wishlist` }).click();
  await expect(page.getByText('NOTHING SAVED YET.')).toBeVisible();
});

for (const width of [390, 768, 1024, 1440]) {
  test(`saved-item actions fit at ${width}px and preserve focus after removal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/products/${productHandle}`);
    await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
    await page.goto('/products/preview-relaxed-linen-trouser');
    await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
    await page.goto('/wishlist');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const first = page.getByRole('button', { name: 'Remove Relaxed Linen Trouser from wishlist' });
    const next = page.getByRole('button', { name: `Remove ${productTitle} from wishlist` });
    await first.focus();
    await first.press('Enter');
    await expect(next).toBeFocused();
  });
}

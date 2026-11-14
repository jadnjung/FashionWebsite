import { expect, test, type Page } from '@playwright/test';

async function selectCrewneck(page: Page) {
  await page.goto('/products/preview-featherweight-crewneck');
  for (const name of ['M', 'Black']) {
    const radio = page.getByRole('main').getByRole('radio', { name, exact: true });
    await radio.focus();
    await radio.press('Space');
  }
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
}

test('demo bag persists canonical variants, updates quantity, subtotal and removes with focus restored', async ({
  page,
}) => {
  await selectCrewneck(page);
  await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).fill('2');
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'BAG (2)', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Demo bag' })).toBeVisible();
  const summary = page.getByRole('region', { name: 'Bag summary' });
  await expect(summary).toContainText('$256.00');
  await expect(page.getByText('Size M / Color Black')).toBeVisible();
  await page.getByRole('button', { name: /^Save Featherweight.*to wishlist$/ }).click();
  await expect(
    page.getByRole('button', { name: /^Featherweight.*saved to wishlist$/ }),
  ).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: 'Saved to wishlist.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CHECKOUT UNAVAILABLE' })).toBeDisabled();
  await page.getByRole('spinbutton', { name: /Quantity for/ }).fill('3');
  await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
  await expect(summary).toContainText('$384.00');
  await expect(page.getByRole('spinbutton', { name: /Quantity for/ })).toBeFocused();
  await page.reload();
  await expect(page.getByRole('link', { name: 'BAG (3)', exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: /Quantity for/ })).toHaveValue('3');
  await page.getByRole('button', { name: /^Remove Featherweight/ }).click();
  await expect(page.getByText('YOUR BAG IS EMPTY.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo bag' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'BAG (0)', exact: true })).toBeVisible();
});

test('rejected mutation keeps existing state and retry performs one replacement', async ({
  page,
}) => {
  await selectCrewneck(page);
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  let mutations = 0;
  await page.route('**/api/cart', async (route) => {
    mutations += 1;
    if (mutations === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'cart_failed' }),
      });
    } else {
      await route.continue();
    }
  });
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'The demo bag could not be updated.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'TRY AGAIN', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  expect(mutations).toBe(2);
  await expect(page.getByRole('link', { name: 'VIEW BAG', exact: true })).toBeFocused();
});

test('two variants of one product keep separate quantities, labels and removal targets', async ({
  page,
}) => {
  await selectCrewneck(page);
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Ecru', exact: true }).press('Space');
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await page.getByRole('link', { name: 'BAG (2)', exact: true }).click();
  const blackLabel = 'Featherweight Crewneck Sweater, Size M, Color Black';
  const ecruLabel = 'Featherweight Crewneck Sweater, Size M, Color Ecru';
  await expect(
    page.getByRole('spinbutton', { name: `Quantity for ${blackLabel}`, exact: true }),
  ).toHaveValue('1');
  await expect(
    page.getByRole('spinbutton', { name: `Quantity for ${ecruLabel}`, exact: true }),
  ).toHaveValue('1');
  await expect(page.getByRole('region', { name: 'Bag summary' })).toContainText('$264.00');
  await page.getByRole('button', { name: `Remove ${blackLabel}`, exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: `Quantity for ${blackLabel}`, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('spinbutton', { name: `Quantity for ${ecruLabel}`, exact: true }),
  ).toHaveValue('1');
  await expect(page.getByRole('region', { name: 'Bag summary' })).toContainText('$136.00');
});

test('sticky mobile purchasing exposes pending, failure, retry and success feedback in the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await selectCrewneck(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  const mobile = page.getByRole('region', { name: 'Mobile purchase controls' });
  await expect(mobile).toBeVisible();
  let requests = 0;
  let release = () => {};
  const delayedResponse = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/cart', async (route) => {
    requests += 1;
    if (requests === 1) {
      await delayedResponse;
      await route.fulfill({ status: 503, json: { error: 'cart_failed' } });
    } else await route.continue();
  });
  try {
    await mobile.getByRole('button', { name: 'ADD SELECTED ITEM' }).click();
    await expect(mobile.getByRole('status')).toHaveText('Updating demo bag…');
    await expect(mobile.getByRole('status')).toBeInViewport();
    release();
    await expect(mobile.getByRole('status')).toContainText('The demo bag could not be updated.');
    const retry = mobile.getByRole('button', { name: 'TRY AGAIN', exact: true });
    await expect(retry).toBeInViewport();
    await retry.press('Enter');
    await expect(mobile.getByRole('status')).toHaveText('Added to demo bag.');
    const viewBag = mobile.getByRole('link', { name: 'VIEW BAG', exact: true });
    await expect(viewBag).toBeFocused();
    await expect(viewBag).toBeInViewport();
    await expect
      .poll(
        async () =>
          Number.parseFloat(
            await page
              .locator('body')
              .evaluate((element) => getComputedStyle(element).paddingBottom),
          ) - (await mobile.boundingBox())!.height,
      )
      .toBeGreaterThanOrEqual(15);
    await viewBag.press('Enter');
    await expect(page).toHaveURL('/bag');
    await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  } finally {
    release();
  }
});

test('pending duplicate activation produces one add and preserves the selected quantity', async ({
  page,
}) => {
  await selectCrewneck(page);
  let mutations = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/cart', async (route) => {
    mutations += 1;
    await gate;
    await route.continue();
  });
  const add = page.getByRole('button', { name: 'ADD TO BAG', exact: true });
  await add.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(add).toBeDisabled();
  release();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  expect(mutations).toBe(1);
});

test('failed removal retains keyboard focus and can be retried from the bag', async ({ page }) => {
  await selectCrewneck(page);
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await page.getByRole('link', { name: 'BAG (1)', exact: true }).click();
  let attempts = 0;
  await page.route('**/api/cart', async (route) => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 503, json: { error: 'cart_failed' } });
    else await route.continue();
  });
  const remove = page.getByRole('button', { name: /^Remove Featherweight/ });
  await remove.focus();
  await remove.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: /could not be updated/ })).toBeVisible();
  await expect(remove).toBeFocused();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'TRY AGAIN', exact: true }).press('Enter');
  await expect(page.getByText('YOUR BAG IS EMPTY.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo bag', exact: true })).toBeFocused();
  expect(attempts).toBe(2);
});

test('blocked storage retains the current-tab cart and gives persistence feedback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'esque:demo-cart') throw new DOMException('Blocked', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await selectCrewneck(page);
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'Your demo bag is available in this tab. Saving it between visits is unavailable.',
    ),
  ).toBeVisible();
  await page.getByRole('link', { name: 'BAG (1)', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Bag items' })).toBeVisible();
});

test('320px header accommodates multi-digit bag count', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() =>
    localStorage.setItem(
      'esque:demo-cart',
      JSON.stringify({
        v: 1,
        lines: [
          {
            handle: 'preview-featherweight-crewneck',
            variantId: 'preview-1-variant-6',
            quantity: 99,
          },
        ],
      }),
    ),
  );
  await page.goto('/bag');
  await expect(page.getByRole('link', { name: 'BAG (99)', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const bag = await page.getByRole('link', { name: 'BAG (99)', exact: true }).boundingBox();
  expect(bag?.x).toBeGreaterThanOrEqual(0);
  expect((bag?.x ?? 0) + (bag?.width ?? 0)).toBeLessThanOrEqual(320);
  expect(bag?.height).toBeLessThanOrEqual(56);
  const wordmark = await page.getByRole('link', { name: 'ESQUE', exact: true }).boundingBox();
  const menu = await page.getByRole('button', { name: 'MENU', exact: true }).boundingBox();
  expect((wordmark?.x ?? 0) + (wordmark?.width ?? 0)).toBeLessThanOrEqual(menu?.x ?? 0);
});

test('mobile purchase control focuses missing options and shares add behavior', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/products/preview-featherweight-crewneck');
  const mobile = page.getByRole('region', { name: 'Mobile purchase controls' });
  const originalAdd = page.getByRole('button', { name: 'ADD TO BAG', exact: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(mobile).toBeVisible();
  await mobile.getByRole('button', { name: 'CHOOSE OPTIONS' }).click();
  await expect(page.getByRole('radio', { name: 'S', exact: true }).first()).toBeFocused();
  const main = page.getByRole('main');
  for (const name of ['M', 'Black']) {
    const radio = main.getByRole('radio', { name, exact: true });
    await radio.focus();
    await radio.press('Space');
  }
  await originalAdd.scrollIntoViewIfNeeded();
  await expect(mobile).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(mobile).toBeVisible();
  await mobile.getByRole('button', { name: 'ADD SELECTED ITEM' }).click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
});

test('saved unavailable and overstock selections remain visible while valid selections are preserved', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('esque:demo-cart')) return;
    localStorage.setItem(
      'esque:demo-cart',
      JSON.stringify({
        v: 1,
        lines: [
          {
            handle: 'preview-featherweight-crewneck',
            variantId: 'preview-1-variant-1',
            quantity: 2,
          },
          {
            handle: 'preview-featherweight-crewneck',
            variantId: 'preview-1-variant-4',
            quantity: 3,
          },
          { handle: 'preview-fluid-knit-long-sleeve', variantId: 'missing-variant', quantity: 1 },
        ],
      }),
    );
  });
  await page.goto('/bag');
  await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bag summary' })).toContainText('$256.00');
  const recovery = page.getByRole('region', { name: 'Saved selections needing attention' });
  await expect(recovery.getByRole('button', { name: /^Remove saved selection/ })).toHaveCount(2);
  await recovery
    .getByRole('button', {
      name: 'Remove saved selection Fluid Knit Long-Sleeve Unavailable selection',
      exact: true,
    })
    .click();
  await expect(recovery.getByRole('button', { name: /^Remove saved selection/ })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  await page.reload();
  await expect(recovery.getByRole('button', { name: /^Remove saved selection/ })).toHaveCount(1);
});

test('two open tabs preserve sequential adds and synchronize an external storage clear', async ({
  page,
  context,
}) => {
  await selectCrewneck(page);
  const second = await context.newPage();
  await selectCrewneck(second);
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  await expect(second.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  await expect(second.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
  await second.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(second.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  await second.evaluate(() => localStorage.clear());
  await expect(page.getByRole('link', { name: 'BAG (0)', exact: true })).toBeVisible();
  await second.close();
});

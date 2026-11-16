import { expect, test, type Page } from '@playwright/test';

async function selectCrewneck(page: Page) {
  await page.goto('/products/preview-featherweight-crewneck');
  for (const name of ['M', 'Black']) {
    await page.getByRole('main').getByRole('radio', { name, exact: true }).press('Space');
  }
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
}

async function expectQuantity(page: Page, quantity: number) {
  await expect(page.getByRole('link', { name: `BAG (${quantity})`, exact: true })).toBeVisible();
}

for (const operation of ['add', 'quantity', 'remove', 'clear'] as const) {
  test(`background restore retry preserves an acknowledged ${operation}`, async ({
    page,
    context,
  }) => {
    await selectCrewneck(page);
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expectQuantity(page, 1);
    await page.getByRole('link', { name: 'BAG (1)', exact: true }).click();

    if (operation === 'quantity') {
      await page.getByRole('spinbutton', { name: /Quantity for/ }).fill('2');
      await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
      await expectQuantity(page, 2);
    } else if (operation === 'remove') {
      await page.getByRole('button', { name: /^Remove Featherweight/ }).click();
      await expectQuantity(page, 0);
    } else if (operation === 'clear') {
      await page.route('**/api/cart', (route) =>
        route.fulfill({ status: 503, json: { error: 'cart_failed' } }),
      );
      await page.getByRole('button', { name: /^Remove Featherweight/ }).click();
      await expect(page.getByRole('button', { name: 'CLEAR DEMO BAG' })).toBeVisible();
      await page.unroute('**/api/cart');
      await page.getByRole('button', { name: 'CLEAR DEMO BAG' }).click();
      await expectQuantity(page, 0);
    }

    const second = await context.newPage();
    await selectCrewneck(second);
    const requests: string[] = [];
    await page.route('**/api/cart', async (route) => {
      requests.push(route.request().postDataJSON().operation.type);
      if (requests.length === 1) {
        await route.fulfill({ status: 503, json: { error: 'cart_failed' } });
      } else {
        await route.continue();
      }
    });
    await second.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    const expected = operation === 'quantity' ? 3 : operation === 'add' ? 2 : 1;
    await expectQuantity(second, expected);
    const retry = page.getByRole('button', { name: 'TRY AGAIN', exact: true });
    await expect(retry).toBeVisible();
    await retry.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await expectQuantity(page, expected);
    await expect(retry).toBeHidden();
    expect(requests).toEqual(['restore', 'restore']);
    await page.reload();
    await expectQuantity(page, expected);
    await expectQuantity(second, expected);
  });
}

test('initial restore failure retries the saved bag without adding a piece', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'esque:demo-cart',
      JSON.stringify({
        v: 1,
        lines: [
          {
            handle: 'preview-featherweight-crewneck',
            variantId: 'preview-1-variant-6',
            quantity: 2,
          },
        ],
      }),
    );
  });
  const requests: string[] = [];
  await page.route('**/api/cart', async (route) => {
    requests.push(route.request().postDataJSON().operation.type);
    if (requests.length === 1) {
      await route.fulfill({ status: 503, json: { error: 'cart_failed' } });
    } else {
      await route.continue();
    }
  });
  await page.goto('/bag');
  await page.getByRole('button', { name: 'TRY AGAIN', exact: true }).press('Enter');
  await expectQuantity(page, 2);
  await expect(page.getByRole('button', { name: 'TRY AGAIN', exact: true })).toBeHidden();
  expect(requests).toEqual(['restore', 'restore']);
});

test('timed-out background refresh retries restore and ignores its delayed response', async ({
  page,
  context,
}) => {
  await selectCrewneck(page);
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expectQuantity(page, 1);
  await page.getByRole('link', { name: 'BAG (1)', exact: true }).click();
  const second = await context.newPage();
  await selectCrewneck(second);
  await page.clock.install();
  const requests: string[] = [];
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let delayedResponseFinished = false;
  await page.route('**/api/cart', async (route) => {
    requests.push(route.request().postDataJSON().operation.type);
    if (requests.length === 1) {
      const response = await route.fetch();
      await gate;
      try {
        await route.fulfill({ response });
      } catch {
        // The browser may discard the response after the request is aborted.
      } finally {
        delayedResponseFinished = true;
      }
    } else {
      await route.continue();
    }
  });
  try {
    await second.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expectQuantity(second, 2);
    await expect.poll(() => requests.length).toBe(1);
    await page.clock.fastForward(10_001);
    await expect(page.getByRole('status').filter({ hasText: 'took too long' })).toBeVisible();
    await page.getByRole('button', { name: 'TRY AGAIN', exact: true }).press('Enter');
    await expectQuantity(page, 2);
    await expect(page.getByRole('button', { name: 'TRY AGAIN', exact: true })).toBeHidden();
    await second.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expectQuantity(second, 3);
    await expectQuantity(page, 3);
    release();
    await expect.poll(() => delayedResponseFinished).toBe(true);
    await expectQuantity(page, 3);
    await page.reload();
    await expectQuantity(page, 3);
    expect(requests).toEqual(['restore', 'restore', 'restore', 'restore']);
  } finally {
    release();
  }
});

for (const backgroundFails of [false, true]) {
  test(`queued ${backgroundFails ? 'failed' : 'successful'} storage refresh preserves a failed foreground add`, async ({
    page,
    context,
  }) => {
    await selectCrewneck(page);
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expectQuantity(page, 1);
    const second = await context.newPage();
    await second.goto('/bag');
    await expectQuantity(second, 1);
    const requests: string[] = [];
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/cart', async (route) => {
      requests.push(route.request().postDataJSON().operation.type);
      if (requests.length === 1) {
        await gate;
        await route.fulfill({ status: 422, json: { error: 'quantity_unavailable' } });
      } else if (requests.length === 2 && backgroundFails) {
        await route.fulfill({ status: 503, json: { error: 'cart_failed' } });
      } else {
        await route.continue();
      }
    });
    try {
      await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
      await expect.poll(() => requests.length).toBe(1);
      await second.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('esque:demo-cart')!);
        saved.lines[0].quantity = 2;
        localStorage.setItem('esque:demo-cart', JSON.stringify(saved));
      });
      release();
      await expect.poll(() => requests.length).toBe(2);
      await expect(
        page.getByRole('status').filter({ hasText: 'exceeds demo availability' }),
      ).toBeVisible();
      const retry = page.getByRole('button', { name: 'TRY AGAIN', exact: true });
      await expect(retry).toHaveAttribute('aria-disabled', 'false');
      await retry.press('Enter');
      await expectQuantity(page, 3);
      await expect(retry).toBeHidden();
      await expectQuantity(second, 3);
      expect(requests).toEqual(['add', 'restore', 'add']);
    } finally {
      release();
    }
  });
}

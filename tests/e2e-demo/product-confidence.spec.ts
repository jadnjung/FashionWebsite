import { expect, test, type Page } from '@playwright/test';

const crewneck = {
  handle: 'preview-featherweight-crewneck',
  variantId: 'preview-1-variant-1',
  quantity: 8,
};

async function seedBag(page: Page, quantity = 8) {
  await page.addInitScript(
    (line) => {
      if (!localStorage.getItem('esque:demo-cart')) {
        localStorage.setItem('esque:demo-cart', JSON.stringify({ v: 1, lines: [line] }));
      }
    },
    { ...crewneck, quantity },
  );
}

test('PDP caps additions by remaining capacity and offers bag management when full', async ({
  page,
}) => {
  await seedBag(page, 6);
  await page.goto(`/products/${crewneck.handle}?variant=${crewneck.variantId}`);
  await expect(page.getByRole('link', { name: 'BAG (6)', exact: true })).toBeVisible();
  const quantity = page.getByRole('spinbutton', { name: 'Quantity', exact: true });
  await expect(quantity).toHaveAttribute('max', '2');
  await expect(page.getByText('6 already in your bag. You can add up to 2 more.')).toBeVisible();
  await quantity.fill('8');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('2');
  const add = page.getByRole('button', { name: 'ADD TO BAG', exact: true });
  await add.click();
  await expect(page.getByRole('link', { name: 'BAG (8)', exact: true })).toBeVisible();
  await expect(add).toBeDisabled();
  await expect(quantity).toBeDisabled();
  await expect(
    page.getByText('8 already in your bag. This selection is at its bag limit.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'VIEW BAG', exact: true }).first().click();
  await expect(page).toHaveURL('/bag');
  await expect(page.getByRole('spinbutton', { name: /Quantity for/ })).toHaveValue('8');
});

test('mobile exhausted selection offers an actionable sticky bag destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedBag(page);
  await page.goto(`/products/${crewneck.handle}?variant=${crewneck.variantId}`);
  await expect(page.getByRole('link', { name: 'BAG (8)', exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  const mobile = page.getByRole('region', { name: 'Mobile purchase controls' });
  await expect(mobile.getByRole('status')).toContainText('at its bag limit');
  const link = mobile.getByRole('link', { name: 'VIEW BAG', exact: true });
  await link.focus();
  await link.press('Enter');
  await expect(page).toHaveURL('/bag');
});

test('Quick Add prevents an exhausted variant and lets another variant be added', async ({
  page,
}) => {
  await seedBag(page);
  await page.goto('/new?sort=featured');
  const trigger = page
    .locator(`a[href="/products/${crewneck.handle}"]`)
    .locator('..')
    .getByRole('button', { name: 'QUICK ADD', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: /Quick Add.*Featherweight/ });
  for (const name of ['M', 'Black']) {
    await dialog.getByRole('radio', { name, exact: true }).press('Space');
  }
  await expect(dialog.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeDisabled();
  await expect(
    dialog.getByText('8 already in your bag. This selection is at its bag limit.'),
  ).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'VIEW BAG', exact: true })).toBeVisible();
  await dialog.getByRole('radio', { name: 'Ecru', exact: true }).press('Space');
  await dialog.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(dialog.getByRole('status').filter({ hasText: 'Added to demo bag.' })).toBeVisible();
  await dialog.getByRole('link', { name: 'VIEW BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (9)', exact: true })).toBeVisible();
});

test('Shop the Look identifies the exhausted included piece and supports excluding it', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedBag(page);
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Shop the Look' });
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('list', { name: 'All looks', exact: true })).toBeVisible();
  await section.getByRole('button', { name: /^LOOK 02,/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Shop the Look', exact: true });
  for (const handle of [crewneck.handle, 'preview-tailored-trouser-set']) {
    for (const [option, value] of [
      ['Size', 'M'],
      ['Color', 'Black'],
    ]) {
      await dialog
        .locator(`input[name="look-${handle}-${option}"][value="${value}"]`)
        .press('Space');
    }
  }
  await expect(dialog.getByRole('button', { name: 'ADD LOOK', exact: true })).toBeDisabled();
  await expect(
    dialog.getByRole('status').filter({ hasText: 'Change its options or exclude this piece' }),
  ).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'VIEW BAG', exact: true })).toBeVisible();
  await dialog
    .getByRole('checkbox', { name: 'Include Featherweight Crewneck Sweater', exact: true })
    .uncheck();
  await dialog.getByRole('button', { name: 'ADD LOOK', exact: true }).click();
  await expect(dialog.getByRole('status').filter({ hasText: 'Added to demo bag.' })).toBeVisible();
  await dialog.getByRole('link', { name: 'VIEW BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (9)', exact: true })).toBeVisible();
});

test('cart capacity rejection preserves the bag and exposes a useful destination', async ({
  page,
}) => {
  await page.goto(`/products/${crewneck.handle}?variant=${crewneck.variantId}`);
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'BAG (0)', exact: true })).toBeVisible();
  await page.route('**/api/cart', (route) =>
    route.fulfill({ status: 422, json: { error: 'cart_full' } }),
  );
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'The demo bag is full.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'BAG (0)', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'VIEW BAG', exact: true })).toBeVisible();
});

test('selected-variant bag imagery survives quantity updates and reload', async ({ page }) => {
  await page.goto('/products/preview-variant-media');
  for (const name of ['M', 'Ecru']) {
    await page.getByRole('main').getByRole('radio', { name, exact: true }).press('Space');
  }
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await page.getByRole('link', { name: 'BAG (1)', exact: true }).click();
  const image = page.getByRole('main').locator('img').first();
  await expect(image).toHaveAttribute('src', /product-4\.jpg/);
  await expect(page.getByText('Size M / Color Ecru', { exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: /Quantity for/ }).fill('2');
  await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  await page.reload();
  await expect(image).toHaveAttribute('src', /product-4\.jpg/);
  await expect(page.getByRole('spinbutton', { name: /Quantity for/ })).toHaveValue('2');
  await page.goto('/new?sort=featured');
  const trigger = page
    .locator('a[href="/products/preview-variant-media"]')
    .locator('..')
    .getByRole('button', { name: 'QUICK ADD', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: /Quick Add.*Demo variant media/ });
  await dialog.getByRole('radio', { name: 'M', exact: true }).press('Space');
  for (const color of ['Black', 'Unmapped']) {
    await dialog.getByRole('radio', { name: color, exact: true }).press('Space');
    await dialog.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expect(
      dialog.getByRole('status').filter({ hasText: 'Added to demo bag.' }),
    ).toBeVisible();
  }
  await dialog.getByRole('link', { name: 'VIEW BAG', exact: true }).click();
  for (const color of ['Black', 'Unmapped']) {
    const line = page
      .getByRole('listitem')
      .filter({ has: page.getByText(`Size M / Color ${color}`, { exact: true }) });
    await expect(line.locator('img')).toHaveAttribute('src', /product-3\.jpg/);
  }
  await expect(page.getByRole('link', { name: 'BAG (4)', exact: true })).toBeVisible();
});

test('cart API merges a full bag atomically and rejects oversized results and requests', async ({
  request,
}) => {
  const lines = Array.from({ length: 50 }, (_, index) => ({
    handle: 'preview-many-variants',
    variantId: `preview-scenario-5-variant-${index + 1}`,
    quantity: 1,
  }));
  const added = await request.post('/api/cart', {
    data: { lines, operation: { type: 'add', items: [lines[0], lines[0]] } },
  });
  expect(added.status()).toBe(200);
  const { cart } = await added.json();
  expect(cart.lines).toHaveLength(50);
  expect(cart.lines[0].quantity).toBe(3);
  const full = await request.post('/api/cart', {
    data: {
      lines,
      operation: {
        type: 'add',
        items: [{ ...lines[0], variantId: 'preview-scenario-5-variant-51' }],
      },
    },
  });
  expect(full.status()).toBe(422);
  expect(await full.json()).toEqual({ error: 'cart_full' });
  const oversized = await request.post('/api/cart', {
    data: { lines, operation: { type: 'add', items: Array.from({ length: 51 }, () => lines[0]) } },
  });
  expect(oversized.status()).toBe(400);
  expect(await oversized.json()).toEqual({ error: 'invalid_cart' });
});

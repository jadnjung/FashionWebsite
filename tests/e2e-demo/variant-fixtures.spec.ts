import { expect, test, type Locator, type Page } from '@playwright/test';
import type { ProductDetail } from '@/lib/shopify/products';

const productPath = '/products/preview-featherweight-crewneck';
const productApi = '**/api/products/preview-featherweight-crewneck';

async function selectWithKeyboard(scope: Locator, value: string) {
  const radio = scope.getByRole('radio', { name: value, exact: true });
  await radio.focus();
  await radio.press('Space');
  await expect(radio).toBeChecked();
}

function crewneckQuickAdd(page: Page) {
  return page
    .getByRole('link', { name: /Featherweight Crewneck Sweater/ })
    .locator('..')
    .getByRole('button', { name: 'QUICK ADD', exact: true });
}

test('keyboard variant changes update price, scarcity, quantity bounds and purchasing availability', async ({
  page,
}) => {
  await page.goto(productPath);
  const main = page.getByRole('main');
  const quantity = main.getByRole('spinbutton', { name: 'Quantity' });
  const add = main.getByRole('button', { name: 'ADD TO BAG', exact: true });

  await expect(main.getByRole('radio', { name: 'XS', exact: true })).toBeDisabled();
  await selectWithKeyboard(main, 'M');
  await selectWithKeyboard(main, 'Black');
  await expect(main.getByText('$128.00', { exact: true })).toBeVisible();
  await expect(main.getByText('LOW STOCK', { exact: true })).toBeVisible();
  await expect(quantity).toHaveAttribute('max', '8');
  await quantity.fill('7');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('7');

  await selectWithKeyboard(main, 'S');
  await expect(quantity).toHaveValue('3');
  await expect(quantity).toHaveAttribute('max', '3');
  await expect(main.getByText('3 REMAIN', { exact: true })).toBeVisible();

  await selectWithKeyboard(main, 'M');
  await selectWithKeyboard(main, 'Ecru');
  await expect(main.getByText('$136.00', { exact: true })).toBeVisible();
  await expect(quantity).toHaveValue('2');
  await expect(quantity).toHaveAttribute('max', '2');
  await expect(main.getByText('2 REMAIN', { exact: true })).toBeVisible();
  await expect(add).toBeEnabled();

  await selectWithKeyboard(main, 'S');
  await expect(main.getByText('SOLD OUT', { exact: true })).toBeVisible();
  await expect(add).toBeDisabled();

  await selectWithKeyboard(main, 'L');
  await expect(main.getByText('$140.00', { exact: true })).toBeVisible();
  await expect(main.getByText(/^(SOLD OUT|LOW STOCK|\d+ REMAIN)$/)).toHaveCount(0);
  await expect(quantity).not.toHaveAttribute('max', /.+/);
  await quantity.fill('4');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('4');
  await expect(add).toBeEnabled();

  await selectWithKeyboard(main, 'Black');
  await expect(main.getByText('$128.00', { exact: true })).toBeVisible();
  await expect(main.getByText('SOLD OUT', { exact: true })).toBeVisible();
  await expect(add).toBeDisabled();
});

test('Quick Add selections expose selected prices and sold-out combinations with keyboard or touch', async ({
  page,
  isMobile,
}) => {
  await page.goto('/new');
  const trigger = crewneckQuickAdd(page);
  if (isMobile) {
    await trigger.tap();
  } else {
    await trigger.focus();
    await trigger.press('Enter');
  }
  const dialog = page.getByRole('dialog', { name: /Quick Add.*Featherweight/ });
  await expect(dialog.getByText('$128.00', { exact: true })).toBeVisible();

  async function select(value: string) {
    if (isMobile) {
      await dialog
        .locator('label')
        .filter({ hasText: new RegExp(`^${value}$`) })
        .tap();
    } else {
      await selectWithKeyboard(dialog, value);
    }
    await expect(dialog.getByRole('radio', { name: value, exact: true })).toBeChecked();
  }

  await select('M');
  await select('Ecru');
  const add = dialog.getByRole('button', { name: 'ADD TO BAG', exact: true });
  await expect(dialog.getByText('$136.00', { exact: true })).toBeVisible();
  await expect(add).toBeEnabled();
  await select('S');
  await expect(add).toBeDisabled();
  await expect(dialog.getByText(/sold out/i)).toBeVisible();
  await select('Black');
  await expect(dialog.getByText('$128.00', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/sold out/i)).toHaveCount(0);
  await expect(add).toBeEnabled();
  await dialog.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('Quick Add explains a missing combination and recovers when another color is selected', async ({
  page,
}) => {
  await page.route(productApi, async (route) => {
    const response = await route.fetch();
    const payload = (await response.json()) as { product: ProductDetail };
    payload.product.variants = payload.product.variants.filter(
      (variant) => variant.title !== 'S / Ecru',
    );
    await route.fulfill({ response, json: payload });
  });
  await page.goto('/new');
  await crewneckQuickAdd(page).press('Enter');
  const dialog = page.getByRole('dialog', { name: /Quick Add.*Featherweight/ });
  await selectWithKeyboard(dialog, 'S');
  await selectWithKeyboard(dialog, 'Ecru');
  const add = dialog.getByRole('button', { name: 'ADD TO BAG', exact: true });
  await expect(dialog.getByText('This combination is unavailable.', { exact: true })).toBeVisible();
  await expect(add).toBeDisabled();
  await selectWithKeyboard(dialog, 'Black');
  await expect(dialog.getByText('This combination is unavailable.', { exact: true })).toHaveCount(
    0,
  );
  await expect(dialog.getByText('$128.00', { exact: true })).toBeVisible();
  await expect(add).toBeEnabled();
});

test('Quick Add retries a failed product request and restores usable variant choices', async ({
  page,
}) => {
  let requests = 0;
  await page.route(productApi, async (route) => {
    requests += 1;
    if (requests === 1) {
      await route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } });
      return;
    }
    await route.continue();
  });
  await page.goto('/new');
  await crewneckQuickAdd(page).press('Enter');
  const dialog = page.getByRole('dialog', { name: /Quick Add.*Featherweight/ });
  await expect(dialog.getByText('SOMETHING WENT WRONG.', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Retry', exact: true }).click();
  await selectWithKeyboard(dialog, 'M');
  await selectWithKeyboard(dialog, 'Ecru');
  await expect(dialog.getByText('$136.00', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
  expect(requests).toBe(2);
});

test('closing Quick Add while a request is pending preserves selections after reopening', async ({
  page,
}) => {
  let requests = 0;
  let releaseFirst = () => {};
  let finishFirst = () => {};
  const heldResponse = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const firstResponseFinished = new Promise<void>((resolve) => {
    finishFirst = resolve;
  });
  await page.route(productApi, async (route) => {
    requests += 1;
    if (requests === 1) {
      const response = await route.fetch();
      await heldResponse;
      try {
        await route.fulfill({ response });
      } finally {
        finishFirst();
      }
      return;
    }
    await route.continue();
  });

  try {
    await page.goto('/new');
    const trigger = crewneckQuickAdd(page);
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: /Quick Add.*Featherweight/ });
    await expect.poll(() => requests).toBe(1);
    await expect(dialog.getByRole('radio')).toHaveCount(0);
    const canceledRequest = page.waitForEvent('requestfailed', {
      predicate: (request) =>
        request.url().endsWith('/api/products/preview-featherweight-crewneck'),
    });
    await dialog.getByRole('button', { name: 'CLOSE', exact: true }).click();
    expect((await canceledRequest).failure()).not.toBeNull();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.press('Enter');
    await selectWithKeyboard(dialog, 'M');
    await selectWithKeyboard(dialog, 'Ecru');
    await expect.poll(() => requests).toBe(2);
    releaseFirst();
    await firstResponseFinished;
    await expect(dialog.getByRole('radio', { name: 'M', exact: true })).toBeChecked();
    await expect(dialog.getByRole('radio', { name: 'Ecru', exact: true })).toBeChecked();
    await expect(dialog.getByText('$136.00', { exact: true })).toBeVisible();
    await expect(dialog.getByText('SOMETHING WENT WRONG.', { exact: true })).toHaveCount(0);
  } finally {
    releaseFirst();
  }
});

test('three illustrative gallery images retain responsive sizing at 320px reflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(productPath);
  const images = page.getByRole('main').locator('img').first().locator('../..').locator('img');
  await expect(images).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const image = images.nth(index);
    await expect(image).toHaveAttribute('alt', /preview|placeholder|demo/i);
    await expect(image).toHaveAttribute('sizes', /58vw/);
    if (index > 0) await expect(image).toHaveAttribute('loading', 'lazy');
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeInViewport();
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
    const box = await image.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height / box!.width).toBeCloseTo(1.25, 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('the multi-price fixture remains discoverable through minimum-price filtering and search', async ({
  page,
}) => {
  await page.goto('/new?minPrice=128&maxPrice=128');
  const product = page
    .getByRole('main')
    .getByRole('link', { name: /Featherweight Crewneck Sweater/ });
  await expect(product).toBeVisible();
  await expect(page.getByRole('link', { name: /Velvet Evening Jacket/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Search', exact: true });
  await search.getByRole('searchbox').fill('Featherweight');
  await search.getByRole('link', { name: /Featherweight Crewneck Sweater/ }).click();
  await expect(page).toHaveURL(new RegExp(`${productPath}$`));
  await expect(search).toBeHidden();
  await expect(page.getByRole('main').getByText('$128.00', { exact: true })).toBeVisible();
});

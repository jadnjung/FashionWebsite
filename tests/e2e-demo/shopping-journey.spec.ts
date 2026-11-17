import { test, expect, type Page } from '@playwright/test';

interface CapturedEvent {
  name: string;
  properties: Record<string, unknown>;
}

async function captureAnalytics(page: Page) {
  await page.addInitScript(() => {
    const captured: CapturedEvent[] = [];
    (window as unknown as { captured: CapturedEvent[] }).captured = captured;
    window.addEventListener('esque:analytics', (event) =>
      captured.push((event as CustomEvent<CapturedEvent>).detail),
    );
  });
}

async function eventsNamed(page: Page, name: string) {
  return page.evaluate(
    (eventName) =>
      (window as unknown as { captured: CapturedEvent[] }).captured.filter(
        (event) => event.name === eventName,
      ),
    name,
  );
}

const handle = 'preview-featherweight-crewneck';
const title = 'Featherweight Crewneck Sweater';

test('complete local shopping journey preserves choices and supports recovery', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await captureAnalytics(page);
  await page.goto('/new');
  await expect(page.getByRole('heading', { level: 1, name: 'NEW', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  await page
    .getByRole('link', { name: /Featherweight Crewneck Sweater/ })
    .first()
    .click();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
  await expect
    .poll(() => eventsNamed(page, 'view_item'))
    .toEqual([
      {
        name: 'view_item',
        properties: {
          currency: 'USD',
          value: 128,
          items: [{ item_id: handle, item_name: title, item_category: 'Sweaters' }],
          sold_out: false,
        },
      },
    ]);
  await page.locator('label').filter({ hasText: /^M$/ }).first().click();
  await page
    .locator('label')
    .filter({ hasText: /^Black$/ })
    .first()
    .click();
  await expect(page).toHaveURL(/variant=/);
  expect(await eventsNamed(page, 'variant_selected')).toEqual([
    {
      name: 'variant_selected',
      properties: { item_id: handle, option_name: 'Size', option_value: 'M', context: 'pdp' },
    },
    {
      name: 'variant_selected',
      properties: { item_id: handle, option_name: 'Color', option_value: 'Black', context: 'pdp' },
    },
  ]);
  await page.getByRole('button', { name: /^Size Guide$/i }).click();
  await expect(page.getByRole('dialog', { name: 'Size Guide' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  const wishlistEvent = {
    name: 'add_to_wishlist',
    properties: {
      currency: 'USD',
      value: 128,
      items: [{ item_id: handle, item_name: title, price: 128 }],
    },
  };
  expect(await eventsNamed(page, 'add_to_wishlist')).toEqual([wishlistEvent]);
  await page.getByRole('button', { name: 'REMOVE FROM WISHLIST', exact: true }).click();
  expect(await eventsNamed(page, 'add_to_wishlist')).toEqual([wishlistEvent]);
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  expect(await eventsNamed(page, 'add_to_wishlist')).toEqual([wishlistEvent, wishlistEvent]);
  const add = page.getByRole('button', { name: 'ADD TO BAG', exact: true }).first();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Added to demo bag.' }).first(),
  ).toBeVisible();
  expect(await eventsNamed(page, 'add_to_bag_click')).toEqual([
    {
      name: 'add_to_bag_click',
      properties: {
        currency: 'USD',
        value: 128,
        items: [
          {
            item_id: handle,
            item_name: title,
            item_category: 'Sweaters',
            item_variant: 'preview-1-variant-1',
            price: 128,
          },
        ],
      },
    },
  ]);
  expect(await eventsNamed(page, 'add_to_cart')).toEqual([]);
  await page.getByRole('link', { name: 'BAG (1)', exact: true }).click();
  const bagProduct = page.getByRole('main').getByRole('link', { name: title, exact: true });
  await expect(bagProduct).toBeVisible();
  await expect(bagProduct).toHaveAttribute(
    'href',
    `/products/${handle}?variant=preview-1-variant-1`,
  );
  await page.reload();
  await expect(bagProduct).toBeVisible();
  await bagProduct.click();
  await expect(page.getByRole('radio', { name: 'M', exact: true }).first()).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Black', exact: true }).first()).toBeChecked();
});

test('settled Search emits exact counts once and redacts an obvious email query', async ({
  page,
}) => {
  await captureAnalytics(page);
  await page.goto('/about');
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Search', exact: true });
  const input = search.getByRole('searchbox');
  await input.fill('crewneck');
  await expect(search.locator(`a[href="/products/${handle}"]`)).toBeVisible();
  await expect
    .poll(() => eventsNamed(page, 'search'))
    .toEqual([{ name: 'search', properties: { search_term: 'crewneck', result_count: 1 } }]);
  await input.fill('zzznothing');
  await expect(search.getByText('NO SUGGESTIONS.', { exact: true })).toBeVisible();
  await expect.poll(() => eventsNamed(page, 'search')).toHaveLength(2);
  await input.fill('synthetic@example.com');
  await expect
    .poll(() => eventsNamed(page, 'search'))
    .toEqual([
      { name: 'search', properties: { search_term: 'crewneck', result_count: 1 } },
      { name: 'search', properties: { search_term: 'zzznothing', result_count: 0 } },
      { name: 'search', properties: { search_term: '[redacted]', result_count: 0 } },
    ]);
  expect(JSON.stringify(await eventsNamed(page, 'search'))).not.toContain('synthetic@example.com');
});

test('Demo bag intent is recorded on a failed add and recovery preserves a single intent event', async ({
  page,
}) => {
  await captureAnalytics(page);
  await page.goto(`/products/${handle}`);
  await page.getByRole('main').getByRole('radio', { name: 'M', exact: true }).press('Space');
  await page.getByRole('main').getByRole('radio', { name: 'Black', exact: true }).press('Space');
  let attempts = 0;
  await page.route('**/api/cart', async (route) => {
    if (route.request().postDataJSON().operation.type !== 'add') return route.continue();
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 503, json: { error: 'cart_failed' } });
    return route.continue();
  });
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  const retry = page.getByRole('button', { name: 'TRY AGAIN', exact: true });
  await expect(retry).toBeEnabled();
  const intent = [
    {
      name: 'add_to_bag_click',
      properties: {
        currency: 'USD',
        value: 128,
        items: [
          {
            item_id: handle,
            item_name: title,
            item_category: 'Sweaters',
            item_variant: 'preview-1-variant-1',
            price: 128,
          },
        ],
      },
    },
  ];
  expect(await eventsNamed(page, 'add_to_bag_click')).toEqual(intent);
  await expect(page.getByRole('link', { name: 'BAG (0)', exact: true })).toBeVisible();
  await retry.click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  expect(attempts).toBe(2);
  expect(await eventsNamed(page, 'add_to_bag_click')).toEqual(intent);
  expect(await eventsNamed(page, 'add_to_cart')).toEqual([]);
});

test('Demo request has honest simulated failure and successful recovery', async ({ page }) => {
  await page.goto('/access');
  await page.getByLabel('EMAIL', { exact: true }).fill('synthetic@example.com');
  await page.getByText('I agree to receive Esque emails').click();
  await page.getByLabel('Preview outcome').selectOption('unavailable');
  await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
  await expect(page.locator('#request-access-error')).toContainText('preview request failed');
  await expect(page.getByLabel('EMAIL', { exact: true })).toHaveValue('synthetic@example.com');
  await expect(page.locator('input[name="consent"]')).toBeChecked();
  await page.getByLabel('Preview outcome').selectOption('success');
  await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
  const success = page.getByRole('status').filter({ hasText: 'PREVIEW COMPLETE.' });
  await expect(success).toBeVisible();
  await expect(success).toBeFocused();
});

test.describe('without enhancement scripts', () => {
  test.use({ javaScriptEnabled: false });
  test('product information and original gallery remain usable', async ({ page }) => {
    await page.goto('/products/preview-featherweight-crewneck');
    await expect(
      page.getByRole('heading', { name: 'Featherweight Crewneck Sweater', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    const gallery = page.locator('main [data-gallery-item]');
    await expect(gallery).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const image = gallery.nth(index).locator('img');
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      await expect(
        gallery
          .nth(index)
          .getByRole('link', { name: `Enlarge ${title}, image ${index + 1} of 3`, exact: true }),
      ).toHaveAttribute(
        'href',
        [
          '/preview-demo/product-3.jpg',
          '/preview-demo/product-3.jpg?view=detail',
          '/preview-demo/product-3.jpg?view=fit',
        ][index],
      );
    }
    const information = page.getByRole('region', { name: 'Product information' });
    await information
      .locator('summary')
      .filter({ hasText: /^Materials$/ })
      .click();
    await expect(
      information.getByText('Demo placeholder. Material composition awaits the final product.', {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole('link', { name: `Enlarge ${title}, image 1 of 3`, exact: true }).click();
    await expect(page).toHaveURL(/\/preview-demo\/product-3\.jpg$/);
    await expect
      .poll(() =>
        page
          .locator('img')
          .evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);
  });
});

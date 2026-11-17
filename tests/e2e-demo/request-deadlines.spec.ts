import { expect, test, type Locator, type Page } from '@playwright/test';

const handle = 'preview-featherweight-crewneck';
const title = 'Featherweight Crewneck Sweater';

async function openSearch(page: Page) {
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Search', exact: true });
  await expect(search.getByRole('searchbox')).toBeFocused();
  return search;
}

async function openQuickAdd(page: Page) {
  const card = page
    .locator('div.group')
    .filter({ has: page.locator(`a[href="/products/${handle}"]`) });
  const trigger = card.getByRole('button', { name: 'QUICK ADD', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const panel = page.getByRole('dialog', { name: `Quick Add — ${title}`, exact: true });
  await expect(panel).toBeVisible();
  return { panel, trigger };
}

async function choose(scope: Locator, value: string) {
  const radio = scope.getByRole('radio', { name: value, exact: true });
  await radio.press('Space');
  await expect(radio).toBeChecked();
}

// Keep the real API response, but emulate fetch/decoding that ignores cancellation.
// Older data deliberately disagrees with the current, healthy response.
async function holdFirstRequest(page: Page, path: string, stage: 'fetch' | 'body') {
  await page.evaluate(
    ({ path, stage }) => {
      const original = window.fetch.bind(window);
      const state = window as typeof window & {
        releaseRequest?: () => void;
        requestHeld?: boolean;
        requestReleased?: boolean;
      };
      let held = false;
      window.fetch = async (...args) => {
        if (new URL(String(args[0]), location.href).pathname !== path || held)
          return original(...args);
        held = true;
        const response = await original(args[0], { ...args[1], signal: undefined });
        const body = await response.json();
        if ('product' in body && body.product) {
          body.product.variants = body.product.variants.map((variant: object) => ({
            ...variant,
            availableForSale: false,
          }));
        } else {
          body.products = [];
          body.collections = [];
        }
        const gate = new Promise<void>((resolve) => {
          state.releaseRequest = resolve;
        });
        const delayed = new Response(JSON.stringify(body), { status: response.status });
        const decode = delayed.json.bind(delayed);
        delayed.json = async () => {
          if (stage === 'body') {
            state.requestHeld = true;
            await gate;
            state.requestReleased = true;
          }
          return decode();
        };
        if (stage === 'fetch') {
          state.requestHeld = true;
          await gate;
          state.requestReleased = true;
        }
        return delayed;
      };
    },
    { path, stage },
  );
}

async function waitUntilHeld(page: Page) {
  await page.waitForFunction(
    () => (window as typeof window & { requestHeld?: boolean }).requestHeld === true,
  );
}

async function releaseRequest(page: Page) {
  await page.evaluate(() =>
    (window as typeof window & { releaseRequest?: () => void }).releaseRequest?.(),
  );
  await page.waitForFunction(
    () => (window as typeof window & { requestReleased?: boolean }).requestReleased === true,
  );
}

for (const stage of ['fetch', 'body'] as const) {
  test(`Search ${stage} deadline recovers with Retry and rejects late empty results`, async ({
    page,
  }) => {
    await page.goto('/about');
    await holdFirstRequest(page, '/api/search', stage);
    const search = await openSearch(page);
    await search.getByRole('searchbox').fill('crewneck');
    await waitUntilHeld(page);
    await expect(search.getByRole('status')).toHaveText('Search could not load. Try again.', {
      timeout: 15_000,
    });
    await expect(search.getByRole('searchbox')).toHaveValue('crewneck');
    await search.getByRole('button', { name: 'Retry', exact: true }).click();
    const product = search.locator(`a[href="/products/${handle}"]`).filter({ hasText: title });
    await expect(product).toBeVisible();
    await releaseRequest(page);
    await expect(product).toBeVisible();
    await expect(search.getByText('NO SUGGESTIONS.', { exact: true })).toHaveCount(0);
  });

  test(`Quick Add ${stage} deadline recovers with Retry and keeps fresh selections`, async ({
    page,
  }) => {
    await page.goto('/tops/sweaters');
    await holdFirstRequest(page, `/api/products/${handle}`, stage);
    const { panel } = await openQuickAdd(page);
    await waitUntilHeld(page);
    await expect(panel.getByText('SOMETHING WENT WRONG.', { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await panel.getByRole('button', { name: 'Retry', exact: true }).click();
    await choose(panel, 'M');
    await choose(panel, 'Black');
    const add = panel.getByRole('button', { name: 'ADD TO BAG', exact: true });
    await expect(add).toBeEnabled();
    await releaseRequest(page);
    await expect(panel.getByRole('radio', { name: 'M', exact: true })).toBeChecked();
    await expect(add).toBeEnabled();
    await expect(panel.getByText('NO LONGER AVAILABLE.', { exact: true })).toHaveCount(0);
  });
}

test('Quick Add closing and reopening preserves the new session after an old decoder resolves', async ({
  page,
}) => {
  await page.goto('/tops/sweaters');
  await holdFirstRequest(page, `/api/products/${handle}`, 'body');
  let { panel, trigger } = await openQuickAdd(page);
  await waitUntilHeld(page);
  await panel.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(trigger).toBeFocused();
  ({ panel, trigger } = await openQuickAdd(page));
  await choose(panel, 'M');
  await choose(panel, 'Black');
  await releaseRequest(page);
  await expect(panel.getByRole('radio', { name: 'M', exact: true })).toBeChecked();
  await expect(panel.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
  await panel.press('Escape');
  await expect(trigger).toBeFocused();
  ({ panel } = await openQuickAdd(page));
  await expect(panel.getByRole('radio', { name: 'M', exact: true })).not.toBeChecked();
  await expect(panel.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeDisabled();
});

test('a superseding Search query cancels its deadline without a spurious error', async ({
  page,
}) => {
  await page.goto('/about');
  await holdFirstRequest(page, '/api/search', 'body');
  const search = await openSearch(page);
  await search.getByRole('searchbox').fill('crewneck');
  await waitUntilHeld(page);
  await search.getByRole('searchbox').fill('linen');
  const product = search
    .locator('a[href="/products/preview-relaxed-linen-trouser"]')
    .filter({ hasText: 'Relaxed Linen Trouser' });
  await expect(product).toBeVisible();
  await releaseRequest(page);
  await expect(product).toBeVisible();
  await expect(search.getByText('COULD NOT LOAD RESULTS.', { exact: true })).toHaveCount(0);
});

test('transport interruption exposes recovery in Search and Quick Add', async ({ page }) => {
  await page.goto('/tops/sweaters');
  await page.route('**/api/search?*', (route) => route.abort('failed'));
  const search = await openSearch(page);
  await search.getByRole('searchbox').fill('crewneck');
  await expect(search.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.unroute('**/api/search?*');
  await search.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    search.locator(`a[href="/products/${handle}"]`).filter({ hasText: title }),
  ).toBeVisible();
  await search.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await page.route(`**/api/products/${handle}`, (route) => route.abort('failed'));
  const { panel } = await openQuickAdd(page);
  await expect(panel.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.unroute(`**/api/products/${handle}`);
  await panel.getByRole('button', { name: 'Retry', exact: true }).click();
  await choose(panel, 'M');
});

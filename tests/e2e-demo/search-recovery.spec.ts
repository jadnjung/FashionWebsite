import { expect, test, type Page } from '@playwright/test';

async function openSearch(page: Page) {
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Search', exact: true });
  await expect(search.getByRole('searchbox')).toBeFocused();
  return search;
}

const productPath = '/products/preview-featherweight-crewneck';

async function holdSearchBody(page: Page, query: string) {
  await page.evaluate((heldQuery) => {
    const original = window.fetch.bind(window);
    const state = window as typeof window & {
      releaseSearch?: () => void;
      searchStarted?: boolean;
      searchDecoded?: boolean;
    };
    const gate = new Promise<void>((resolve) => {
      state.releaseSearch = resolve;
    });
    window.fetch = async (...args) => {
      const url = new URL(String(args[0]), location.href);
      if (url.pathname !== '/api/search' || url.searchParams.get('q') !== heldQuery)
        return original(...args);
      state.searchStarted = true;
      // The transport and body deliberately ignore the caller's AbortSignal.
      // This exercises ownership after decoding even when cancellation cannot stop I/O.
      const response = await original(args[0], { ...args[1], signal: undefined });
      const decode = response.json.bind(response);
      response.json = async () => {
        await gate;
        const body = await decode();
        state.searchDecoded = true;
        return body;
      };
      return response;
    };
  }, query);
}

async function releaseSearchBody(page: Page) {
  await page.evaluate(() =>
    (window as typeof window & { releaseSearch?: () => void }).releaseSearch?.(),
  );
  await page.waitForFunction(
    () => (window as typeof window & { searchDecoded?: boolean }).searchDecoded === true,
  );
}

test('same-product Search navigation closes with pointer and keyboard while Quick Add stays independent', async ({
  page,
}) => {
  await page.goto(productPath);
  for (const keyboard of [false, true]) {
    const search = await openSearch(page);
    await search.getByRole('searchbox').fill('crewneck');
    const link = search.getByRole('link', { name: 'Featherweight Crewneck Sweater' });
    await expect(link).toBeVisible();
    if (keyboard) {
      await link.focus();
      await link.press('Enter');
    } else await link.click();
    await expect(search).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`${productPath}$`));
    await expect(page.getByRole('button', { name: 'SEARCH', exact: true })).toBeFocused();
  }
});

test('Search recovers from a failed request to populated products and collections', async ({
  page,
}) => {
  let calls = 0;
  await page.route('**/api/search?*', async (route) => {
    if (++calls === 1) await route.fulfill({ status: 503, json: { error: 'unavailable' } });
    else await route.continue();
  });
  await page.goto('/about');
  const search = await openSearch(page);
  await search.getByRole('searchbox').fill('collection');
  await expect(search.getByText('COULD NOT LOAD RESULTS.')).toBeVisible();
  await search.getByRole('button', { name: 'Retry', exact: true }).click();
  const collection = search.getByRole('link', { name: 'Collection 001', exact: true });
  await expect(collection).toHaveAttribute('href', '/collections/collection-001');
  await expect(search.getByRole('searchbox')).toHaveValue('collection');
  await search.getByRole('searchbox').fill('crewneck');
  await expect(search.getByRole('link', { name: 'Featherweight Crewneck Sweater' })).toBeVisible();
  await expect(search.getByRole('status')).toContainText('result');
});

test('query ownership hides old products immediately and ignores delayed responses after close/reopen', async ({
  page,
}) => {
  await page.goto('/about');
  await holdSearchBody(page, 'jacket');
  let search = await openSearch(page);
  const input = search.getByRole('searchbox');
  await input.fill('crewneck');
  await expect(search.getByRole('link', { name: 'Featherweight Crewneck Sweater' })).toBeVisible();
  await input.fill('jacket');
  await expect(search.getByRole('link', { name: 'Featherweight Crewneck Sweater' })).toHaveCount(0);
  await page.waitForFunction(
    () => (window as typeof window & { searchStarted?: boolean }).searchStarted === true,
  );
  await input.fill('linen');
  await expect(search.getByRole('link', { name: 'Relaxed Linen Trouser' })).toBeVisible();
  await releaseSearchBody(page);
  await expect(search.getByRole('link', { name: 'Relaxed Linen Trouser' })).toBeVisible();
  await expect(search.getByRole('link', { name: 'Velvet Evening Jacket' })).toHaveCount(0);
  await search.getByRole('button', { name: 'CLOSE', exact: true }).click();
  search = await openSearch(page);
  await expect(search.getByRole('searchbox')).toHaveValue('');
  await expect(search.getByRole('link', { name: 'Relaxed Linen Trouser' })).toHaveCount(0);
});

test('overlong and composed queries retain their text and communicate the shared limit', async ({
  page,
}) => {
  const queries: string[] = [];
  await page.route('**/api/search?*', async (route) => {
    queries.push(new URL(route.request().url()).searchParams.get('q') ?? '');
    await route.fulfill({ json: { products: [], collections: [] } });
  });
  await page.goto('/about');
  const search = await openSearch(page);
  const input = search.getByRole('searchbox');
  for (const length of [99, 100]) {
    const value = 'a'.repeat(length);
    await input.fill(value);
    await expect.poll(() => queries.includes(value)).toBe(true);
    await expect(input).toHaveValue(value);
  }
  await input.fill('a'.repeat(101));
  await expect(input).toHaveValue('a'.repeat(101));
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(search.getByText('Use 100 characters or fewer.')).toBeVisible();
  expect(queries.every((query) => query.length <= 100)).toBe(true);
  await input.dispatchEvent('compositionstart');
  await input.fill('針織');
  await input.dispatchEvent('compositionend');
  await expect.poll(() => queries.includes('針織')).toBe(true);
  await expect(input).toHaveValue('針織');
});

test('modified product activation preserves Search in the original tab', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop modifier-key interaction');
  await page.goto(productPath);
  const search = await openSearch(page);
  await search.getByRole('searchbox').fill('crewneck');
  const link = search.getByRole('link', { name: 'Featherweight Crewneck Sweater' });
  const popupPromise = page.context().waitForEvent('page');
  await link.click({ modifiers: ['ControlOrMeta'] });
  const popup = await popupPromise;
  await expect(search).toBeVisible();
  await expect(search.getByRole('searchbox')).toHaveValue('crewneck');
  await popup.close();
});

test('closing and reopening a pending Search keeps the new session empty', async ({ page }) => {
  await page.goto('/about');
  await holdSearchBody(page, 'crewneck');
  const search = await openSearch(page);
  await search.getByRole('searchbox').fill('crewneck');
  await page.waitForFunction(
    () => (window as typeof window & { searchStarted?: boolean }).searchStarted === true,
  );
  await search.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(search).toBeHidden();
  await expect(page.getByRole('button', { name: 'SEARCH', exact: true })).toBeFocused();
  await openSearch(page);
  await releaseSearchBody(page);
  await expect(search.getByRole('searchbox')).toHaveValue('');
  await expect(search.getByText('NO SUGGESTIONS.')).toHaveCount(0);
  await expect(search.getByRole('heading', { name: 'Products', exact: true })).toHaveCount(0);
  await expect(search.getByRole('link', { name: 'Featherweight Crewneck Sweater' })).toHaveCount(0);
});

test('long result names stay within narrow and wide Search viewports', async ({ page }) => {
  await page.goto('/about');
  const search = await openSearch(page);
  await search.getByRole('searchbox').fill('PlaceholderName');
  await expect(search.locator('a[href="/products/preview-long-labels"]')).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await search.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

import { expect, test, type Page, type Route } from '@playwright/test';

async function seedWishlist(page: Page, handles: string[]) {
  await page.addInitScript((savedHandles) => {
    if (localStorage.getItem('esque:wishlist')) return;
    localStorage.setItem(
      'esque:wishlist',
      JSON.stringify({
        v: 1,
        items: savedHandles.map((handle) => ({
          handle,
          title: `Saved ${handle}`,
          imageUrl: null,
          imageAlt: null,
          minPrice: { amount: '1.00', currencyCode: 'USD' },
        })),
      }),
    );
  }, handles);
}

test('a large saved list refreshes every entry with at most four requests in flight', async ({
  page,
}) => {
  const handles = Array.from({ length: 30 }, (_, index) => `saved-${index}`);
  await seedWishlist(page, handles);
  const pending = new Map<string, Route>();
  const requested: string[] = [];
  let peak = 0;
  await page.route('**/api/products/*', (route) => {
    const handle = new URL(route.request().url()).pathname.split('/').pop()!;
    requested.push(handle);
    pending.set(handle, route);
    peak = Math.max(peak, pending.size);
  });
  await page.goto('/wishlist');
  await expect(page.getByRole('list', { name: 'Saved pieces' }).getByRole('listitem')).toHaveCount(
    30,
  );
  await expect.poll(() => requested.length).toBe(4);
  for (let completed = 0; completed < handles.length; completed += 4) {
    const batch = [...pending.entries()];
    pending.clear();
    await Promise.all(batch.map(([, route]) => route.fulfill({ json: { product: null } })));
    await expect.poll(() => requested.length).toBe(Math.min(completed + 8, handles.length));
  }
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(30);
  expect(peak).toBe(4);
  expect(new Set(requested)).toEqual(new Set(handles));
  expect(requested).toHaveLength(30);
});

test('removing a saved piece retains healthy survivor results and keyboard focus', async ({
  page,
}) => {
  await seedWishlist(page, ['saved-first', 'saved-second', 'saved-third']);
  const requested: string[] = [];
  await page.route('**/api/products/*', (route) => {
    requested.push(new URL(route.request().url()).pathname.split('/').pop()!);
    return route.fulfill({ json: { product: null } });
  });
  await page.goto('/wishlist');
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(3);
  const remove = page.getByRole('button', { name: 'Remove Saved saved-first from wishlist' });
  await remove.focus();
  await remove.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Remove Saved saved-second from wishlist' }),
  ).toBeFocused();
  await expect(page.getByRole('list', { name: 'Saved pieces' }).getByRole('listitem')).toHaveCount(
    2,
  );
  expect([...requested].sort()).toEqual(['saved-first', 'saved-second', 'saved-third']);
  await expect(
    page.getByText('Refreshing this piece’s availability…', { exact: true }),
  ).toHaveCount(0);
  await page.goto('/about');
  await page.goto('/wishlist');
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(2);
  expect([...requested].sort()).toEqual([
    'saved-first',
    'saved-second',
    'saved-second',
    'saved-third',
    'saved-third',
  ]);
});

test('Retry refreshes only failures and a cross-tab addition fetches only the new handle', async ({
  page,
  context,
}) => {
  await seedWishlist(page, ['saved-healthy', 'saved-failed']);
  const requested: string[] = [];
  let fail = true;
  let heldRetry: Route | undefined;
  await page.route('**/api/products/*', (route) => {
    const handle = new URL(route.request().url()).pathname.split('/').pop()!;
    requested.push(handle);
    if (handle === 'saved-failed') {
      if (fail) return route.fulfill({ status: 503, json: { error: 'unavailable' } });
      heldRetry = route;
      return;
    }
    return route.fulfill({ json: { product: null } });
  });
  await page.goto('/wishlist');
  const retry = page.getByRole('button', { name: 'Retry availability' });
  await expect(retry).toBeEnabled();
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(1);
  fail = false;
  await retry.focus();
  await retry.press('Enter');
  await expect.poll(() => Boolean(heldRetry)).toBe(true);
  const deliberateFocus = page.getByRole('button', {
    name: 'Remove Saved saved-failed from wishlist',
  });
  await deliberateFocus.focus();
  await heldRetry!.fulfill({ json: { product: null } });
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(2);
  await expect(deliberateFocus).toBeFocused();
  expect([...requested].sort()).toEqual(['saved-failed', 'saved-failed', 'saved-healthy']);
  const other = await context.newPage();
  await other.goto('/products/preview-fluid-knit-long-sleeve');
  await other.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(3);
  expect([...requested].sort()).toEqual([
    'preview-fluid-knit-long-sleeve',
    'saved-failed',
    'saved-failed',
    'saved-healthy',
  ]);
});

test('removing queued and active pieces cancels only their work, and leaving cancels survivors', async ({
  page,
}) => {
  await seedWishlist(
    page,
    Array.from({ length: 5 }, (_, index) => `saved-${index}`),
  );
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    const state = window as typeof window & { savedAborts: string[] };
    state.savedAborts = [];
    window.fetch = (input, init) => {
      const path = new URL(String(input), location.href).pathname;
      if (path.startsWith('/api/products/')) {
        init?.signal?.addEventListener('abort', () => state.savedAborts.push(path));
      }
      return original(input, init);
    };
  });
  const requested: string[] = [];
  await page.route('**/api/products/*', (route) => {
    requested.push(new URL(route.request().url()).pathname.split('/').pop()!);
  });
  await page.goto('/wishlist');
  await expect.poll(() => requested.length).toBe(4);
  await page.getByRole('button', { name: 'Remove Saved saved-4 from wishlist' }).click();
  await page.getByRole('button', { name: 'Remove Saved saved-0 from wishlist' }).click();
  const aborts = () =>
    page.evaluate(() => (window as typeof window & { savedAborts: string[] }).savedAborts);
  await expect.poll(aborts).toEqual(['/api/products/saved-0']);
  expect(requested).toHaveLength(4);
  await page.locator('a[href="/about"]').first().click();
  await expect(page).toHaveURL('/about');
  await expect
    .poll(async () => (await aborts()).sort())
    .toEqual([
      '/api/products/saved-0',
      '/api/products/saved-1',
      '/api/products/saved-2',
      '/api/products/saved-3',
    ]);
  expect(requested).not.toContain('saved-4');
});

test('ten-second deadlines release the queue while each saved result remains independent', async ({
  page,
}) => {
  await seedWishlist(
    page,
    Array.from({ length: 5 }, (_, index) => `saved-${index}`),
  );
  const requested: string[] = [];
  await page.route('**/api/products/*', (route) => {
    const handle = new URL(route.request().url()).pathname.split('/').pop()!;
    requested.push(handle);
    if (handle === 'saved-4') return route.fulfill({ json: { product: null } });
  });
  await page.goto('/wishlist');
  await expect.poll(() => requested.length).toBe(4);
  await expect(page.getByText('Availability could not be refreshed.', { exact: true })).toBeVisible(
    { timeout: 15_000 },
  );
  await expect(
    page.getByText('Saved details shown. Availability refresh failed.', { exact: true }),
  ).toHaveCount(4);
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(1);
  await expect(
    page.getByText('Refreshing this piece’s availability…', { exact: true }),
  ).toHaveCount(0);
  expect(requested).toHaveLength(5);
});

test('a removed and readded handle rejects the previous request’s late decoder', async ({
  page,
  context,
}) => {
  const handle = 'preview-featherweight-crewneck';
  await seedWishlist(page, [handle]);
  await page.addInitScript((savedHandle) => {
    const original = window.fetch.bind(window);
    const state = window as typeof window & {
      savedDecoderHeld?: boolean;
      savedDecoderReleased?: boolean;
      releaseSavedDecoder?: () => void;
    };
    let first = true;
    window.fetch = async (input, init) => {
      if (
        new URL(String(input), location.href).pathname !== `/api/products/${savedHandle}` ||
        !first
      )
        return original(input, init);
      first = false;
      const response = await original(input, { ...init, signal: undefined });
      const delayed = new Response(await response.text(), { status: response.status });
      const gate = new Promise<void>((resolve) => {
        state.releaseSavedDecoder = resolve;
      });
      delayed.json = async () => {
        state.savedDecoderHeld = true;
        await gate;
        state.savedDecoderReleased = true;
        return { product: null };
      };
      return delayed;
    };
  }, handle);
  await page.goto('/wishlist');
  await page.waitForFunction(
    () => (window as typeof window & { savedDecoderHeld?: boolean }).savedDecoderHeld,
  );
  await page.getByRole('button', { name: `Remove Saved ${handle} from wishlist` }).click();
  await expect(page.getByText('NOTHING SAVED YET.', { exact: true })).toBeVisible();
  const other = await context.newPage();
  await other.goto(`/products/${handle}`);
  await other.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  const live = page.getByRole('link', { name: /Featherweight Crewneck Sweater/ });
  await expect(live).toBeVisible();
  await page.evaluate(() =>
    (window as typeof window & { releaseSavedDecoder?: () => void }).releaseSavedDecoder?.(),
  );
  await page.waitForFunction(
    () => (window as typeof window & { savedDecoderReleased?: boolean }).savedDecoderReleased,
  );
  await expect(live).toBeVisible();
  await expect(page.getByText('No longer available.', { exact: true })).toHaveCount(0);
});

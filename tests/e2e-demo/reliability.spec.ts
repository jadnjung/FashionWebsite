import { expect, test, type Page } from '@playwright/test';

const handle = 'preview-featherweight-crewneck';
const title = 'Featherweight Crewneck Sweater';

async function selectCrewneck(page: Page) {
  await page.goto(`/products/${handle}`);
  for (const name of ['M', 'Black']) {
    await page.getByRole('main').getByRole('radio', { name, exact: true }).press('Space');
  }
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
}

async function seedWishlist(page: Page, handles: string[]) {
  await page.goto('/wishlist');
  await page.evaluate((savedHandles) => {
    localStorage.setItem(
      'esque:wishlist',
      JSON.stringify({
        v: 1,
        items: savedHandles.map((savedHandle) => ({
          handle: savedHandle,
          title: `Cached ${savedHandle}`,
          imageUrl: null,
          imageAlt: null,
          minPrice: { amount: '1.00', currencyCode: 'USD' },
        })),
      }),
    );
  }, handles);
}

test('throwing localStorage getter preserves the complete product and session-only shopping', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    }),
  );
  await selectCrewneck(page);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: new RegExp(`Enlarge ${title}, image 1`) }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'REMOVE FROM WISHLIST', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
});

test('healthy saved products refresh independently while a held item times out and retries', async ({
  page,
}) => {
  const held = 'preview-relaxed-linen-trouser';
  await seedWishlist(page, [handle, held]);
  await page.route(`**/api/products/${held}`, () => new Promise(() => {}));
  await page.goto('/wishlist');
  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
  await expect(page.getByText(`Cached ${held}`, { exact: true })).toBeVisible();
  await expect(page.getByText('Availability could not be refreshed.', { exact: true })).toBeVisible(
    { timeout: 15_000 },
  );
  await page.unroute(`**/api/products/${held}`);
  await page.getByRole('button', { name: 'Retry availability' }).click();
  await expect(page.getByRole('link', { name: /Relaxed Linen Trouser/ })).toBeVisible();
  await expect(page.getByText('Availability could not be refreshed.', { exact: true })).toHaveCount(
    0,
  );
});

test('confirmed missing saved piece has removal and discovery without an active product purchase path', async ({
  page,
}) => {
  await seedWishlist(page, [handle]);
  await page.route(`**/api/products/${handle}`, (route) =>
    route.fulfill({ json: { product: null } }),
  );
  await page.goto('/wishlist');
  const saved = page.getByRole('list', { name: 'Saved pieces' });
  await expect(saved.getByText('No longer available.')).toBeVisible();
  await expect(saved.getByRole('button', { name: 'QUICK ADD', exact: true })).toHaveCount(0);
  await expect(saved.locator(`a[href="/products/${handle}"]`)).toHaveCount(0);
  await expect(
    saved.getByRole('button', { name: `Remove Cached ${handle} from wishlist` }),
  ).toBeEnabled();
  await expect(saved.getByRole('link', { name: 'Explore available pieces' })).toHaveAttribute(
    'href',
    '/new',
  );
});

for (const stage of ['fetch', 'body'] as const) {
  test(`bag ${stage} deadline releases pending and rejects late commits after retry`, async ({
    page,
  }) => {
    await selectCrewneck(page);
    await page.evaluate((heldStage) => {
      const original = window.fetch.bind(window);
      let held = false;
      const state = window as typeof window & { releaseBag?: () => void; bagDecoded?: boolean };
      window.fetch = async (...args) => {
        const init = args[1];
        if (
          String(args[0]) !== '/api/cart' ||
          JSON.parse(String(init?.body)).operation.type !== 'add' ||
          held
        )
          return original(...args);
        held = true;
        const serverResponse = await original(...args);
        // Deliberately emulate a transport that ignores later AbortSignal changes.
        const response = new Response(await serverResponse.text(), {
          status: serverResponse.status,
          headers: serverResponse.headers,
        });
        const gate = new Promise<void>((resolve) => {
          state.releaseBag = resolve;
        });
        const decode = response.json.bind(response);
        response.json = async () => {
          if (heldStage === 'body') await gate;
          const body = await decode();
          state.bagDecoded = true;
          return body;
        };
        if (heldStage === 'fetch') {
          await gate;
          return response;
        }
        return response;
      };
    }, stage);
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'The demo bag took too long to update.' }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'TRY AGAIN', exact: true }).click();
    await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
    await page.evaluate(() => {
      (window as typeof window & { releaseBag?: () => void }).releaseBag?.();
    });
    await page.waitForFunction(
      () => (window as typeof window & { bagDecoded?: boolean }).bagDecoded === true,
    );
    await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('esque:demo-cart')!).lines[0].quantity,
      ),
    ).toBe(2);
  });
}

test('a queued Web Lock request times out without acquiring the lock later', async ({
  page,
  context,
}) => {
  await selectCrewneck(page);
  test.skip(
    !(await page.evaluate(() => Boolean(navigator.locks))),
    'Web Locks unavailable in this browser',
  );
  const other = await context.newPage();
  await other.goto('/wishlist');
  await other.evaluate(
    () =>
      new Promise<void>((acquired) => {
        const state = window as typeof window & { releaseLock?: () => void };
        void navigator.locks.request('esque:demo-cart', async () => {
          const gate = new Promise<void>((resolve) => {
            state.releaseLock = resolve;
          });
          acquired();
          await gate;
        });
      }),
  );
  let adds = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/cart') && request.postDataJSON()?.operation?.type === 'add')
      adds += 1;
  });
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'The demo bag took too long to update.' }),
  ).toBeVisible({ timeout: 15_000 });
  expect(adds).toBe(0);
  await other.evaluate(() =>
    (window as typeof window & { releaseLock?: () => void }).releaseLock?.(),
  );
  await page.getByRole('button', { name: 'TRY AGAIN', exact: true }).click();
  await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
  expect(adds).toBe(1);
  await other.close();
});

test('without Web Locks a delayed add rejects an intervening write and retry reconciles current intent', async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(navigator, 'locks', { value: undefined }),
  );
  await selectCrewneck(page);
  const other = await context.newPage();
  await selectCrewneck(other);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false;
  await page.route('**/api/cart', async (route) => {
    if (route.request().postDataJSON().operation.type !== 'add' || held) return route.continue();
    held = true;
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  try {
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expect.poll(() => held).toBe(true);
    await other.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expect(other.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
    release();
    await expect(
      page.getByRole('status').filter({ hasText: 'The demo bag changed in another tab.' }),
    ).toBeVisible();
    const retry = page.getByRole('button', { name: 'TRY AGAIN', exact: true });
    await expect(retry).toBeEnabled();
    await retry.click();
    await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
    await expect(other.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
  } finally {
    release();
    await other.close();
  }
});

for (const failure of ['disconnect', 'malformed-json'] as const) {
  test(`bag preserves acknowledged lines after ${failure} and retry uses current saved selections`, async ({
    page,
  }) => {
    await selectCrewneck(page);
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
    let attempts = 0;
    await page.route('**/api/cart', async (route) => {
      attempts += 1;
      if (attempts > 1) return route.continue();
      if (failure === 'disconnect') await route.abort('internetdisconnected');
      else await route.fulfill({ status: 200, contentType: 'application/json', body: '{broken' });
    });
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
    await expect(page.getByRole('button', { name: 'TRY AGAIN', exact: true })).toBeEnabled();
    await expect(
      page.getByRole('status').filter({ hasText: 'The demo bag could not be updated.' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'BAG (1)', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'TRY AGAIN', exact: true }).click();
    await expect(page.getByRole('link', { name: 'BAG (2)', exact: true })).toBeVisible();
    expect(attempts).toBe(2);
  });
}

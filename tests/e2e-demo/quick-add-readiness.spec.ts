import { expect, test, type Page } from '@playwright/test';

const handle = 'preview-featherweight-crewneck';
const title = 'Featherweight Crewneck Sweater';
const description = 'Quick Add is loading. View this piece to choose options.';
const releaseCodeGates = new WeakMap<Page, () => void>();

test.afterEach(async ({ page }) => {
  releaseCodeGates.get(page)?.();
  await page.unrouteAll({ behavior: 'wait' });
});

function crewneck(page: Page) {
  const card = page
    .locator('div.group')
    .filter({ has: page.locator(`a[href="/products/${handle}"]`) });
  return {
    card,
    trigger: card.getByRole('button', { name: 'QUICK ADD', exact: true }),
    panel: page.getByRole('dialog', { name: `Quick Add — ${title}`, exact: true }),
  };
}

async function observeIntents(page: Page) {
  await page.addInitScript(() => {
    const state = window as typeof window & { readinessIntents?: string[] };
    state.readinessIntents = [];
    window.addEventListener('esque:analytics', (event) => {
      const detail = (event as CustomEvent<{ name: string; properties: { item_id: string } }>)
        .detail;
      if (detail.name === 'quick_add_open') state.readinessIntents?.push(detail.properties.item_id);
    });
  });
}

function observeErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: { text: string; url: string }[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error')
      consoleErrors.push({ text: message.text(), url: message.location().url });
  });
  return {
    assertClean(expectedTransportFailures = new Set<string>()) {
      expect(pageErrors).toEqual([]);
      expect(
        consoleErrors.filter(
          (error) =>
            !expectedTransportFailures.has(error.url) ||
            !error.text.startsWith('Failed to load resource:'),
        ),
      ).toEqual([]);
    },
  };
}

async function controlBodyCode(page: Page, initial: 'hold' | 'reject' = 'hold') {
  let mode: 'hold' | 'reject' | 'pass' = initial;
  let rejections = 0;
  let release!: () => void;
  let didHold!: () => void;
  const held = new Promise<void>((resolve) => {
    didHold = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const urls = new Set<string>();
  await page.route(/\/_next\/static\/chunks\/.*\.js(?:\?.*)?$/, async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes('quickadd-') && body.includes('quick_add_click')) {
      urls.add(route.request().url());
      didHold();
      if (mode === 'hold') await gate;
      if (mode === 'reject') {
        await route.abort('failed');
        rejections += 1;
        return;
      }
    }
    await route.fulfill({ response, body });
  });
  const unblock = () => {
    mode = 'pass';
    release();
  };
  releaseCodeGates.set(page, unblock);
  return {
    held,
    urls,
    get rejections() {
      return rejections;
    },
    release: unblock,
  };
}

async function activateCrewneck(page: Page) {
  const controls = crewneck(page);
  await expect(controls.trigger).toBeEnabled();
  await controls.trigger.focus();
  await controls.trigger.press('Enter');
  return controls;
}

async function intents(page: Page) {
  return page.evaluate(
    () => (window as typeof window & { readinessIntents?: string[] }).readinessIntents ?? [],
  );
}

for (const activation of ['keyboard', 'pointer'] as const) {
  test(`Quick Add is unavailable before hydration and opens once by ${activation} when ready`, async ({
    page,
    isMobile,
  }) => {
    const errors = observeErrors(page);
    await observeIntents(page);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/_next\/static\/chunks\/.*\.js(?:\?.*)?$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/tops/sweaters', { waitUntil: 'commit' });
    const { card, trigger, panel } = crewneck(page);
    try {
      await expect(trigger).toBeDisabled();
      await expect(trigger).toHaveAccessibleDescription(description);
      await expect(card.locator(`a[href="/products/${handle}"]`)).toBeVisible();
      expect(await intents(page)).toEqual([]);
    } finally {
      release();
    }
    await expect(trigger).toBeEnabled();
    if (activation === 'keyboard') {
      await trigger.focus();
      await trigger.press('Enter');
    } else if (isMobile) {
      await trigger.tap();
    } else {
      await card.hover();
      await trigger.click();
    }
    await expect(panel).toBeVisible();
    expect(await intents(page)).toEqual([handle]);
    await panel.getByRole('button', { name: 'CLOSE', exact: true }).click();
    await expect(trigger).toBeFocused();
    errors.assertClean();
  });
}

test.describe('without scripting', () => {
  test.use({ javaScriptEnabled: false });
  test('native product browsing remains usable with scripts disabled', async ({ page }) => {
    await page.goto('/tops/sweaters');
    const { card, trigger } = crewneck(page);
    await expect(trigger).toBeDisabled();
    await expect(trigger).toHaveAccessibleDescription(description);
    await card.locator(`a[href="/products/${handle}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/products/${handle}$`));
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  });
});

test('Quick Add frame stays usable while code loads and blocks another card', async ({
  page,
  isMobile,
}) => {
  const errors = observeErrors(page);
  await observeIntents(page);
  await page.goto('/new');
  const cards = page
    .locator('div.group')
    .filter({ has: page.getByRole('button', { name: 'QUICK ADD', exact: true }) });
  const first = cards.nth(0).getByRole('button', { name: 'QUICK ADD', exact: true });
  const second = cards.nth(1).getByRole('button', { name: 'QUICK ADD', exact: true });
  await expect(first).toBeEnabled();
  await expect(second).toBeEnabled();
  const code = await controlBodyCode(page);
  await first.focus();
  await first.press('Enter');
  const panel = page.getByRole('dialog', { name: /^Quick Add —/ });
  await expect(panel).toBeVisible();
  await code.held;
  await expect(panel.getByRole('button', { name: 'CLOSE', exact: true })).toBeEnabled();
  await expect(panel.getByRole('status')).toHaveText('Loading Quick Add…');
  await expect(panel.locator('[aria-busy="true"]')).toHaveCount(1);
  const blocked = await (
    isMobile ? second.tap({ timeout: 1000 }) : second.click({ timeout: 1000 })
  ).then(
    () => 'unexpected activation',
    (error: Error) => error.message,
  );
  expect(blocked).toMatch(/intercepts pointer events|element is not enabled/);
  expect(await intents(page)).toHaveLength(1);
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  code.release();
  await expect(panel.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(first).toBeFocused();
  await second.focus();
  await second.press('Enter');
  await expect(panel).toBeVisible();
  expect(await intents(page)).toHaveLength(2);
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  errors.assertClean();
});

test('Quick Add code rejection recovers locally with one Retry intent', async ({ page }) => {
  const errors = observeErrors(page);
  await observeIntents(page);
  let productRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === `/api/products/${handle}`) productRequests += 1;
  });
  await page.goto('/tops/sweaters');
  const code = await controlBodyCode(page, 'reject');
  const { panel } = await activateCrewneck(page);
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('status')).toHaveText('Quick Add could not load.');
  await expect(panel.getByRole('button', { name: 'CLOSE', exact: true })).toBeEnabled();
  await expect(panel.getByRole('link', { name: 'VIEW PRODUCT', exact: true })).toHaveAttribute(
    'href',
    `/products/${handle}`,
  );
  expect(productRequests).toBe(0);
  code.release();
  await panel.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(panel.getByRole('radio', { name: 'M', exact: true })).toBeVisible();
  expect(await intents(page)).toEqual([handle]);
  expect(productRequests).toBe(1);
  errors.assertClean(code.urls);
});

for (const recovery of ['late completion', 'Retry'] as const) {
  test(`Quick Add code timeout keeps ownership through ${recovery}`, async ({ page }) => {
    const errors = observeErrors(page);
    await observeIntents(page);
    let productRequests = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === `/api/products/${handle}`) productRequests += 1;
    });
    await page.goto('/tops/sweaters');
    const now = new Date('2026-11-15T00:00:00Z');
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1000));
    const code = await controlBodyCode(page);
    const { panel, trigger } = await activateCrewneck(page);
    await expect(panel).toBeVisible();
    await code.held;
    await page.clock.runFor(9999);
    await expect(panel.getByRole('status')).toHaveText('Loading Quick Add…');
    await page.clock.runFor(1);
    await expect(panel.getByRole('status')).toHaveText('Quick Add could not load.');
    if (recovery === 'Retry')
      await panel.getByRole('button', { name: 'Retry', exact: true }).click();
    const loaded = page.waitForResponse((response) => code.urls.has(response.url()));
    code.release();
    await (await loaded).finished();
    await page.clock.runFor(100);
    if (recovery === 'Retry') {
      await expect(
        panel.getByText('Demo bag. Checkout is unavailable.', { exact: true }),
      ).toBeVisible();
      // Resume normal time after the exact code deadline assertions. React's
      // passive effect may schedule the product timer after the body commits.
      await page.clock.resume();
      await expect(panel.getByRole('radio', { name: 'M', exact: true })).toBeVisible();
      expect(productRequests).toBe(1);
    } else {
      await expect(panel.getByRole('status')).toHaveText('Quick Add could not load.');
      await expect(panel.getByRole('radio')).toHaveCount(0);
      expect(productRequests).toBe(0);
    }
    expect(await intents(page)).toEqual([handle]);
    await panel.getByRole('button', { name: 'CLOSE', exact: true }).click();
    await expect(trigger).toBeFocused();
    errors.assertClean();
  });
}

test('closing during code loading prevents late body work and preserves fresh reopening', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await observeIntents(page);
  let productRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === `/api/products/${handle}`) productRequests += 1;
  });
  await page.goto('/tops/sweaters');
  const code = await controlBodyCode(page);
  const { panel, trigger } = await activateCrewneck(page);
  await expect(panel).toBeVisible();
  await code.held;
  await panel.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(trigger).toBeFocused();
  const loaded = page.waitForResponse((response) => code.urls.has(response.url()));
  code.release();
  await (await loaded).finished();
  await expect(panel).toBeHidden();
  await expect(page.getByRole('radio')).toHaveCount(0);
  expect(productRequests).toBe(0);
  await activateCrewneck(page);
  await expect(panel.getByRole('radio', { name: 'M', exact: true })).toBeVisible();
  expect(productRequests).toBe(1);
  expect(await intents(page)).toEqual([handle, handle]);
  await panel.getByRole('radio', { name: 'M', exact: true }).press('Space');
  await panel.getByRole('radio', { name: 'Black', exact: true }).press('Space');
  await expect(panel.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
  await panel.press('Escape');
  await expect(trigger).toBeFocused();
  await activateCrewneck(page);
  await expect(panel.getByRole('radio', { name: 'M', exact: true })).not.toBeChecked();
  expect(productRequests).toBe(2);
  errors.assertClean();
});

test('a rejected code preload has no intent and the next activation can recover', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await observeIntents(page);
  await page.goto('/tops/sweaters');
  const code = await controlBodyCode(page, 'reject');
  const { trigger, panel } = crewneck(page);
  await expect(trigger).toBeEnabled();
  await trigger.focus();
  // Exhaust this installed runtime's transport retry before accepting an intent.
  await expect.poll(() => code.rejections).toBeGreaterThanOrEqual(2);
  await expect(panel).toBeHidden();
  expect(await intents(page)).toEqual([]);
  code.release();
  await trigger.press('Enter');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('radio', { name: 'M', exact: true })).toBeVisible();
  expect(await intents(page)).toEqual([handle]);
  errors.assertClean(code.urls);
});

test('history navigation unmounts a loading frame before late code can commit', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await observeIntents(page);
  let productRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === `/api/products/${handle}`) productRequests += 1;
  });
  await page.goto('/tops/sweaters');
  // Real client navigation seeds a same-document Forward destination.
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/tops\/sweaters$/);
  const code = await controlBodyCode(page);
  const { panel } = await activateCrewneck(page);
  await expect(panel).toBeVisible();
  await code.held;
  // Browser history remains available while the native modal makes page links inert.
  await page.goForward();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  const focus = await page.evaluateHandle(() => document.activeElement);
  const loaded = page.waitForResponse((response) => code.urls.has(response.url()));
  code.release();
  await (await loaded).finished();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.getByRole('radio')).toHaveCount(0);
  expect(await focus.evaluate((element) => element === document.activeElement)).toBe(true);
  expect(productRequests).toBe(0);
  errors.assertClean();
});

test('keyboard code Retry keeps useful focus in the frame while code is held', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto('/tops/sweaters');
  const now = new Date('2026-11-15T00:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  const code = await controlBodyCode(page);
  const { panel } = await activateCrewneck(page);
  await expect(panel).toBeVisible();
  await code.held;
  await page.clock.runFor(10_000);
  const retry = panel.getByRole('button', { name: 'Retry', exact: true });
  await retry.focus();
  await retry.press('Enter');
  await expect(panel.getByRole('status')).toHaveText('Loading Quick Add…');
  expect(
    await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      inDialog: Boolean(document.activeElement?.closest('dialog')),
    })),
  ).toEqual({ tag: 'BUTTON', inDialog: true });
  await expect(panel.getByRole('button', { name: 'CLOSE', exact: true })).toBeFocused();
  errors.assertClean();
});

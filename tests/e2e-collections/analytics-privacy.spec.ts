import { expect, test, type Page } from '@playwright/test';
import { runInNewContext } from 'node:vm';

type Command = unknown[];

async function commands(page: Page): Promise<Command[]> {
  return page.evaluate(
    () => (window as typeof window & { __gaCommands?: unknown[][] }).__gaCommands ?? [],
  );
}

async function pageViews(page: Page) {
  return (await commands(page)).filter(
    (command) => command[0] === 'event' && command[1] === 'page_view',
  );
}

test('configured fake-tag bootstrap and navigation keep Search values out of analytics and referrers', async ({
  page,
  context,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_ANALYTICS_STUB !== '1',
    'Requires an explicitly isolated fake-ID build with Preview analytics disabled.',
  );
  const privateQuery = 'synthetic@example.test';
  const unexpectedGoogleRequests: string[] = [];
  const stub = `window.__gaCommands=(window.dataLayer||[]).map(function(command){return Array.from(command);});var originalPush=window.dataLayer.push.bind(window.dataLayer);window.dataLayer.push=function(){for(var command of arguments){window.__gaCommands.push(Array.from(command));}return originalPush.apply(null,arguments);};`;
  await context.route(
    /https:\/\/([^/]*\.)?(googletagmanager|google-analytics)\.com\/.*/,
    async (route) => {
      const url = new URL(route.request().url());
      if (
        url.hostname === 'www.googletagmanager.com' &&
        url.pathname === '/gtag/js' &&
        url.searchParams.get('id') === 'G-ESQUETEST'
      ) {
        await route.fulfill({ contentType: 'application/javascript', body: stub });
      } else {
        unexpectedGoogleRequests.push(url.href);
        await route.abort();
      }
    },
  );

  await page.goto(`/se%61rch?${new URLSearchParams({ q: privateQuery })}#private`);
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(1);
  const initial = await commands(page);
  expect(initial[0][0]).toBe('js');
  expect(initial[1]).toEqual([
    'config',
    'G-ESQUETEST',
    { send_page_view: false, page_location: 'http://localhost:3000/se%61rch', page_referrer: '' },
  ]);
  const emitted = await page.locator('#esque-ga-init').textContent();
  expect(emitted).toBeTruthy();
  for (const pathname of ['/search', '/%73earch', '/se%61rch', '/search%2f']) {
    const address = `http://localhost:3000${pathname}?${new URLSearchParams({ q: privateQuery })}#private`;
    const execution = {
      window: { dataLayer: [] as unknown[] },
      location: { href: address },
      document: { referrer: address },
      URL,
    };
    runInNewContext(emitted!, execution);
    const config = Array.from(execution.window.dataLayer[1] as ArrayLike<unknown>)[2];
    expect(config).toEqual({
      send_page_view: false,
      page_location: `http://localhost:3000${pathname}`,
      page_referrer: `http://localhost:3000${pathname}`,
    });
  }
  expect(JSON.stringify(initial)).not.toContain(privateQuery);
  expect(JSON.stringify(initial)).not.toContain(encodeURIComponent(privateQuery));

  await page.goto(`/search?${new URLSearchParams({ q: privateQuery })}`);
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(1);
  const privateSearch = await commands(page);
  expect(privateSearch[1]).toEqual([
    'config',
    'G-ESQUETEST',
    {
      send_page_view: false,
      page_location: 'http://localhost:3000/search',
      page_referrer: '',
    },
  ]);
  expect(JSON.stringify(privateSearch)).not.toContain(privateQuery);
  expect(JSON.stringify(privateSearch)).not.toContain(encodeURIComponent(privateQuery));
  const nativeRequest = page.waitForRequest(
    (request) =>
      request.isNavigationRequest() &&
      new URL(request.url()).pathname === '/search' &&
      new URL(request.url()).searchParams.get('q') === 'preview',
  );
  await page.getByRole('searchbox', { name: 'Search query' }).fill('preview');
  await page.locator('main').getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=preview$/);
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(20);
  expect((await nativeRequest).headers().referer).toBe('http://localhost:3000/');
  expect(await page.evaluate(() => document.referrer)).toBe('http://localhost:3000/');
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(1);
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(10);
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(2);
  await page.evaluate(() => {
    history.pushState(null, '', '#search-results');
  });
  await page.waitForTimeout(250);
  expect(await pageViews(page)).toHaveLength(2);
  await page.locator('main a[data-cursor="VIEW"]').first().click();
  await expect(page).toHaveURL(/\/products\//);
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(3);
  const productViews = (await commands(page)).filter(
    (command) => command[0] === 'event' && command[1] === 'view_item',
  );
  expect(productViews).toHaveLength(1);
  expect(productViews[0][2]).toMatchObject({ page_referrer: 'http://localhost:3000/search' });
  await page.evaluate(() => {
    history.pushState(null, '', '#details');
  });
  await page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true }).click();
  const saved = (await commands(page)).filter(
    (command) => command[0] === 'event' && command[1] === 'add_to_wishlist',
  );
  expect(saved).toHaveLength(1);
  expect(saved[0][2]).toMatchObject({
    page_location: page.url().split('#')[0],
    page_referrer: 'http://localhost:3000/search',
  });
  expect(await pageViews(page)).toHaveLength(3);
  expect((await commands(page)).filter((command) => command[1] === 'search')).toHaveLength(0);
  const queue = JSON.stringify(await commands(page));
  expect(queue).not.toContain(privateQuery);
  expect(queue).not.toContain(encodeURIComponent(privateQuery));
  await page.goBack();
  await expect(page).toHaveURL(/\/products\/[^#]+$/);
  expect(await pageViews(page)).toHaveLength(3);
  await page.goBack();
  await expect(page).toHaveURL(/\/search\?/);
  await expect(page.getByRole('heading', { name: 'SEARCH', exact: true })).toBeVisible();
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(4);
  expect((await pageViews(page)).at(-1)?.[2]).toMatchObject({
    page_location: 'http://localhost:3000/search',
    page_referrer: saved[0][2] && (saved[0][2] as { page_location: string }).page_location,
  });
  await page.goForward();
  await expect(page).toHaveURL(/\/products\//);
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(5);
  expect((await pageViews(page)).at(-1)?.[2]).toMatchObject({
    page_location: page.url().split('#')[0],
    page_referrer: 'http://localhost:3000/search',
  });
  await page.reload();
  await expect.poll(() => pageViews(page).then((items) => items.length)).toBe(1);
  expect((await commands(page)).filter((command) => command[0] === 'config')).toHaveLength(1);
  expect(unexpectedGoogleRequests).toEqual([]);
});

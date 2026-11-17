import { expect, test, type Page } from '@playwright/test';
import { PREVIEW_PRODUCTS } from '../../lib/shopify/preview-demo-fixtures';

async function openSearch(page: Page, query: string) {
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  await dialog.getByRole('searchbox').fill(query);
  return dialog;
}

test('six suggestions lead to independent full product and collection pages with history', async ({
  page,
}) => {
  await page.goto('/about');
  const dialog = await openSearch(page, 'demo');
  await expect(dialog.locator('a[data-cursor="VIEW"]')).toHaveCount(6);
  await expect(dialog.locator('a[href*="demo-collection-"]')).toHaveCount(6);
  await expect(dialog.getByText('Up to 6 product and 6 collection suggestions.')).toBeVisible();
  await expect(dialog.getByRole('status')).toContainText('12 results shown');
  const viewAll = dialog.getByRole('link', { name: 'View all results', exact: true });
  await viewAll.focus();
  await viewAll.press('Enter');
  await expect(page).toHaveURL(/\/search\?q=demo$/);
  const products = page.getByRole('region', { name: 'Products', exact: true });
  const collections = page.getByRole('region', { name: 'Collections', exact: true });
  await expect(products.locator('a[data-cursor="VIEW"]')).toHaveCount(20);
  await expect(collections.locator('ul a')).toHaveCount(20);
  const allCollections = await collections
    .locator('ul a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  await products.getByRole('link', { name: 'Next products', exact: true }).click();
  await expect(products.locator('a[data-cursor="VIEW"]')).toHaveCount(4);
  const productCursor = new URL(page.url()).searchParams.get('productAfter');
  for (const [index, count] of [20, 5].entries()) {
    const next = collections.getByRole('link', { name: 'Next collections', exact: true });
    const destination = new URL((await next.getAttribute('href'))!, page.url()).href;
    await next.click();
    await expect(page).toHaveURL(destination);
    await expect(collections.locator('ul a').first()).toHaveAttribute(
      'href',
      `/collections/demo-collection-${index === 0 ? '021' : '041'}`,
    );
    await expect(collections.locator('ul a')).toHaveCount(count);
    await expect(products.locator('a[data-cursor="VIEW"]')).toHaveCount(4);
    expect(new URL(page.url()).searchParams.get('productAfter')).toBe(productCursor);
    allCollections.push(
      ...(await collections
        .locator('ul a')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')))),
    );
  }
  expect(new Set(allCollections).size).toBe(45);
  expect(allCollections).toEqual(
    Array.from(
      { length: 45 },
      (_, index) =>
        `/${index < 20 || index === 44 ? 'archive' : 'collections'}/demo-collection-${String(index + 1).padStart(3, '0')}`,
    ),
  );
  await page.goBack();
  await expect(collections.locator('ul a')).toHaveCount(20);
  await page.goForward();
  await expect(collections.locator('ul a')).toHaveCount(5);
  await collections.getByRole('link', { name: 'First collections page' }).click();
  await expect(collections.locator('ul a')).toHaveCount(20);
  await expect(products.locator('a[data-cursor="VIEW"]')).toHaveCount(4);
  await page.getByRole('searchbox', { name: 'Search query' }).fill('preview');
  await page.locator('main').getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=preview$/);
  await expect(products.locator('a[data-cursor="VIEW"]')).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('a preview-empty description search reaches all 30 canonical products without duplicates', async ({
  page,
}) => {
  await page.goto('/about');
  const dialog = await openSearch(page, 'preview');
  await expect(dialog.getByText('NO SUGGESTIONS.', { exact: true })).toBeVisible();
  await dialog.getByRole('link', { name: 'View all results' }).click();
  const cards = page.locator('main a[data-cursor="VIEW"]');
  await expect(cards).toHaveCount(20);
  const destinations = await cards.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  await expect(cards).toHaveCount(10);
  destinations.push(
    ...(await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')))),
  );
  expect(destinations).toEqual(PREVIEW_PRODUCTS.map((product) => `/products/${product.handle}`));
  expect(new Set(destinations).size).toBe(30);
  await expect(
    page.getByText(
      'Product search shows up to 1,000 matches. Refine your query to narrow the results.',
    ),
  ).toBeVisible();
  const currentUrl = page.url();
  await cards.last().click();
  await expect(page).toHaveURL(new RegExp(`${PREVIEW_PRODUCTS.at(-1)!.handle}$`));
  await expect(
    page.getByRole('heading', { name: PREVIEW_PRODUCTS.at(-1)!.title, exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(currentUrl);
  await expect(cards).toHaveCount(10);
});

test('Enter respects composition and preview failure still offers the full query', async ({
  page,
}) => {
  await page.route('**/api/search?*', (route) =>
    route.fulfill({ status: 503, json: { error: 'synthetic_failure' } }),
  );
  await page.goto('/about');
  const dialog = await openSearch(page, ' demo ');
  await expect(dialog.getByText('COULD NOT LOAD RESULTS.')).toBeVisible();
  const input = dialog.getByRole('searchbox');
  await input.dispatchEvent('compositionstart');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/about$/);
  await expect(dialog).toBeVisible();
  await input.dispatchEvent('compositionend');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/search\?q=demo$/);
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(20);
});

test('modified View all activation leaves the original overlay session intact', async ({
  page,
  context,
}) => {
  await page.goto('/about');
  const dialog = await openSearch(page, 'demo');
  const popup = context.waitForEvent('page');
  await dialog
    .getByRole('link', { name: 'View all results' })
    .click({ modifiers: ['ControlOrMeta'] });
  const destination = await popup;
  await expect(destination).toHaveURL(/\/search\?q=demo$/);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('searchbox')).toHaveValue('demo');
  await destination.close();
});

test('native full Search forms and independent continuation work without scripting', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
    await expect(page).toHaveURL(/\/search\??$/);
    expect(new URL(page.url()).searchParams.size).toBe(0);
    await page.getByRole('searchbox', { name: 'Search query' }).fill('demo');
    await page.locator('main').getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(20);
    await page.getByRole('link', { name: 'Next products', exact: true }).click();
    await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(4);
    await page.getByRole('link', { name: 'Next collections', exact: true }).click();
    await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(4);
    await page.getByRole('link', { name: 'First products page' }).click();
    await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(20);
    expect(new URL(page.url()).searchParams.get('collectionAfter')).toBeTruthy();
  } finally {
    await context.close();
  }
});

test('stale group cursors restart independently and Search HTML protects query metadata and referrers', async ({
  page,
  request,
}) => {
  await page.goto('/search?q=demo');
  await page.getByRole('link', { name: 'Next products', exact: true }).click();
  const cursor = new URL(page.url()).searchParams.get('productAfter')!;
  await page.goto(`/search?${new URLSearchParams({ q: 'preview', productAfter: cursor })}`);
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(20);
  await expect(page.getByRole('link', { name: 'First products page' })).toHaveCount(0);
  const privateQuery = 'synthetic@example.com';
  const response = await request.get(`/search?${new URLSearchParams({ q: privateQuery })}`);
  expect(response.headers()['referrer-policy']).toBe('origin');
  for (const pathname of ['/%73earch', '/se%61rch']) {
    const alias = await request.get(`${pathname}?${new URLSearchParams({ q: privateQuery })}`);
    expect(alias.status()).toBe(404);
    expect(alias.headers()['referrer-policy']).toBe('origin');
    expect(await alias.text()).toContain('THIS PIECE');
  }
  const html = await response.text();
  expect(html).toContain('<title>Search — Esque</title>');
  expect(html).toContain('name="robots" content="noindex, follow"');
  expect(html).toContain('rel="canonical" href="http://localhost:3000/search"');
  expect(html).toContain('property="og:url" content="http://localhost:3000/search"');
  expect(html).not.toContain(`<title>${privateQuery}`);
  const sitemap = await request.get('/sitemap.xml');
  expect(await sitemap.text()).not.toContain('/search');
  await page.goto('/search?q=demo&q=preview');
  await expect(page.locator('main').getByRole('alert')).toHaveText('Enter one search query.');
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(0);
});

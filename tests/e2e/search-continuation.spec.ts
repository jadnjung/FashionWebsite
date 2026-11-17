import { expect, test } from '@playwright/test';

test('Search has a server-rendered native entry point and generic noindex metadata', async ({
  request,
}) => {
  const response = await request.get('/search');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('action="/search"');
  expect(html).toContain('name="q"');
  expect(html).toContain('name="robots" content="noindex, follow"');
  expect(html).toContain('<title>Search — Esque</title>');
});

test('the header Search button reaches the native Search form without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
    await expect(page).toHaveURL(/\/search\??$/);
    expect(new URL(page.url()).searchParams.size).toBe(0);
    await expect(page.getByRole('searchbox', { name: 'Search query', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('full Search failure preserves the query and a native Retry while remaining distinct from empty', async ({
  page,
}) => {
  await page.goto('/search?q=crewneck');
  await expect(page.getByText('COULD NOT LOAD RESULTS.', { exact: true })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search query' })).toHaveValue('crewneck');
  await expect(page.getByText('NOTHING MATCHES.', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('COULD NOT LOAD RESULTS.', { exact: true })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search query' })).toHaveValue('crewneck');
});

import { test, expect, type Page } from '@playwright/test';

async function openFilters(page: Page) {
  const summary = page.locator('main summary').filter({ hasText: /^Filter and sort/ });
  if ((await summary.locator('..').getAttribute('open')) === null) await summary.click();
  const form = page.locator('main form[method="get"]');
  for (const label of ['Size', 'Color', 'Collection']) {
    const group = form
      .locator('details')
      .filter({ has: page.locator('summary', { hasText: label }) });
    if ((await group.getAttribute('open')) === null) await group.locator('summary').click();
  }
  return form;
}

test('removed multiselect chips stay removed on the next Apply', async ({ page }) => {
  await page.goto(
    '/new?sort=featured&size=M&size=L&color=Black&color=Ecru&collection=demo-capsule&collection=collection-001',
  );
  let form = await openFilters(page);
  for (const [name, removed, retained] of [
    ['size', 'M', 'L'],
    ['color', 'Black', 'Ecru'],
    ['collection', 'demo-capsule', 'collection-001'],
  ]) {
    await page.getByRole('link', { name: `Remove ${name} ${removed}`, exact: true }).click();
    await expect(
      page.getByRole('link', { name: `Remove ${name} ${removed}`, exact: true }),
    ).toHaveCount(0);
    form = await openFilters(page);
    await expect(form.locator(`input[name="${name}"][value="${removed}"]`)).not.toBeChecked();
    await expect(form.locator(`input[name="${name}"][value="${retained}"]`)).toBeChecked();
  }
  await form.getByRole('button', { name: 'APPLY', exact: true }).click();
  await expect(page).toHaveURL(/minPrice=/);
  const params = new URL(page.url()).searchParams;
  expect(params.getAll('size')).toEqual(['L']);
  expect(params.getAll('color')).toEqual(['Ecru']);
  expect(params.getAll('collection')).toEqual(['collection-001']);
});

test('Clear Filters resets availability, prices and facets before Apply', async ({ page }) => {
  await page.goto(
    '/new?sort=price-asc&size=M&color=Black&available=1&minPrice=95.5&maxPrice=188.5',
  );
  let form = await openFilters(page);
  await form.getByRole('spinbutton', { name: 'Min Price' }).fill('100');
  await form.getByRole('spinbutton', { name: 'Max Price' }).fill('200');
  await form.getByRole('link', { name: 'Clear Filters', exact: true }).click();
  await expect(page).toHaveURL('/new?sort=price-asc');
  form = await openFilters(page);
  await expect(form.getByRole('checkbox', { name: 'In Stock Only' })).not.toBeChecked();
  await expect(form.locator('input[name="size"]:checked, input[name="color"]:checked')).toHaveCount(
    0,
  );
  await expect(form.getByRole('spinbutton', { name: 'Min Price' })).toHaveValue('');
  await expect(form.getByRole('spinbutton', { name: 'Max Price' })).toHaveValue('');
  await form.getByRole('button', { name: 'APPLY', exact: true }).click();
  await expect(page).toHaveURL(/minPrice=/);
  const params = new URL(page.url()).searchParams;
  expect(params.get('sort')).toBe('price-asc');
  expect(params.get('available')).toBeNull();
  expect(params.getAll('size')).toEqual([]);
  expect(params.getAll('color')).toEqual([]);
  expect(params.get('minPrice')).toBe('');
  expect(params.get('maxPrice')).toBe('');
});

test('sort and history navigation replace unapplied edits with applied URL choices', async ({
  page,
}) => {
  await page.goto('/new?sort=featured&size=M&color=Black&available=1&minPrice=95.5&maxPrice=188.5');
  let form = await openFilters(page);
  await form.getByRole('checkbox', { name: 'L', exact: true }).check();
  await form.getByRole('checkbox', { name: 'In Stock Only' }).uncheck();
  await form.getByRole('spinbutton', { name: 'Min Price' }).fill('120');
  await form.getByRole('spinbutton', { name: 'Max Price' }).fill('220');
  const sortLink = page
    .getByRole('navigation', { name: 'Sort', exact: true })
    .getByRole('link', { name: 'Price: High to Low' });
  await sortLink.focus();
  await sortLink.press('Enter');
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(sortLink).toHaveAttribute('aria-current', 'true');
  form = await openFilters(page);
  await expect(form.getByRole('checkbox', { name: 'L', exact: true })).not.toBeChecked();
  await expect(form.getByRole('checkbox', { name: 'M', exact: true })).toBeChecked();
  await expect(form.getByRole('checkbox', { name: 'In Stock Only' })).toBeChecked();
  await expect(form.getByRole('spinbutton', { name: 'Min Price' })).toHaveValue('95.5');
  await expect(form.getByRole('spinbutton', { name: 'Max Price' })).toHaveValue('188.5');
  await form.getByRole('spinbutton', { name: 'Max Price' }).fill('300');
  await page.goBack();
  await expect(page).toHaveURL(/sort=featured/);
  await expect(
    page
      .getByRole('navigation', { name: 'Sort', exact: true })
      .getByRole('link', { name: 'Featured', exact: true }),
  ).toHaveAttribute('aria-current', 'true');
  form = await openFilters(page);
  await expect(form.getByRole('spinbutton', { name: 'Max Price' })).toHaveValue('188.5');
  await form.getByRole('checkbox', { name: 'M', exact: true }).uncheck();
  await page.goForward();
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(sortLink).toHaveAttribute('aria-current', 'true');
  form = await openFilters(page);
  await expect(form.getByRole('checkbox', { name: 'M', exact: true })).toBeChecked();
  await expect(form.getByRole('spinbutton', { name: 'Max Price' })).toHaveValue('188.5');
});

test('filter-option pagination preserves drafts and submits the current option cursor', async ({
  page,
}) => {
  await page.goto('/new?sort=featured');
  let form = await openFilters(page);
  await form.getByRole('checkbox', { name: 'M', exact: true }).check();
  await form.getByRole('spinbutton', { name: 'Min Price' }).fill('95.50');
  await page.getByRole('link', { name: 'More filter options', exact: true }).click();
  await expect(page).toHaveURL(/optionsAfter=/);
  const cursor = new URL(page.url()).searchParams.get('optionsAfter');
  form = await openFilters(page);
  await expect(form.getByRole('checkbox', { name: 'M', exact: true })).toBeChecked();
  await expect(form.getByRole('spinbutton', { name: 'Min Price' })).toHaveValue('95.50');
  await form.getByRole('button', { name: 'APPLY', exact: true }).click();
  await expect(page).toHaveURL(/size=M/);
  const params = new URL(page.url()).searchParams;
  expect(params.get('minPrice')).toBe('95.50');
  expect(params.get('optionsAfter')).toBe(cursor);
  expect(params.get('after')).toBeNull();
});

test('native GET submission applies multiselects, decimal prices and availability without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/new?sort=price-asc');
    const form = await openFilters(page);
    await form.getByRole('checkbox', { name: 'M', exact: true }).check();
    await form.getByRole('checkbox', { name: 'L', exact: true }).check();
    await form.getByRole('checkbox', { name: 'Black', exact: true }).check();
    await form.getByRole('checkbox', { name: 'In Stock Only' }).check();
    await form.getByRole('spinbutton', { name: 'Min Price' }).fill('95.50');
    await form.getByRole('spinbutton', { name: 'Max Price' }).fill('188.50');
    await form.getByRole('button', { name: 'APPLY', exact: true }).click();
    await expect(page).toHaveURL(/minPrice=95\.50/);
    const params = new URL(page.url()).searchParams;
    expect(params.getAll('size')).toEqual(['M', 'L']);
    expect(params.get('color')).toBe('Black');
    expect(params.get('sort')).toBe('price-asc');
    expect(params.get('available')).toBe('1');
    expect(params.get('maxPrice')).toBe('188.50');
    await expect(page.getByRole('link', { name: /Fluid Knit Long-Sleeve/ })).toBeVisible();
  } finally {
    await context.close();
  }
});

import { expect, test, type Page } from '@playwright/test';

function selectionUrl(count: number, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({
    sort: 'price-asc',
    available: '1',
    minPrice: '95.50',
    ...extra,
  });
  for (let index = 1; index <= count; index += 1) params.append('size', `Size ${index}`);
  return `/new?${params}`;
}

async function openFilters(page: Page) {
  const summary = page.locator('main summary').filter({ hasText: /^Filter and sort/ });
  if ((await summary.locator('..').getAttribute('open')) === null) await summary.click();
  const form = page.locator('main form[method="get"]');
  for (const label of ['Size', 'Color', 'Collection']) {
    const group = form
      .locator('details')
      .filter({ has: page.locator('legend', { hasText: new RegExp(`^${label}$`) }) });
    if ((await group.getAttribute('open')) === null) await group.locator('summary').click();
  }
  return form;
}

test('normal GET retains all 21 choices for correction instead of applying the first 20', async ({
  page,
}) => {
  await page.goto(selectionUrl(20));
  let form = await openFilters(page);
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(20);
  await page.goto(selectionUrl(21));
  form = await openFilters(page);
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(21);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('20');
  await expect(page.locator('#catalog-results')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Product pages' })).toHaveCount(0);
});

test('enhanced selection counts applied and off-page drafts, keeps focus and permits replacement', async ({
  page,
}) => {
  await page.goto('/new?sort=featured&size=Size+101');
  let form = await openFilters(page);
  await expect(form.getByRole('checkbox', { name: 'Size 101', exact: true })).toBeChecked();
  for (let index = 1; index <= 19; index += 1)
    await form.getByRole('checkbox', { name: `Size ${index}`, exact: true }).check();
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(20);
  await page.getByRole('link', { name: 'More filter options', exact: true }).click();
  await expect(page.getByRole('link', { name: 'First filter options', exact: true })).toBeVisible();
  form = await openFilters(page);
  const sizeGroup = form.getByRole('group', { name: 'Size', exact: true });
  const candidate = sizeGroup.getByRole('checkbox', { name: 'M', exact: true });
  await candidate.focus();
  await candidate.press('Space');
  await expect(candidate).not.toBeChecked();
  await expect(candidate).toBeFocused();
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(20);
  await expect(sizeGroup).not.toHaveAttribute('aria-invalid');
  await expect(
    form.getByRole('status').filter({ hasText: 'Selection limit reached.' }),
  ).toBeVisible();
  const description = await sizeGroup.getAttribute('aria-describedby');
  expect(description?.split(' ')).toHaveLength(2);
  await candidate.press('Space');
  await expect(candidate).not.toBeChecked();
  const retained = sizeGroup.getByRole('checkbox', { name: 'Size 1', exact: true });
  await retained.uncheck();
  await candidate.focus();
  await candidate.press('Space');
  await expect(candidate).toBeChecked();
  await expect(candidate).toBeFocused();
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(20);
  await retained.focus();
  await retained.press('Space');
  await expect(retained).not.toBeChecked();
  await candidate.uncheck();
  await retained.press('Space');
  await expect(retained).toBeChecked();
  await form.getByRole('checkbox', { name: 'Black', exact: true }).check();
  await expect(form.locator('input[name="color"]:checked')).toHaveCount(1);
  // The many-size fixture has no Color option; demonstrate independence, then match it by size.
  await form.getByRole('checkbox', { name: 'Black', exact: true }).uncheck();
  await form.getByRole('button', { name: 'APPLY', exact: true }).click();
  await expect(page.locator('#catalog-results')).toBeVisible();
  const params = new URL(page.url()).searchParams;
  expect(params.getAll('size').sort()).toEqual(
    ['Size 101', ...Array.from({ length: 19 }, (_, index) => `Size ${index + 1}`)].sort(),
  );
  expect(params.get('color')).toBeNull();
  await expect(page.locator('a[href="/products/preview-many-variants"]').first()).toBeVisible();
});

test('recovery sort navigation and history reset drafts while preserving all applied choices', async ({
  page,
}) => {
  await page.goto(selectionUrl(22));
  let form = await openFilters(page);
  await form.getByRole('checkbox', { name: 'Size 1', exact: true }).uncheck();
  await page.getByRole('link', { name: 'Featured', exact: true }).click();
  await expect(page).toHaveURL(/sort=featured/);
  form = await openFilters(page);
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(22);
  await expect(form.getByRole('checkbox', { name: 'Size 1', exact: true })).toBeChecked();
  await expect(form.getByRole('checkbox', { name: 'Size 22', exact: true })).toBeChecked();
  await page.goBack();
  await expect(page).toHaveURL(/sort=price-asc/);
  form = await openFilters(page);
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(22);
  await page.goForward();
  await expect(page).toHaveURL(/sort=featured/);
  form = await openFilters(page);
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(22);
  await form.getByRole('link', { name: 'Clear Filters', exact: true }).click();
  await expect(page.locator('#catalog-results')).toBeVisible();
  expect(new URL(page.url()).searchParams.getAll('size')).toEqual([]);
});

test('native GET overflow expands retained choices, supports correction and Clear without scripts', async ({
  browser,
}, testInfo) => {
  const { viewport, isMobile, hasTouch, deviceScaleFactor, userAgent } = testInfo.project.use;
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport,
    isMobile,
    hasTouch,
    deviceScaleFactor,
    userAgent,
  });
  try {
    const page = await context.newPage();
    await page.goto('/new?sort=price-asc&available=1&minPrice=95.50&maxPrice=999');
    let form = await openFilters(page);
    for (let index = 1; index <= 21; index += 1)
      await form.getByRole('checkbox', { name: `Size ${index}`, exact: true }).check();
    await form.getByRole('button', { name: 'APPLY', exact: true }).click();
    form = page.locator('main form[method="get"]');
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
    await expect(form.getByRole('checkbox', { name: 'Size 21', exact: true })).toBeVisible();
    await expect(form.locator('input[name="size"]:checked')).toHaveCount(21);
    await expect(form.getByRole('group', { name: 'Size', exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(page.locator('#catalog-results')).toHaveCount(0);
    await form.getByRole('checkbox', { name: 'Size 21', exact: true }).uncheck();
    await form.getByRole('button', { name: 'APPLY', exact: true }).click();
    await expect(page.locator('#catalog-results')).toBeVisible();
    const params = new URL(page.url()).searchParams;
    expect(params.getAll('size')).toHaveLength(20);
    expect(params.get('sort')).toBe('price-asc');
    expect(params.get('available')).toBe('1');
    expect(params.get('minPrice')).toBe('95.5');
    expect(params.get('maxPrice')).toBe('999');
    await expect(page.locator('a[href="/products/preview-many-variants"]').first()).toBeVisible();
    await page.goto(selectionUrl(21));
    await page.getByRole('link', { name: 'Clear Filters', exact: true }).click();
    await expect(page.locator('#catalog-results')).toBeVisible();
    expect(new URL(page.url()).searchParams.getAll('size')).toEqual([]);
  } finally {
    await context.close();
  }
});

test('multiple overflowing groups retain all normalized choices in expanded recovery', async ({
  page,
}) => {
  const params = new URLSearchParams(selectionUrl(21).split('?')[1]);
  for (let index = 1; index <= 22; index += 1) params.append('color', `Color ${index}`);
  params.append('collection', 'INVALID HANDLE');
  params.append('collection', 'collection-001');
  await page.goto(`/new?${params}`);
  const form = page.locator('main form[method="get"]');
  await expect(form.getByRole('group', { name: 'Size', exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(form.getByRole('group', { name: 'Color', exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(form.getByRole('group', { name: 'Collection', exact: true })).not.toHaveAttribute(
    'aria-invalid',
  );
  await expect(form.locator('input[name="size"]:checked')).toHaveCount(21);
  await expect(form.locator('input[name="color"]:checked')).toHaveCount(22);
  await expect(form.getByRole('checkbox', { name: 'INVALID HANDLE', exact: true })).toBeChecked();
  await expect(page.getByRole('navigation', { name: 'Filter option pages' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Product pages' })).toHaveCount(0);
  await expect(page.locator('#catalog-results')).toHaveCount(0);
});

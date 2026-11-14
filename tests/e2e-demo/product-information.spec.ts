import { expect, test } from '@playwright/test';

test('product information is keyboard accessible and identifies provisional product facts', async ({
  page,
}) => {
  await page.goto('/products/preview-featherweight-crewneck');
  const information = page.getByRole('region', { name: 'Product information' });
  for (const title of ['Materials', 'Fit and sizing', 'Care']) {
    const summary = information.locator('summary').filter({ hasText: title });
    await summary.focus();
    await summary.press('Enter');
    await expect(summary.locator('..').getByText(/Demo placeholder\./)).toBeVisible();
    await summary.press('Space');
    await expect(summary.locator('..')).not.toHaveAttribute('open');
  }
  await information
    .locator('summary')
    .filter({ hasText: /^Shipping$/ })
    .click();
  await expect(information.getByRole('link', { name: 'Shipping policy' })).toHaveAttribute(
    'href',
    '/legal/shipping',
  );
  await information
    .locator('summary')
    .filter({ hasText: /^Returns$/ })
    .click();
  await expect(information.getByRole('link', { name: 'Returns policy' })).toHaveAttribute(
    'href',
    '/legal/returns',
  );
});

test('mobile filters provide full-width actions and usable touch targets at narrow reflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/new');
  const min = page.getByRole('spinbutton', { name: 'Min Price' });
  const max = page.getByRole('spinbutton', { name: 'Max Price' });
  await min.fill('128');
  await max.fill('140');
  const apply = page.getByRole('button', { name: 'APPLY', exact: true });
  const box = await apply.boundingBox();
  expect(box?.width).toBeGreaterThan(250);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  for (const link of await page
    .getByRole('navigation', { name: 'Sort', exact: true })
    .getByRole('link')
    .all()) {
    expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }
  await apply.click();
  await expect(page).toHaveURL(/minPrice=128/);
  await expect(page.getByRole('main').getByRole('link', { name: /Featherweight/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mobile menu disclosures and category links offer comfortable touch targets', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/new');
  await page.getByRole('button', { name: 'MENU', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Menu', exact: true });
  const disclosure = menu.getByRole('button', { name: 'TOPS subcategories', exact: true });
  await expect(disclosure).toBeVisible();
  const target = await disclosure.boundingBox();
  expect(target?.width).toBeGreaterThanOrEqual(44);
  expect(target?.height).toBeGreaterThanOrEqual(44);
  await disclosure.click();
  const category = menu.getByRole('link', { name: 'Sweaters', exact: true });
  await expect(category).toBeVisible();
  expect((await category.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await menu.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await category.press('Enter');
  await expect(page).toHaveURL('/tops/sweaters');
  await expect(menu).toBeHidden();
});

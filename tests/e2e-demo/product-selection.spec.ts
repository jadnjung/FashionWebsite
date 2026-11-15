import { expect, test, type Locator } from '@playwright/test';

const productPath = '/products/preview-featherweight-crewneck';

async function choose(scope: Locator, value: string) {
  const radio = scope.getByRole('radio', { name: value, exact: true });
  await radio.focus();
  await radio.press('Space');
  await expect(radio).toBeChecked();
}

test('variant URLs survive reload, copied navigation, bag links and history traversal', async ({
  page,
}) => {
  await page.goto(productPath);
  const main = page.getByRole('main');
  await choose(main, 'M');
  await choose(main, 'Ecru');
  await expect(page).toHaveURL(/variant=preview-1-variant-4/);
  await choose(main, 'Black');
  await expect(page).toHaveURL(/variant=preview-1-variant-1/);
  await page.goBack();
  await expect(main.getByRole('radio', { name: 'Ecru', exact: true })).toBeChecked();
  await page.goForward();
  await expect(main.getByRole('radio', { name: 'Black', exact: true })).toBeChecked();
  await page.reload();
  await expect(main.getByRole('radio', { name: 'M', exact: true })).toBeChecked();
  await expect(main.getByRole('radio', { name: 'Black', exact: true })).toBeChecked();
  await main.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Added to demo bag.' })).toBeVisible();
  await page.goto('/bag');
  const productLink = page
    .getByRole('main')
    .getByRole('link', { name: 'Featherweight Crewneck Sweater', exact: true });
  await expect(productLink).toHaveAttribute('href', `${productPath}?variant=preview-1-variant-1`);
  await productLink.click();
  await expect(main.getByRole('radio', { name: 'M', exact: true })).toBeChecked();
  await page.goto(`${productPath}?variant=foreign-variant`);
  await expect(
    main.getByText('That variant is unavailable for this piece. Choose your options again.'),
  ).toBeVisible();
  await expect(
    main.getByRole('group', { name: 'Size', exact: true }).locator('input:checked'),
  ).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeDisabled();
});

test('contextual options retain recovery paths and provide 44px hit areas at narrow reflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(productPath);
  const main = page.getByRole('main');
  await choose(main, 'S');
  await choose(main, 'Ecru');
  await expect(main.getByText('This combination is sold out.', { exact: true })).toBeVisible();
  await expect(main.getByRole('radio', { name: 'Black', exact: true })).toBeEnabled();
  await expect(main.getByRole('radio', { name: 'L', exact: true })).toBeEnabled();
  for (const radio of await main.getByRole('radio').all()) {
    const size = await radio.evaluate((input: HTMLInputElement) => {
      const box = input.labels?.[0]?.getBoundingClientRect();
      return { width: box?.width ?? 0, height: box?.height ?? 0 };
    });
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  }
  await choose(main, 'Black');
  await expect(main.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('size guide follows garment type, converts units and restores focus', async ({ page }) => {
  for (const [handle, heading] of [
    ['preview-featherweight-crewneck', 'Chest'],
    ['preview-tailored-trouser-set', 'Waist'],
  ]) {
    await page.goto(`/products/${handle}`);
    const trigger = page.getByRole('button', { name: 'Size Guide', exact: true });
    await trigger.click();
    const guide = page.getByRole('dialog', { name: 'Size Guide', exact: true });
    await expect(guide.getByText(/Synthetic demo measurements/)).toBeVisible();
    await expect(guide.getByRole('columnheader', { name: `${heading} (in)` })).toBeVisible();
    await guide.getByRole('radio', { name: 'Centimeters', exact: true }).check();
    await expect(guide.getByRole('columnheader', { name: `${heading} (cm)` })).toBeVisible();
    await expect(guide.getByText('How to measure', { exact: true })).toBeVisible();
    await guide.press('Escape');
    await expect(guide).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test('unavailable outfit choices block atomic addition and recover by exclusion or another option', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('list', { name: 'All looks' })
    .getByRole('button', { name: /^LOOK 02,/ })
    .press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Shop the Look', exact: true });
  const rows = dialog.locator('div.border-b');
  const crewneck = rows.filter({ hasText: 'Featherweight Crewneck Sweater' });
  const trouser = rows.filter({ hasText: 'Tailored Wide-Leg Trouser Set' });
  await choose(crewneck, 'S');
  await choose(crewneck, 'Ecru');
  await choose(trouser, 'M');
  await choose(trouser, 'Black');
  const add = dialog.getByRole('button', { name: 'ADD LOOK', exact: true });
  await expect(add).toBeDisabled();
  await expect(crewneck.getByText('This combination is sold out.', { exact: true })).toBeVisible();
  await crewneck.getByRole('checkbox').uncheck();
  await expect(add).toBeEnabled();
  await crewneck.getByRole('checkbox').check();
  await expect(add).toBeDisabled();
  await choose(crewneck, 'L');
  await expect(add).toBeEnabled();
  await add.click();
  await expect(dialog.getByRole('status').filter({ hasText: 'Added to demo bag.' })).toBeVisible();
});

test('failed gallery renditions reserve layout and recover through the viewer', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/_next/image?*', async (route) => {
    if (fail && new URL(route.request().url()).searchParams.get('url')?.includes('product-3.jpg'))
      await route.abort('failed');
    else await route.continue();
  });
  await page.goto(productPath);
  const gallery = page.getByRole('region', {
    name: 'Featherweight Crewneck Sweater images',
    exact: true,
  });
  await expect(gallery.getByText('Image unavailable.', { exact: true }).first()).toBeVisible();
  const image = gallery.locator('[data-gallery-item="0"]');
  const bounds = await image.boundingBox();
  expect(bounds!.height / bounds!.width).toBeCloseTo(1.25, 1);
  fail = false;
  await gallery.getByRole('link', { name: /Enlarge .*image 1 of 3/ }).click();
  const viewer = page.getByRole('dialog', { name: /image viewer/ });
  await expect(viewer).toBeVisible();
  await expect
    .poll(() => viewer.getByRole('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

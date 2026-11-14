import { test, expect } from '@playwright/test';

test('portrait hero retains enough source detail for its cover crop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Collection Hero' });
  await expect(hero).toBeVisible({ timeout: 30_000 });
  const image = hero.locator('img');
  await expect(image).toHaveAttribute('srcset', /\/_next\/image/);
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
  const requiredWidth = await hero.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return Math.min(1920, Math.ceil(Math.max(box.width, (box.height * 16) / 9) * devicePixelRatio));
  });
  const src = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
  expect(Number(new URL(src).searchParams.get('w'))).toBeGreaterThanOrEqual(requiredWidth);
});

test('product imagery uses working responsive optimized renditions', async ({ page }) => {
  await page.goto('/products/preview-featherweight-crewneck');
  const image = page.getByRole('main').locator('img').first();
  await expect(image).toHaveAttribute('srcset', /\/_next\/image/);
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
  const src = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
  expect(new URL(src).pathname).toBe('/_next/image');
  const response = await page.request.get(src);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\//);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`catalog and product detail remain usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/new');
    await expect(page.getByRole('heading', { name: 'NEW', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('link', { name: /Featherweight Crewneck Sweater/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Featherweight Crewneck Sweater' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const sizeGuide = page.getByRole('button', { name: 'SIZE GUIDE' });
    await sizeGuide.click();
    const dialog = page.getByRole('dialog', { name: 'Size Guide' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('ESQUE PLACEHOLDER — MEASUREMENTS')).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    await dialog.getByRole('button', { name: 'CLOSE' }).press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(sizeGuide).toBeFocused();
    await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeDisabled();
    await page.getByRole('radio', { name: 'M', exact: true }).press('Space');
    await page.getByRole('radio', { name: 'Black', exact: true }).press('Space');
    await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeEnabled();
  });
}

test('sold-out product communicates availability without an active purchase action', async ({
  page,
}) => {
  await page.goto('/products/preview-relaxed-linen-trouser');
  await expect(page.getByRole('heading', { name: 'Relaxed Linen Trouser' })).toBeVisible();
  await expect(page.getByText('NO LONGER AVAILABLE.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ADD TO WISHLIST', exact: true })).toBeEnabled();
});

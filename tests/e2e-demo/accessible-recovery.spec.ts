import { expect, test, type Locator } from '@playwright/test';

const productPath = '/products/preview-featherweight-crewneck';
const productTitle = 'Featherweight Crewneck Sweater';

async function expectInside(control: Locator, viewport: Locator) {
  const bounds = await viewport.boundingBox();
  const button = await control.boundingBox();
  expect(bounds).not.toBeNull();
  expect(button).not.toBeNull();
  expect(button!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(button!.y).toBeGreaterThanOrEqual(bounds!.y);
  expect(button!.x + button!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  expect(button!.y + button!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height);
}

test('forced colors restores the native cursor before load and during a visit', async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(browserName !== 'chromium' || isMobile, 'Requires a fine pointer and forced colors.');
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.goto(productPath);
  await page.mouse.move(8, 300);
  await expect(page.locator('html')).not.toHaveClass(/esque-cursor-none/);
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none');
  await page.emulateMedia({ forcedColors: 'none' });
  let pointerStep = 0;
  await expect
    .poll(async () => {
      await page.mouse.move(10 + pointerStep++, 310);
      return page
        .locator('html')
        .evaluate((element) => element.classList.contains('esque-cursor-none'));
    })
    .toBe(true);
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none');
  await expect(page.locator('.esque-custom-cursor')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/esque-cursor-none/);
});

for (const imageIndex of [0, 1]) {
  test(`zoomed image ${imageIndex + 1} keeps failed recovery visible through retry and resize`, async ({
    page,
  }) => {
    await page.goto(productPath);
    const trigger = page.getByRole('link', {
      name: `Enlarge ${productTitle}, image ${imageIndex + 1} of 3`,
    });
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: `${productTitle} image viewer` });
    await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
    await expect(dialog.getByRole('img')).toHaveAttribute('aria-busy', 'false');
    await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click();
    const viewport = dialog.getByRole('region', { name: 'Product image', exact: true });
    await viewport.evaluate((element) => element.scrollTo(300, 600));
    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    // Dispatch the browser image error after zoom. Both ordinary media and
    // Demo's cropped detail use the same real image error handler.
    await dialog.getByRole('img').dispatchEvent('error');
    const retry = dialog.getByRole('button', { name: 'Retry image', exact: true });
    await expectInside(retry, viewport);
    await page.setViewportSize({ width: 390, height: 700 });
    await expectInside(retry, viewport);
    await retry.click();
    await expect(viewport).toBeFocused();
    await dialog.getByRole('img').dispatchEvent('error');
    await expectInside(retry, viewport);
    await retry.click();
    await dialog.getByRole('img').dispatchEvent('load');
    await expect(retry).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
  });
}

for (const moveFocus of [false, true]) {
  test(`service failure ${moveFocus ? 'respects deliberate focus movement' : 'focuses useful recovery'}`, async ({
    page,
  }) => {
    await page.goto('/access');
    let release = () => {};
    let submitted = false;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/access', async (route) => {
      if (route.request().method() === 'POST') {
        submitted = true;
        await held;
      }
      await route.continue();
    });
    try {
      const email = page.getByLabel('EMAIL', { exact: true });
      await email.fill('synthetic@example.com');
      await page.locator('input[name="consent"]').check();
      await page.getByLabel('Preview outcome').selectOption('unavailable');
      const submit = page.getByRole('button', { name: 'REQUEST ACCESS', exact: true });
      await submit.press('Enter');
      await expect.poll(() => submitted).toBe(true);
      if (moveFocus) await email.focus();
      release();
      const error = page.locator('#request-access-error');
      await expect(error).toContainText('preview request failed');
      if (moveFocus) await expect(email).toBeFocused();
      else {
        await expect(error).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByLabel('Preview outcome')).toBeFocused();
      }
      await expect(email).toHaveValue('synthetic@example.com');
      await expect(page.locator('input[name="consent"]')).toBeChecked();
    } finally {
      release();
    }
  });
}

test('native dialogs lock background scrolling and restore it after closing', async ({
  page,
  browserName,
  isMobile,
}) => {
  await page.goto(productPath);
  await page.getByRole('button', { name: 'Size Guide', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Size Guide', exact: true });
  await expect(dialog).toBeVisible();
  const position = await page.evaluate(() => window.scrollY);
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
  await page.mouse.move(15, 100);
  if (browserName === 'webkit' && isMobile) await page.keyboard.press('PageDown');
  else await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(position);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(position);
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
  if (browserName === 'webkit' && isMobile) await page.keyboard.press('PageDown');
  else await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(position);
});

test('Shop the Look locks the background and releases it when closed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const trigger = page
    .getByRole('list', { name: 'All looks' })
    .getByRole('button', { name: /^LOOK 02,/ });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Shop the Look', exact: true });
  await expect(dialog).toBeVisible();
  const position = await page.evaluate(() => window.scrollY);
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(position);
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
});

for (const name of ['Menu', 'Search'] as const) {
  test(`${name} locks the page while its long content remains scrollable`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 390 });
    await page.goto(productPath);
    await page
      .getByRole('banner')
      .getByRole('button', { name: name.toUpperCase(), exact: true })
      .click();
    const overlay = page.getByRole('dialog', { name, exact: true });
    if (name === 'Search') await overlay.getByRole('searchbox').fill('sweater');
    else await overlay.getByRole('button', { name: 'TOPS subcategories', exact: true }).click();
    await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
    await expect
      .poll(() => overlay.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);
    await overlay.evaluate((element) => element.scrollTo(0, 300));
    await expect.poll(() => overlay.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
  });
}

test('closing nested Quick Add keeps Search locked until Search closes', async ({ page }) => {
  await page.goto(productPath);
  await page.getByRole('banner').getByRole('button', { name: 'SEARCH', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Search', exact: true });
  await search.getByRole('searchbox').fill('sweater');
  const trigger = search.getByRole('button', { name: 'QUICK ADD', exact: true }).first();
  await trigger.focus();
  await trigger.press('Enter');
  const quickAdd = page.getByRole('dialog', { name: /Quick add/i });
  await expect(quickAdd).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
  await page.keyboard.press('Escape');
  await expect(quickAdd).toBeHidden();
  await expect(search).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
  await search.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
});

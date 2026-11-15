import { expect, test, type Page } from '@playwright/test';

test('pointer-opened Quick Add returns focus to its product control', async ({
  page,
  isMobile,
}) => {
  await page.goto('/new');
  const trigger = page.getByRole('button', { name: 'QUICK ADD', exact: true }).first();
  if (isMobile) await trigger.tap();
  else {
    await trigger.locator('..').hover();
    await trigger.click();
  }
  const dialog = page.getByRole('dialog', { name: /^Quick Add/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('pointer-opened look returns focus to its look control', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const grid = page.getByRole('list', { name: 'All looks' });
  await expect(grid).toBeVisible();
  const trigger = grid.getByRole('button', { name: /^LOOK 02,/ });
  if (isMobile) await trigger.tap();
  else await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Shop the Look' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

async function openOverlay(page: Page, name: 'Menu' | 'Search') {
  const dialog = page.getByRole('dialog', { name, exact: true });
  await page.getByRole('button', { name: name.toUpperCase(), exact: true }).click();
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openSearchQuickAdd(page: Page) {
  await page.goto('/about');
  const search = await openOverlay(page, 'Search');
  await search.getByRole('searchbox').fill('crewneck');
  const trigger = search.getByRole('button', { name: 'QUICK ADD', exact: true }).first();
  await expect(trigger).toBeAttached();
  await trigger.focus();
  await trigger.press('Enter');
  const quickAdd = page.getByRole('dialog', { name: /^Quick Add/ });
  await expect(quickAdd).toBeVisible();
  await expect(quickAdd.getByRole('group', { name: 'Size', exact: true })).toBeVisible();
  return { search, quickAdd, trigger };
}

for (const { width, height } of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`menu CLOSE is reachable and restores focus at ${width}px`, async ({ page, isMobile }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/about');
    const menu = await openOverlay(page, 'Menu');
    const close = menu.getByRole('button', { name: 'CLOSE', exact: true });
    await expect(close).toBeVisible();
    await expect(close).toBeInViewport();
    const bounds = await close.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    if (isMobile) await close.tap();
    else await close.click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'MENU', exact: true })).toBeFocused();

    await openOverlay(page, 'Menu');
    await expect(menu.getByRole('link', { name: 'NEW', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'MENU', exact: true })).toBeFocused();
  });
}

test('Quick Add owns Escape and Tab while Search remains open', async ({ page }) => {
  const { search, quickAdd, trigger } = await openSearchQuickAdd(page);
  const childClose = quickAdd.getByRole('button', { name: 'CLOSE', exact: true });
  await childClose.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(
    search.getByRole('button', { name: 'CLOSE', exact: true }).first(),
  ).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expect(childClose).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(quickAdd).toBeHidden();
  await expect(search).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(search).toBeHidden();
  await expect(page.getByRole('button', { name: 'SEARCH', exact: true })).toBeFocused();
});

test('Search cycles focus past a previously opened and closed Quick Add', async ({ page }) => {
  const { search, quickAdd, trigger } = await openSearchQuickAdd(page);
  await quickAdd.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(quickAdd).toBeHidden();
  await expect(trigger).toBeFocused();

  const close = search.getByRole('button', { name: 'CLOSE', exact: true });
  const lastTrigger = search.getByRole('button', { name: 'QUICK ADD', exact: true }).last();
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(lastTrigger).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(search.getByRole('searchbox')).toBeFocused();
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`menu and Search hover text remains readable with ${reducedMotion} motion`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Hover requires a desktop fine pointer');
    await page.emulateMedia({ reducedMotion });
    await page.goto('/about');
    const menu = await openOverlay(page, 'Menu');
    const tops = menu.getByRole('link', { name: 'TOPS', exact: true });
    await tops.hover();
    await expect(tops).toHaveCSS('color', 'rgb(165, 165, 160)');
    await page.keyboard.press('Tab');
    await tops.focus();
    await expect(tops).toHaveCSS('outline-style', 'solid');
    const submenu = menu.getByRole('link', { name: 'Hoodies', exact: true });
    await submenu.hover();
    await expect(submenu).toHaveCSS('color', 'rgb(165, 165, 160)');
    await menu.getByRole('button', { name: 'CLOSE', exact: true }).click();
    const search = await openOverlay(page, 'Search');
    await search.getByRole('searchbox').fill('hoodie');
    const category = search.getByRole('link', { name: 'TOPS / Hoodies' });
    await category.hover();
    await expect(category).toHaveCSS('color', 'rgb(165, 165, 160)');
    await search.getByRole('searchbox').fill('collection');
    const collection = search.getByRole('link', { name: 'Collection 001', exact: true });
    await collection.hover();
    await expect(collection).toHaveCSS('color', 'rgb(165, 165, 160)');
    await page.keyboard.press('Tab');
    await collection.focus();
    await expect(collection).toHaveCSS('outline-style', 'solid');
    await expect(search).toHaveCSS('background-color', 'rgb(5, 5, 5)');
  });
}

test('live reduced motion restores the native cursor until another real pointer move', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Custom cursor requires a fine pointer');
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/about');
  let pointerStep = 0;
  await expect
    .poll(async () => {
      await page.mouse.move(100 + pointerStep++, 200);
      return page
        .locator('html')
        .evaluate((element) => element.classList.contains('esque-cursor-none'));
    })
    .toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/esque-cursor-none/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).not.toHaveClass(/esque-cursor-none/);
  await expect
    .poll(async () => {
      await page.mouse.move(120 + pointerStep++, 220);
      return page
        .locator('html')
        .evaluate((element) => element.classList.contains('esque-cursor-none'));
    })
    .toBe(true);
});

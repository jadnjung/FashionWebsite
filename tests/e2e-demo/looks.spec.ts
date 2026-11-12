import { test, expect, type Page } from '@playwright/test';

// Homepage "Shop the Look" ring (DECISIONS.md D-091) against Demo Mode's
// nine fixture looks.

async function gotoLooks(page: Page) {
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Shop the Look' });
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('button', { name: /^LOOK \d\d,/ })).toHaveCount(9, {
    timeout: 30_000,
  });
  return section;
}

test.describe('Shop the Look ring (Demo Mode)', () => {
  test('shows nine looks on a rotating ring with its controls', async ({ page }) => {
    const section = await gotoLooks(page);
    await expect(section.getByText('09 LOOKS')).toBeVisible();
    await expect(section.getByRole('group', { name: 'Looks' })).toBeVisible();
    for (const name of ['← PREV', 'PAUSE', 'NEXT →', 'VIEW ALL LOOKS']) {
      await expect(section.getByRole('button', { name })).toBeVisible();
    }
  });

  test('NEXT and PREV bring a different look to the front and announce it', async ({ page }) => {
    const section = await gotoLooks(page);
    // Stop the auto-rotation so only the buttons move the ring.
    await section.getByRole('button', { name: 'PAUSE' }).click();
    await expect(section.getByRole('button', { name: 'PLAY' })).toBeVisible();

    await section.getByRole('button', { name: 'NEXT →' }).click();
    const announcement = section.locator('[aria-live="polite"]');
    await expect(announcement).toHaveText(/^LOOK \d\d in front\.$/);
    const afterNext = await announcement.textContent();

    await section.getByRole('button', { name: '← PREV' }).click();
    await expect(announcement).not.toHaveText(afterNext ?? '');
  });

  test('VIEW ALL LOOKS shows every look in a grid and toggles back', async ({ page }) => {
    const section = await gotoLooks(page);
    await section.getByRole('button', { name: 'VIEW ALL LOOKS' }).click();
    const grid = section.getByRole('list', { name: 'All looks' });
    await expect(grid.getByRole('listitem')).toHaveCount(9);
    await expect(section.getByRole('group', { name: 'Looks' })).toHaveCount(0);

    await section.getByRole('button', { name: 'VIEW ROTATION' }).click();
    await expect(section.getByRole('group', { name: 'Looks' })).toBeVisible();
  });

  test("choosing a look opens Shop the Look with that look's pieces; Escape closes it", async ({
    page,
  }) => {
    const section = await gotoLooks(page);
    await section.getByRole('button', { name: 'VIEW ALL LOOKS' }).click();
    await section.getByRole('button', { name: /^LOOK 04, 3 pieces$/ }).click();

    const dialog = page.getByRole('dialog', { name: 'Shop the Look' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('LOOK 04')).toBeVisible();
    await expect(dialog.getByRole('checkbox')).toHaveCount(3);
    await expect(dialog.getByText('Velvet Evening Jacket')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('reduced motion starts on the still grid', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const section = await gotoLooks(page);
    await expect(section.getByRole('list', { name: 'All looks' })).toBeVisible();
    await expect(section.getByRole('button', { name: 'VIEW ROTATION' })).toBeVisible();
  });

  test('loads with no uncaught page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await gotoLooks(page);
    expect(errors).toEqual([]);
  });
});

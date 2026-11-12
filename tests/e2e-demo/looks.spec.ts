import { test, expect, type Page } from '@playwright/test';

// Homepage "Shop the Look" ring (DECISIONS.md D-091) against Demo Mode's
// nine fixture looks.

/** aria-label of the look currently drawn largest (nearest the front). */
function frontLook(page: Page) {
  return page.evaluate(() => {
    let best: string | null = null;
    let width = 0;
    for (const card of document.querySelectorAll('[role="group"][aria-label="Looks"] button')) {
      const rect = card.getBoundingClientRect();
      if (rect.width > width) {
        width = rect.width;
        best = card.getAttribute('aria-label');
      }
    }
    return best;
  });
}

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

  test('keeps rotating while the cursor rests on the ring', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover is a desktop concern');
    test.slow();
    const section = await gotoLooks(page);
    const stage = section.getByRole('group', { name: 'Looks' });
    await stage.hover();
    const before = await frontLook(page);
    // About 6 s per look; allow a little over one step.
    await expect.poll(() => frontLook(page), { timeout: 15_000 }).not.toBe(before);
  });

  test("the chosen look's photograph comes forward inside its panel", async ({ page }) => {
    const section = await gotoLooks(page);
    await section.getByRole('button', { name: 'VIEW ALL LOOKS' }).click();
    await section.getByRole('button', { name: /^LOOK 02,/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Shop the Look' });
    await expect(dialog.locator('img')).toHaveCount(1);
    await expect(dialog.locator('img')).toBeVisible();
  });

  test('the cursor stays visible over the Shop the Look panel', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the custom cursor is desktop-only');
    const section = await gotoLooks(page);
    // The custom cursor only takes over after a real pointer move.
    for (let i = 0; i < 4; i++) await page.mouse.move(40 + i, 40 + i);
    await section.getByRole('button', { name: 'VIEW ALL LOOKS' }).click();
    await section.getByRole('button', { name: /^LOOK 02,/ }).click();
    const close = page.getByRole('dialog', { name: 'Shop the Look' }).getByRole('button', {
      name: 'CLOSE',
    });
    await close.hover();
    // The OS cursor is back over the dialog (pointer over controls), and
    // the custom dot — drawn beneath the dialog's top layer — steps aside.
    await expect(close).toHaveCSS('cursor', 'pointer');
    await expect(page.locator('.esque-custom-cursor')).toHaveAttribute('data-hidden', 'true');
  });

  test('loads with no uncaught page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await gotoLooks(page);
    expect(errors).toEqual([]);
  });
});

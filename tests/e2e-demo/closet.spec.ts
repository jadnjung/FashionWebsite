import { test, expect, type Page } from '@playwright/test';

// Homepage Collection Closet (DECISIONS.md D-089) against Demo Mode's six
// Collection 001 fixtures. Drives the closet through its keyboard/screen-
// reader controls — the same state machine the 3D canvas's pointer events
// use — so assertions are on real DOM state, not pixels.

const PIECES = [
  'Featherweight Crewneck Sweater',
  'Tailored Wide-Leg Trouser Set',
  'Fluid Knit Long-Sleeve',
  'Silk Cami Layering Top',
  'Relaxed Linen Trouser',
  'Velvet Evening Jacket',
];

async function gotoReadyCloset(page: Page) {
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Collection Hero' });
  // The canvas fades in only once every garment has loaded — the closet's
  // own "ready" signal (needs WebGL, which headless Chromium provides).
  await expect(hero.locator('[data-closet] > [aria-hidden="true"]')).toHaveClass(/opacity-100/, {
    timeout: 30_000,
  });
  return hero;
}

test.describe('Collection Closet (Demo Mode)', () => {
  test('hangs every piece of the current collection, each with an accessible button', async ({
    page,
  }) => {
    const hero = await gotoReadyCloset(page);
    await expect(hero.locator('canvas')).toHaveCount(1);
    for (const name of PIECES) {
      await expect(hero.getByRole('button', { name: new RegExp(`^${name}, \\$`) })).toHaveCount(1);
    }
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeVisible();
  });

  test('keyboard: Enter pulls a piece out with its details; Escape returns it and restores focus', async ({
    page,
  }) => {
    const hero = await gotoReadyCloset(page);
    const closet = hero.locator('[data-closet]');
    const button = hero.getByRole('button', { name: /^Velvet Evening Jacket, \$/ });

    await button.focus();
    await page.keyboard.press('Enter');

    await expect(closet).toHaveAttribute('data-closet-selected', 'true');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(hero.getByRole('heading', { name: 'Velvet Evening Jacket' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'VIEW PRODUCT' })).toHaveAttribute(
      'href',
      '/products/preview-velvet-evening-jacket',
    );
    // The headline and ENTER COLLECTION step aside (and leave the tab order).
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(closet).toHaveAttribute('data-closet-selected', 'false');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toBeFocused();
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeVisible();
  });

  test('the info panel announces the selection and CLOSE returns the piece', async ({ page }) => {
    const hero = await gotoReadyCloset(page);
    const panel = hero.locator('[data-closet-panel]');
    await expect(panel).toHaveAttribute('aria-live', 'polite');
    await expect(panel).toBeEmpty();

    await hero.getByRole('button', { name: /^Silk Cami Layering Top, \$/ }).focus();
    await page.keyboard.press('Enter');
    await expect(panel).toContainText('Silk Cami Layering Top');
    await expect(panel).toContainText('$84.00');

    await panel.getByRole('button', { name: 'CLOSE' }).click();
    await expect(hero.locator('[data-closet]')).toHaveAttribute('data-closet-selected', 'false');
    await expect(panel).toBeEmpty();
  });

  test('works under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const hero = await gotoReadyCloset(page);
    await hero.getByRole('button', { name: /^Fluid Knit Long-Sleeve, \$/ }).focus();
    await page.keyboard.press('Enter');
    await expect(hero.getByRole('heading', { name: 'Fluid Knit Long-Sleeve' })).toBeVisible();
  });

  test('loads with no uncaught page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await gotoReadyCloset(page);
    expect(errors).toEqual([]);
  });
});

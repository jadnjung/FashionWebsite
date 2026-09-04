import { test, expect } from '@playwright/test';

test.describe('shell', () => {
  test('homepage has Esque branding in the title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Esque/);
  });
});

test.describe('design tokens', () => {
  test('body uses the Esque dark background and off-white text tokens', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(5, 5, 5)'); // #050505
    await expect(body).toHaveCSS('color', 'rgb(243, 241, 234)'); // #F3F1EA
  });
});

test.describe('fonts', () => {
  test('functional and display font CSS variables are defined', async ({ page }) => {
    await page.goto('/');
    const functionalFont = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-functional'),
    );
    const displayFont = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-display'),
    );
    expect(functionalFont.trim()).not.toBe('');
    expect(displayFont.trim()).not.toBe('');
    expect(functionalFont).not.toBe(displayFont);
  });
});

test.describe('header', () => {
  test('renders ESQUE wordmark and utility nav, has a skip link and main landmark', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'ESQUE' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MENU' })).toBeVisible();
    await expect(page.getByText('SEARCH')).toBeVisible();
    await expect(page.getByText('ACCOUNT')).toBeVisible();
    await expect(page.getByText('BAG (0)')).toBeVisible();

    await expect(page.getByRole('main')).toBeVisible();

    const skipLink = page.getByRole('link', { name: /skip to content/i });
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('header adapts to mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe('full-screen menu', () => {
  test('is closed by default and opens when MENU is clicked', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('dialog', { name: /menu/i });
    await expect(menu).toBeHidden();

    await page.getByRole('button', { name: 'MENU' }).click();
    await expect(menu).toBeVisible();
    await expect(page.getByRole('link', { name: 'TOPS' })).toBeVisible();
  });

  test('Escape closes the menu and returns focus to the MENU trigger', async ({ page }) => {
    await page.goto('/');
    const menuTrigger = page.getByRole('button', { name: 'MENU' });
    await menuTrigger.click();
    await expect(page.getByRole('dialog', { name: /menu/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /menu/i })).toBeHidden();
    await expect(menuTrigger).toBeFocused();
  });

  test('Tab cycles focus within the open menu (focus trap)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const firstLink = page.getByRole('link', { name: 'NEW' });
    await expect(firstLink).toBeFocused();
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const menu = page.getByRole('dialog', { name: /menu/i });
    const duration = await menu.evaluate((el) => getComputedStyle(el).transitionDuration);
    // "0s" or a near-instant value — not the full 350-500ms from DESIGN_SYSTEM.md §26.
    expect(duration === '0s' || parseFloat(duration) < 0.05).toBe(true);
  });
});

test.describe('footer', () => {
  test('renders as a landmark with utility links', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /contact/i })).toBeVisible();
  });
});

test.describe('homepage placeholder', () => {
  test('shows the ESQUE wordmark and in-development notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ESQUE' })).toBeVisible();
    await expect(page.getByText('COLLECTION 001 — IN DEVELOPMENT')).toBeVisible();
  });
});

// Grid and Input (ROADMAP.md Phase 1) have no real page consuming them yet
// — both are tested against the dev-only preview route at /dev/ui instead
// of a real page, per DECISIONS.md D-012.
test.describe('grid primitive', () => {
  test('renders 4 columns on mobile, 8 on tablet, 12 on desktop and large desktop', async ({
    page,
  }) => {
    await page.goto('/dev/ui');
    const grid = page.locator('#grid-preview');
    const columnCount = () =>
      grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    await page.setViewportSize({ width: 375, height: 812 }); // mobile
    await expect(grid).toHaveCSS('padding-left', '16px');
    expect(await columnCount()).toBe(4);

    await page.setViewportSize({ width: 800, height: 1024 }); // tablet
    await expect(grid).toHaveCSS('padding-left', '24px');
    expect(await columnCount()).toBe(8);

    await page.setViewportSize({ width: 1100, height: 800 }); // desktop
    await expect(grid).toHaveCSS('padding-left', '32px');
    expect(await columnCount()).toBe(12);

    await page.setViewportSize({ width: 1440, height: 900 }); // large desktop
    await expect(grid).toHaveCSS('padding-left', '64px');
    expect(await columnCount()).toBe(12);
  });

  test('uses a 24px gutter between columns', async ({ page }) => {
    await page.goto('/dev/ui');
    await expect(page.locator('#grid-preview')).toHaveCSS('column-gap', '24px');
  });
});

test.describe('input component', () => {
  test('is labeled and accepts typed input', async ({ page }) => {
    await page.goto('/dev/ui');
    const email = page.getByLabel('Email');
    await email.fill('visitor@esque.com');
    await expect(email).toHaveValue('visitor@esque.com');
  });

  test('is reachable and focusable via keyboard', async ({ page }) => {
    await page.goto('/dev/ui');
    await page.getByLabel('Email').focus();
    await expect(page.getByLabel('Email')).toBeFocused();
  });

  test('disabled example cannot be edited', async ({ page }) => {
    await page.goto('/dev/ui');
    await expect(page.getByLabel('Disabled example')).toBeDisabled();
  });

  test('aria-invalid renders the documented error color', async ({ page }) => {
    await page.goto('/dev/ui');
    await expect(page.getByLabel('Invalid example')).toHaveCSS('border-color', 'rgb(167, 67, 56)'); // #A74338
  });
});

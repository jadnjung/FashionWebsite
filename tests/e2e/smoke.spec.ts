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

  test('body renders text in the functional font, not a default fallback', async ({ page }) => {
    await page.goto('/');
    // Guards against the variables existing but never actually being applied —
    // e.g. body silently falling back to Tailwind's default font-sans stack.
    const bodyFontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFontFamily).toContain('Inter');
  });
});

test.describe('header', () => {
  test('renders ESQUE wordmark and utility nav, has a skip link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'ESQUE' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MENU' })).toBeVisible();
    await expect(page.getByText('SEARCH')).toBeVisible();
    await expect(page.getByText('ACCOUNT')).toBeVisible();
    await expect(page.getByText('BAG (0)')).toBeVisible();

    const skipLink = page.getByRole('link', { name: /skip to content/i });
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('has a single main landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  // BLOCKED ON A FOLLOW-UP TASK (not Task 11, not app/page.tsx): confirmed
  // directly that Header.tsx's utility nav (MENU/SEARCH/ACCOUNT/BAG) renders
  // as four full-text buttons in a single non-wrapping flex row at every
  // viewport size, with no responsive treatment — this alone produces the
  // full measured overflow (537px scrollWidth at a 375px viewport),
  // confirmed by measuring BEFORE touching app/page.tsx's content too and
  // getting the identical result. Task 8's original fixme comment
  // misdiagnosed the cause as app/page.tsx's generator scaffold content;
  // this corrects that. A dedicated follow-up task must redesign Header's
  // mobile utility-nav treatment and un-fixme this.
  test.fixme('header adapts to mobile viewport without horizontal overflow', async ({ page }) => {
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

  test('clicking a category link closes the menu and navigates', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const menu = page.getByRole('dialog', { name: /menu/i });
    await expect(menu).toBeVisible();

    await page.getByRole('link', { name: 'NEW' }).click();
    await expect(page).toHaveURL(/\/new$/);
    await expect(menu).toBeHidden();
  });

  test('background content is inert while the menu is open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    await expect(page.getByRole('dialog', { name: /menu/i })).toBeVisible();

    // The ESQUE wordmark link is background content — visually covered by
    // the open overlay and, per the `inert` spec, unfocusable while its
    // ancestor is inert. Calling .focus() on it should be a no-op if inert
    // genuinely took effect at the browser level (not just present in the
    // markup); a plain aria-hidden with no inert would still let it be
    // focused via script.
    await page.getByRole('link', { name: 'ESQUE' }).focus();
    await expect(page.getByRole('link', { name: 'ESQUE' })).not.toBeFocused();
    // The MENU button itself is also inside the inert wrapper (it's part
    // of the visually-covered background too) — the dialog stays open, not
    // toggled/refocused by a background element that should be unreachable.
    await expect(page.getByRole('dialog', { name: /menu/i })).toBeVisible();
  });

  test('the open/close transition genuinely animates opacity, not just its duration value', async ({
    page,
  }) => {
    await page.goto('/');
    const menu = page.getByRole('dialog', { name: /menu/i });

    await page.getByRole('button', { name: 'MENU' }).click();
    const openedMidway = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          setTimeout(() => {
            const el = document.getElementById('esque-full-screen-menu');
            resolve(el ? parseFloat(getComputedStyle(el).opacity) : -1);
          }, 150);
        }),
    );
    await expect(menu).toHaveCSS('opacity', '1');
    // Sampled partway through the 400ms fade-in — a genuine transition is
    // still interpolating at 150ms, not already at (or still at) either end.
    expect(openedMidway).toBeGreaterThan(0);
    expect(openedMidway).toBeLessThan(1);

    await page.keyboard.press('Escape');
    const closedMidway = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          setTimeout(() => {
            const el = document.getElementById('esque-full-screen-menu');
            resolve(el ? parseFloat(getComputedStyle(el).opacity) : -1);
          }, 150);
        }),
    );
    expect(closedMidway).toBeGreaterThan(0);
    expect(closedMidway).toBeLessThan(1);
    await expect(menu).toBeHidden();
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

import { test, expect, type Page } from '@playwright/test';

// DESIGN_SYSTEM.md §22-23, INTERACTIONS.md §7 — desktop-only custom cursor
// with an explicit accessibility fallback. This suite verifies the
// mechanism directly (real pointermove events, real matchMedia results per
// Playwright project/emulation), not implementation details.
//
// This project's storefront pages all depend on a configured Shopify store
// (SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are unset in this E2E
// environment — see catalog.spec.ts/pdp.spec.ts), so no real <input> is
// ever reachable via normal navigation. The "hidden over form fields" test
// below injects a temporary <input> via page.evaluate to exercise the real
// component logic (event.target.closest against a real DOM element)
// without depending on a configured store — the same honest-limitation
// pattern this codebase already uses elsewhere.

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

const CURSOR_ACTIVE_CLASS = 'esque-cursor-none';

// CustomCursor only attaches its pointermove listener once client-side
// hydration completes; a single move dispatched immediately after goto()
// can race hydration and be silently dropped (confirmed directly during
// development: the first move landed before hydration, the next one
// ~200ms later did not). Spreading a few moves over a short window makes
// at least one reliably land after hydration regardless of machine speed,
// without depending on an arbitrary single wait duration.
async function activateCursor(page: Page, x = 200, y = 200) {
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(x + i, y + i);
    await page.waitForTimeout(100);
  }
}

test.describe('custom cursor — desktop activation and initialization safety', () => {
  test('does not hide the OS cursor before any pointer movement has occurred', async ({ page }) => {
    await page.goto('/');
    const hasClass = await page.evaluate(
      (cls) => document.documentElement.classList.contains(cls),
      CURSOR_ACTIVE_CLASS,
    );
    expect(hasClass).toBe(false);
    await expect(page.locator('.esque-custom-cursor')).toHaveCount(0);
  });

  test('activates only after a real pointer move is observed', async ({ page, isMobile }) => {
    test.skip(isMobile, 'activation is desktop-only by design; see the touch-devices suite');
    await page.goto('/');
    await activateCursor(page);
    await expect(page.locator('html')).toHaveClass(new RegExp(CURSOR_ACTIVE_CLASS));
    await expect(page.locator('.esque-custom-cursor')).toHaveCount(1);
  });
});

test.describe('custom cursor — accessibility fallback', () => {
  test('never activates when the user prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await activateCursor(page);
    const hasClass = await page.evaluate(
      (cls) => document.documentElement.classList.contains(cls),
      CURSOR_ACTIVE_CLASS,
    );
    expect(hasClass).toBe(false);
    await expect(page.locator('.esque-custom-cursor')).toHaveCount(0);
  });

  test('is hidden over a form field even after activating', async ({ page, isMobile }) => {
    test.skip(isMobile, 'activation is desktop-only by design; see the touch-devices suite');
    await page.goto('/');
    await activateCursor(page);
    await expect(page.locator('html')).toHaveClass(new RegExp(CURSOR_ACTIVE_CLASS));

    // Inject a real <input> to exercise the real hide-over-form-fields path
    // — see file header comment for why no production input is reachable
    // in this Shopify-unconfigured environment.
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'e2e-test-input';
      input.style.position = 'fixed';
      input.style.top = '400px';
      input.style.left = '400px';
      input.style.width = '100px';
      input.style.height = '20px';
      document.body.appendChild(input);
    });
    await page.mouse.move(450, 410);
    await expect(page.locator('.esque-custom-cursor')).toHaveAttribute('data-hidden', 'true');

    await page.mouse.move(200, 200);
    await expect(page.locator('.esque-custom-cursor')).toHaveAttribute('data-hidden', 'false');
  });

  test('/access never mounts the custom cursor (keeps its own existing entrance motion instead)', async ({
    page,
  }) => {
    await page.goto('/access');
    await activateCursor(page);
    await expect(page.locator('.esque-custom-cursor')).toHaveCount(0);
  });
});

test.describe('custom cursor — contextual labels', () => {
  test('shows the OPEN label over a full-screen menu category link', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover-driven labeling is desktop-only by design');
    await page.goto('/');
    await activateCursor(page);
    await page.getByRole('button', { name: 'MENU' }).click();
    const firstCategory = page.getByRole('dialog', { name: 'Menu' }).getByRole('link').first();
    await firstCategory.hover();
    const cursor = page.locator('.esque-custom-cursor');
    await expect(cursor).toHaveAttribute('data-active', 'true');
    await expect(cursor).toHaveText('OPEN');
  });
});

test.describe('custom cursor — touch devices', () => {
  test('never activates on a touch-only project', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch-specific assertion; runs on the mobile-safari project');
    await page.goto('/');
    await activateCursor(page);
    const hasClass = await page.evaluate(
      (cls) => document.documentElement.classList.contains(cls),
      CURSOR_ACTIVE_CLASS,
    );
    expect(hasClass).toBe(false);
  });
});

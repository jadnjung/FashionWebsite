import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  // The proxy (proxy.ts) now redirects any ungated request to /access.
  // This suite exercises the storefront shell itself (Header, FullScreenMenu,
  // Footer, homepage) — not the gate, which has its own dedicated coverage
  // in access-gate.spec.ts — so every test here starts as an already-granted
  // returning visitor, exactly like access-gate.spec.ts's own tests prove
  // that state is reachable in the first place.
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

test.describe('shell', () => {
  test('homepage has Esque branding in the title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Esque/);
  });

  test('homepage loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
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

  // Fixed by Task 11.5: Header.tsx's utility nav (MENU/SEARCH/ACCOUNT/BAG)
  // previously rendered as four full-text buttons in a single non-wrapping
  // flex row at every viewport size, producing the full measured overflow
  // (537px scrollWidth at a 375px viewport). Below `md`, SEARCH/ACCOUNT now
  // compress to icon-only controls (real accessible names retained via
  // visually-hidden text) and MENU/BAG get tighter padding — see
  // components/navigation/Header.tsx and DECISIONS.md for the approach.
  test('header adapts to mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Bag stays visible and reachable at mobile widths, with its count indicator', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // PROJECT.md §73: Bag state must remain immediately accessible — not
    // compressed to icon-only or hidden behind a second tap, unlike
    // SEARCH/ACCOUNT below.
    await expect(page.getByRole('button', { name: 'BAG (0)' })).toBeVisible();
  });

  test('SEARCH and ACCOUNT compress to icon-only controls at mobile widths but keep real accessible names', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const search = page.getByRole('button', { name: 'SEARCH' });
    const account = page.getByRole('button', { name: 'ACCOUNT' });
    await expect(search).toBeVisible();
    await expect(account).toBeVisible();

    // The visible label collapses to an icon below `md` — assert the icon
    // is what's actually on screen. The text label stays in the a11y tree
    // (that's what makes `name: 'SEARCH'`/`'ACCOUNT'` above resolve at all)
    // but is visually clipped to a 1x1px box by the sr-only technique, so
    // `toBeVisible()` alone can't distinguish "on screen" from "sr-only" —
    // assert its rendered size directly instead.
    await expect(search.locator('svg')).toBeVisible();
    await expect(account.locator('svg')).toBeVisible();
    const searchLabelBox = await search.locator('span').boundingBox();
    const accountLabelBox = await account.locator('span').boundingBox();
    expect(searchLabelBox?.width).toBeLessThanOrEqual(1);
    expect(accountLabelBox?.width).toBeLessThanOrEqual(1);
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
    const lastLink = page.getByRole('link', { name: 'ABOUT' });
    await expect(firstLink).toBeFocused();

    // Forward: Tab through every category link, ending back on the first —
    // exercises the actual wrap-forward branch of handleKeyDown, not just
    // the initial-focus-on-open behavior.
    for (const name of ['TOPS', 'BOTTOMS', 'ETC.', 'COLLECTIONS', 'ABOUT']) {
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name })).toBeFocused();
    }
    await expect(lastLink).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(firstLink).toBeFocused();

    // Backward: Shift+Tab from the first link wraps to the last link.
    await page.keyboard.press('Shift+Tab');
    await expect(lastLink).toBeFocused();
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // The delayed-visibility technique (app/globals.css) needs its
    // transition-delay zeroed under reduced motion — otherwise the closed
    // state's visibility switch would still wait out its full un-reduced
    // delay even though the opacity fade itself is instant. This must be
    // checked on the CLOSED menu (its state on initial load, before ever
    // opening it), not the open one: the open state's own authored CSS
    // already declares 0 delay on both transitioned properties regardless
    // of reduced motion, so sampling it can never fail even if this
    // override were deleted outright — there's nothing non-zero there to
    // suppress. Only the closed state has a real non-zero delay (280ms on
    // `visibility`) to prove is actually being zeroed. `#esque-full-screen-menu`
    // (a plain DOM id selector) is used instead of the role-based `dialog`
    // locator because the closed menu is `visibility: hidden`, which
    // Playwright's accessibility-aware role queries may not resolve.
    const closedDelay = await page
      .locator('#esque-full-screen-menu')
      .evaluate((el) => getComputedStyle(el).transitionDelay);
    // transitionDelay is a comma-separated list, one entry per transitioned
    // property ("<opacity-delay>, <visibility-delay>"). Checking only the
    // first entry — as a single parseFloat() on the whole string would —
    // can never catch a regression here: opacity's own delay is 0s by
    // default regardless of this override, so only the second (visibility)
    // entry ever carries a real non-zero value to prove is being
    // suppressed.
    for (const value of closedDelay.split(',')) {
      expect(parseFloat(value)).toBeLessThan(0.05);
    }

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

  // Regression: before ROADMAP.md Phase 4, every one of these hrefs 404'd
  // like every other category link did — this proves they now resolve to
  // real routes (tests/e2e/catalog.spec.ts covers what each route does once
  // there, including the Shopify-unconfigured error boundary). Each
  // iteration re-navigates to '/' first, rather than reusing one open-menu
  // session across all three: landing on a category route in this
  // Shopify-unconfigured environment throws up to the root app/error.tsx
  // boundary, which unmounts app/(storefront)/layout.tsx — Header and its
  // MENU button included — so a shared session would only survive the
  // first iteration before timing out waiting for a MENU button that's no
  // longer mounted.
  for (const [name, path] of [
    ['TOPS', '/tops'],
    ['BOTTOMS', '/bottoms'],
    ['ETC.', '/etc'],
  ] as const) {
    test(`${name} link navigates to a real page, not a 404`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'MENU' }).click();
      await page.getByRole('link', { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      // Not a 404 — the branded not-found heading must not be present.
      await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toHaveCount(0);
    });
  }

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

test.describe('not-found', () => {
  test('visiting a nonexistent route shows the branded 404 with a way back to Esque', async ({
    page,
  }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ESQUE' })).toBeVisible();
  });

  // Regression: this page has no Header/Footer (the shell only wraps
  // app/(storefront)/**), so it must supply its own `<main>` landmark
  // rather than relying on ShellClient's — otherwise the page has no
  // landmark at all for screen-reader users.
  test('has a single main landmark', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('main')).toBeVisible();
  });

  // Regression: the ESQUE link intentionally carries no focus-visible
  // classes of its own (removed as a duplicate of the global a:focus-visible
  // rule in app/globals.css) — confirms that global rule is genuinely
  // applied, not merely assumed to cover it.
  test('the ESQUE link back to home still shows a visible focus ring', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    const homeLink = page.getByRole('link', { name: 'ESQUE' });
    await homeLink.focus();
    await expect(homeLink).toBeFocused();
    await expect(homeLink).toHaveCSS('outline-style', 'solid');
    await expect(homeLink).toHaveCSS('outline-color', 'rgb(243, 241, 234)'); // --color-esque-text
  });
});

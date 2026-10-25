import { test, expect } from '@playwright/test';

test.describe('shell', () => {
  test('homepage has Esque branding in the title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Esque/);
  });

  test('homepage loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      // The one expected exception: Selected Pieces' isolated Shopify fetch
      // (lib/home/selected-pieces.ts, DECISIONS.md D-033) deliberately
      // console.errors on failure so the failure stays operationally
      // visible — Next.js's dev server mirrors that server-side log into
      // the browser console too. SHOPIFY_STORE_DOMAIN/TOKEN are
      // intentionally unset in this E2E environment (playwright.config.ts),
      // so this exact, known message is expected every run here — the same
      // "Shopify Storefront API is not configured" condition catalog.spec.ts/
      // pdp.spec.ts already assert produces the error boundary on other
      // routes. Any other console error still fails this test.
      if (message.text().includes('Shopify Storefront API is not configured')) return;
      consoleErrors.push(message.text());
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
    // getByRole (accessible-name-based), not getByText: SearchOverlay
    // (always mounted, sibling to the header) now carries its own sr-only
    // "Search" label for its input, which getByText('SEARCH')'s
    // case-insensitive substring match would ambiguously also match.
    await expect(page.getByRole('button', { name: 'SEARCH' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ACCOUNT' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'BAG (0)' })).toBeVisible();

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

  // ACCOUNT/BAG have no real behavior yet (Phase 10/2) — clicking shows a
  // brief acknowledgment instead of doing nothing silently. See
  // components/navigation/ComingSoonNotice.tsx. SEARCH used to be part of
  // this trio (see git history) — it now opens a real SearchOverlay
  // (tests/e2e/search.spec.ts covers that behavior).
  test('ACCOUNT and BAG show an on-brand "arriving soon" notice when clicked', async ({ page }) => {
    await page.goto('/');
    const notice = page.getByRole('status').filter({ hasText: 'ARRIVING SOON.' });

    await expect(notice).not.toBeVisible();

    await page.getByRole('button', { name: 'ACCOUNT' }).click();
    await expect(notice).toHaveText('ACCOUNT — ARRIVING SOON.');

    await page.getByRole('button', { name: 'BAG (0)' }).click();
    await expect(notice).toHaveText('BAG — ARRIVING SOON.');
  });
});

test.describe('full-screen menu', () => {
  test('is closed by default and opens when MENU is clicked', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('dialog', { name: /menu/i });
    await expect(menu).toBeHidden();

    await page.getByRole('button', { name: 'MENU' }).click();
    await expect(menu).toBeVisible();
    // Scoped to the menu dialog: the homepage's own CategoryShowcase scene
    // (ROADMAP.md Phase 7) now has a real "TOPS" link too, so an unscoped
    // page-wide query is ambiguous once the menu is open (both sit in the
    // DOM simultaneously — CategoryShowcase's copy is correctly `inert`
    // while the menu is open, per ShellClient.tsx, but that doesn't change
    // how many elements a role query can find).
    await expect(menu.getByRole('link', { name: 'TOPS' })).toBeVisible();
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
    // Scoped to the menu dialog throughout this test: the homepage's own
    // CategoryShowcase scene (ROADMAP.md Phase 7) now has real "TOPS"/
    // "BOTTOMS"/"ETC." links too, ambiguous against an unscoped page-wide
    // query while the menu is open (both sit in the DOM simultaneously).
    const menu = page.getByRole('dialog', { name: /menu/i });
    const firstLink = menu.getByRole('link', { name: 'NEW' });
    const lastLink = menu.getByRole('link', { name: 'ABOUT' });
    await expect(firstLink).toBeFocused();

    // Forward: Tab through every category link, ending back on the first —
    // exercises the actual wrap-forward branch of handleKeyDown, not just
    // the initial-focus-on-open behavior. TOPS/BOTTOMS/ETC. are each
    // immediately followed by their own subcategory disclosure <button> in
    // DOM order (FullScreenMenu.tsx) — real focusable elements the
    // hand-rolled trap's querySelectorAll picks up automatically, so the
    // full sequence must include them, not just the category links.
    const forwardSequence = [
      { role: 'link', name: 'TOPS' },
      { role: 'button', name: 'TOPS subcategories' },
      { role: 'link', name: 'BOTTOMS' },
      { role: 'button', name: 'BOTTOMS subcategories' },
      { role: 'link', name: 'ETC.' },
      { role: 'button', name: 'ETC. subcategories' },
      { role: 'link', name: 'COLLECTIONS' },
      { role: 'link', name: 'ABOUT' },
    ] as const;
    for (const { role, name } of forwardSequence) {
      await page.keyboard.press('Tab');
      await expect(menu.getByRole(role, { name })).toBeFocused();
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

    // The subcategory reveal (.esque-submenu-reveal, app/globals.css) uses
    // a mount-triggered `animation`, a different CSS mechanism than the
    // dialog's own open/close `transition` checked above — confirming the
    // sitewide reduced-motion rule actually reaches it too, rather than
    // assuming the same rule that zeroes transition-duration also zeroes
    // animation-duration.
    await menu.getByRole('button', { name: 'TOPS subcategories' }).click();
    const subcategoryList = menu.locator('#menu-subcategories-tops');
    const animationDuration = await subcategoryList.evaluate(
      (el) => getComputedStyle(el).animationDuration,
    );
    expect(animationDuration === '0s' || parseFloat(animationDuration) < 0.05).toBe(true);
    // And the end state is actually correct, not just fast — opacity 1,
    // not frozen on the keyframe's 0%-opacity starting frame (the real
    // risk this project's own §9/§94 review convention calls out for any
    // animated mechanism beyond a plain opacity transition: a technically-
    // instant animation that still lands on the wrong final frame is worse
    // than not reducing motion at all). A web-first `toHaveCSS` assertion,
    // not a one-shot `.evaluate()` read like the animationDuration check
    // above: that check reads a *static authored* value (how long the
    // animation is configured to run, true the instant styles are
    // computed, matching this file's own pre-existing transitionDuration
    // check's stable pattern above), but opacity here is the *live,
    // in-progress* value of an actively-playing (if near-instant)
    // animation — a single synchronous read can race the browser's own
    // paint and sample the keyframe's 0% starting value before the
    // 0.01ms-duration animation has actually committed its end state
    // (reproduced empirically: flaked 1/8 on an isolated repeat run).
    // `toHaveCSS` retries until it holds or times out, matching how this
    // same file's own "the open/close transition genuinely animates
    // opacity" test already asserts `menu`'s end-state opacity above.
    await expect(subcategoryList).toHaveCSS('opacity', '1');
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

  // DESIGN_SYSTEM.md §25's "subcategories reveal" + PROJECT.md §72/§94 and
  // DESIGN_SYSTEM.md §70's ban on hover-only critical navigation: the
  // disclosure button is the mechanism that must work with no hover at
  // all (click here stands in for a touch tap — there is no hover on
  // mobile/tablet, so this is the path those devices actually take).
  test('clicking the TOPS subcategories button reveals its subcategories, and clicking one closes the menu and navigates', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const menu = page.getByRole('dialog', { name: /menu/i });
    const disclosureButton = menu.getByRole('button', { name: 'TOPS subcategories' });
    const tShirtsLink = menu.getByRole('link', { name: 'T-SHIRTS' });

    await expect(disclosureButton).toHaveAttribute('aria-expanded', 'false');
    await expect(tShirtsLink).toBeHidden();

    await disclosureButton.click();
    await expect(disclosureButton).toHaveAttribute('aria-expanded', 'true');
    await expect(tShirtsLink).toBeVisible();

    await tShirtsLink.click();
    await expect(page).toHaveURL(/\/tops\/t-shirts$/);
    await expect(menu).toBeHidden();
  });

  test('the subcategory disclosure button also toggles via keyboard (Enter)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const menu = page.getByRole('dialog', { name: /menu/i });
    const disclosureButton = menu.getByRole('button', { name: 'TOPS subcategories' });

    await disclosureButton.focus();
    await page.keyboard.press('Enter');
    await expect(disclosureButton).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('link', { name: 'T-SHIRTS' })).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(disclosureButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menu.getByRole('link', { name: 'T-SHIRTS' })).toBeHidden();
  });

  test('only one category’s subcategories are expanded at a time', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const menu = page.getByRole('dialog', { name: /menu/i });

    await menu.getByRole('button', { name: 'TOPS subcategories' }).click();
    await expect(menu.getByRole('link', { name: 'T-SHIRTS' })).toBeVisible();

    await menu.getByRole('button', { name: 'BOTTOMS subcategories' }).click();
    await expect(menu.getByRole('link', { name: 'JEANS' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'T-SHIRTS' })).toBeHidden();
  });

  // Progressive-enhancement only — the test above already proves the
  // click/tap mechanism works completely without this.
  test('hovering TOPS previews its subcategories without clicking', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'MENU' }).click();
    const menu = page.getByRole('dialog', { name: /menu/i });

    await menu.getByRole('link', { name: 'TOPS' }).hover();
    await expect(menu.getByRole('link', { name: 'T-SHIRTS' })).toBeVisible();
  });

  // Regression: before ROADMAP.md Phase 4, every one of these hrefs 404'd
  // like every other category link did — this proves they now resolve to
  // real routes (tests/e2e/catalog.spec.ts covers what each route does once
  // there, including the Shopify-unconfigured error boundary). Each
  // iteration re-navigates to '/' first — this used to be required (a
  // Shopify-unconfigured category route throws up to the root
  // app/error.tsx boundary, which used to unmount Header along with it,
  // back when the shell lived inside the now-deleted
  // app/(storefront)/layout.tsx, below that boundary) and is now just
  // conservative rather than strictly necessary: DECISIONS.md D-074 moved
  // the shell into the root layout itself, above app/error.tsx's boundary,
  // so Header/MENU stay mounted through an error too. Left as-is — still
  // correct, and re-navigating between independent test cases is ordinary
  // Playwright hygiene regardless.
  for (const [name, path] of [
    ['TOPS', '/tops'],
    ['BOTTOMS', '/bottoms'],
    ['ETC.', '/etc'],
  ] as const) {
    test(`${name} link navigates to a real page, not a 404`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'MENU' }).click();
      // Scoped to the menu dialog — the homepage's own CategoryShowcase
      // scene (ROADMAP.md Phase 7) now has a same-named "TOPS"/"BOTTOMS"/
      // "ETC." link too, ambiguous against an unscoped page-wide query.
      await page.getByRole('dialog', { name: /menu/i }).getByRole('link', { name }).click();
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
  test('renders as a landmark with links to every legal page and contact', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Shipping Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Return Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Refund Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Accessibility Statement' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Wishlist' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Archive' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'About' })).toBeVisible();
  });

  // Regression: /legal/privacy, /legal/terms, and /contact were dead links
  // (404) from Footer since Task 10 of the original foundation-shell plan —
  // the pages didn't exist yet. This proves every footer link now resolves
  // to a real, non-404 page, mirroring the full-screen menu's own
  // "navigates to a real page, not a 404" loop above. Each destination
  // page's own content/heading/metadata is covered in depth by
  // tests/e2e/legal.spec.ts.
  for (const [name, path] of [
    ['Privacy Policy', '/legal/privacy'],
    ['Terms of Service', '/legal/terms'],
    ['Shipping Policy', '/legal/shipping'],
    ['Return Policy', '/legal/returns'],
    ['Refund Policy', '/legal/refunds'],
    ['Accessibility Statement', '/legal/accessibility'],
    ['Contact', '/contact'],
    ['Wishlist', '/wishlist'],
    ['Archive', '/archive'],
    ['About', '/about'],
  ] as const) {
    test(`${name} footer link navigates to a real page, not a 404`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('contentinfo').getByRole('link', { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toHaveCount(0);
    });
  }
});

test.describe('not-found', () => {
  test('visiting a nonexistent route shows the branded 404 with a way back to Esque', async ({
    page,
  }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: "THIS PIECE DOESN'T EXIST." })).toBeVisible();
    // Scoped to `main`: the page's own in-content recovery link. Header's
    // identically-labeled "ESQUE" wordmark link is now also present here
    // (DECISIONS.md D-074 moved the shell into the root layout, so this is
    // no longer the one page without it) — an unscoped query would match
    // both and violate Playwright's strict-mode single-element rule.
    await expect(page.getByRole('main').getByRole('link', { name: 'ESQUE' })).toBeVisible();
  });

  // Regression (DECISIONS.md D-074): this page is now wrapped by the real
  // shell (ShellClient, rendered from the root layout) like any other
  // route — Header's MENU/SEARCH/ACCOUNT/BAG and Footer's links are all
  // genuinely reachable from a 404, not just a bare "back to home" link.
  test('renders inside the real shell — Header and Footer are present', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'MENU' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  // Regression: ShellClient's own <main id="main-content"> (rendered from
  // the root layout, DECISIONS.md D-074) is this page's one real landmark —
  // app/not-found.tsx itself deliberately renders a plain <div>, not a
  // second <main>, since HTML disallows nesting <main> landmarks. This
  // proves exactly one exists, not two.
  test('has a single main landmark', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('main')).toBeVisible();
  });

  // Regression: the ESQUE link intentionally carries no focus-visible
  // classes of its own (removed as a duplicate of the global a:focus-visible
  // rule in app/globals.css) — confirms that global rule is genuinely
  // applied, not merely assumed to cover it. Scoped to `main` for the same
  // two-"ESQUE"-links reason as the first test in this block.
  test('the ESQUE link back to home still shows a visible focus ring', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    const homeLink = page.getByRole('main').getByRole('link', { name: 'ESQUE' });
    await homeLink.focus();
    await expect(homeLink).toBeFocused();
    await expect(homeLink).toHaveCSS('outline-style', 'solid');
    await expect(homeLink).toHaveCSS('outline-color', 'rgb(243, 241, 234)'); // --color-esque-text
  });
});

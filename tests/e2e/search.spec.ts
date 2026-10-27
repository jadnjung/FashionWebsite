import { test, expect } from '@playwright/test';

// ROADMAP.md Phase 4 — full-screen predictive search overlay, resolving
// DECISIONS.md D-025's deferral (and, for the COLLECTIONS result group,
// D-058 Part 3's later deferral — resolved by D-069). See
// docs/superpowers/specs/2026-09-18-search-design.md for the full
// architecture and why a dedicated results page isn't built.
//
// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally
// unset in this E2E environment (playwright.config.ts's webServer.env sets
// only the access-gate/Klaviyo fixtures) — every products/collections
// search below therefore hits a genuinely unconfigured Shopify client
// (searchProducts/searchCollections rejecting together via
// app/api/search/route.ts's Promise.all) and settles to SearchOverlay's
// own scoped error state. This mirrors catalog.spec.ts's same
// honest-about-the-environment approach. Category matching has no
// Shopify dependency (lib/catalog/taxonomy.ts is pure/local), so it's
// fully, genuinely verifiable here.
test.describe('search overlay', () => {
  test('opens via the SEARCH button with the input immediately focused', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'SEARCH' }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toBeFocused();
  });

  test('Escape closes the overlay and returns focus to the SEARCH trigger', async ({ page }) => {
    await page.goto('/');
    const searchTrigger = page.getByRole('button', { name: 'SEARCH' });
    await searchTrigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(searchTrigger).toBeFocused();
  });

  test('clicking CLOSE closes the overlay and returns focus to the SEARCH trigger', async ({
    page,
  }) => {
    await page.goto('/');
    const searchTrigger = page.getByRole('button', { name: 'SEARCH' });
    await searchTrigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'CLOSE' }).click();
    await expect(dialog).toBeHidden();
    await expect(searchTrigger).toBeFocused();
  });

  // Mirrors smoke.spec.ts's own "background content is inert while the
  // menu is open" technique, applied to the reverse pairing: ShellClient's
  // inert={menuOpen || searchOpen} is what keeps Menu and Search mutually
  // exclusive — this proves that mechanism actually holds for Search, not
  // just for Menu.
  test('MENU is unreachable while Search is open (mutual exclusion via inert)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();

    const menuButton = page.getByRole('button', { name: 'MENU' });
    await menuButton.focus();
    await expect(menuButton).not.toBeFocused();
    // The dialog stays open — not toggled by a background element that
    // should be unreachable.
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('a single-character query shows neither CATEGORIES nor PRODUCTS', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });

    await dialog.getByRole('searchbox').fill('h');
    // Give the debounce window a moment to have fired if it incorrectly
    // would — MIN_QUERY_LENGTH=2 means it must not.
    await page.waitForTimeout(400);

    await expect(dialog.getByRole('heading', { name: /categories/i })).toHaveCount(0);
    await expect(dialog.getByRole('heading', { name: /products/i })).toHaveCount(0);
  });

  // Below MIN_QUERY_LENGTH (2), the overlay previously showed nothing at
  // all for a 1-character query — no feedback that typing more would do
  // anything. Now shows a small muted "Keep typing…" hint instead.
  test.describe('below the MIN_QUERY_LENGTH hint', () => {
    test('a 1-character query shows the "Keep typing…" hint and no result sections', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'SEARCH' }).click();
      const dialog = page.getByRole('dialog', { name: 'Search' });

      await dialog.getByRole('searchbox').fill('h');
      await expect(dialog.getByText('Keep typing…')).toBeVisible();
      await expect(dialog.getByRole('heading', { name: /categories/i })).toHaveCount(0);
      await expect(dialog.getByRole('heading', { name: /products/i })).toHaveCount(0);
      await expect(dialog.getByRole('heading', { name: /collections/i })).toHaveCount(0);
      await expect(dialog.getByText('NOTHING MATCHES.')).toHaveCount(0);
    });

    test('typing a 2nd character hides the hint and proceeds to the normal result flow', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'SEARCH' }).click();
      const dialog = page.getByRole('dialog', { name: 'Search' });
      const searchbox = dialog.getByRole('searchbox');

      await searchbox.fill('h');
      await expect(dialog.getByText('Keep typing…')).toBeVisible();

      await searchbox.fill('ho');
      await expect(dialog.getByText('Keep typing…')).toHaveCount(0);
      // Normal result flow proceeds — 'ho' matches the Hoodies category.
      await expect(dialog.getByRole('heading', { name: /categories/i })).toBeVisible();
    });

    test('deleting back to 1 character brings the hint back', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'SEARCH' }).click();
      const dialog = page.getByRole('dialog', { name: 'Search' });
      const searchbox = dialog.getByRole('searchbox');

      await searchbox.fill('ho');
      await expect(dialog.getByText('Keep typing…')).toHaveCount(0);

      await searchbox.fill('h');
      await expect(dialog.getByText('Keep typing…')).toBeVisible();
    });

    test('clearing to 0 characters shows nothing (no hint, no result sections) — no regression', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'SEARCH' }).click();
      const dialog = page.getByRole('dialog', { name: 'Search' });
      const searchbox = dialog.getByRole('searchbox');

      await searchbox.fill('h');
      await expect(dialog.getByText('Keep typing…')).toBeVisible();

      await searchbox.fill('');
      await expect(dialog.getByText('Keep typing…')).toHaveCount(0);
      await expect(dialog.getByRole('heading', { name: /categories/i })).toHaveCount(0);
      await expect(dialog.getByRole('heading', { name: /products/i })).toHaveCount(0);
      await expect(dialog.getByText('NOTHING MATCHES.')).toHaveCount(0);
    });
  });

  test('typing a category-matching query shows a real, clickable result that navigates and closes the overlay', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });

    await dialog.getByRole('searchbox').fill('hoodie');
    const result = dialog.getByRole('link', { name: 'TOPS / Hoodies' });
    await expect(result).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /categories/i })).toBeVisible();

    await result.click();
    await expect(page).toHaveURL(/\/tops\/hoodies$/);
    await expect(dialog).toBeHidden();
  });

  // The one assertion that most directly proves the scoped-error design
  // decision (design spec's Error Handling section) actually works: a
  // search-products failure renders inside the dialog, not as the
  // page-level app/error.tsx boundary that catalog.spec.ts's routes hit.
  test("a genuine query surfaces the PRODUCTS section's own scoped error state, not the page-level error boundary", async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });

    await dialog.getByRole('searchbox').fill('hoodie');
    await expect(dialog.getByRole('heading', { name: /products/i })).toBeVisible();
    await expect(dialog.getByText('COULD NOT LOAD RESULTS.')).toBeVisible();
    const retryButton = dialog.getByRole('button', { name: 'Retry' });
    await expect(retryButton).toBeVisible();

    // Scoped, not the page-level boundary: app/error.tsx renders its
    // message as a real <h1> heading, which must NOT appear anywhere (the
    // dialog's own error text above is a plain, unscoped <p>, not a
    // heading) — this is the real discriminator, sufficient on its own to
    // prove the error stayed scoped to the dialog rather than escaping to
    // app/error.tsx's fallback.
    //
    // The ESQUE-link check below is kept as a basic sanity check that the
    // homepage underneath the dialog is still genuinely there, but is no
    // longer a *second* proof of the same distinction: DECISIONS.md D-074
    // moved the shell into the root layout, above app/error.tsx's
    // boundary, so Header now stays mounted even if the page-level
    // boundary did fire — its presence alone can no longer tell the two
    // cases apart.
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'ESQUE' })).toBeAttached();

    // Retry re-attempts the same query and settles to the same honest
    // error again (this environment's Shopify client stays unconfigured).
    await retryButton.click();
    await expect(dialog.getByText('COULD NOT LOAD RESULTS.')).toBeVisible();
  });

  // Regression: the PRODUCTS group's heading was gated only on
  // `status !== 'idle'`, so a settled search with zero product matches
  // still rendered the "Products" <h2> over empty space — unlike
  // CATEGORIES/COLLECTIONS, each correctly gated on their own
  // `.length > 0`. Mocked at the network boundary (not relying on Demo
  // Mode) specifically to reach a genuine `loaded` status with an empty
  // products array — this environment's Shopify client is always
  // unconfigured, so an unmocked query only ever reaches the `error`
  // status (the test above), never `loaded`.
  test('the PRODUCTS heading does not render when a settled search has zero product matches', async ({
    page,
  }) => {
    await page.route('**/api/search**', (route) =>
      route.fulfill({ json: { products: [], collections: [] } }),
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });

    // Matches no local category either, so every result group is
    // genuinely empty and only the mocked PRODUCTS fetch is under test.
    await dialog.getByRole('searchbox').fill('zzzznomatch');
    await expect(dialog.getByText('NOTHING MATCHES.')).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /products/i })).toHaveCount(0);
    await expect(dialog.getByRole('heading', { name: /categories/i })).toHaveCount(0);
    await expect(dialog.getByRole('heading', { name: /collections/i })).toHaveCount(0);
  });

  // WCAG 2.5.8 (24x24px minimum) — the native type="search" clear ("x")
  // button (app/globals.css's ::-webkit-search-cancel-button rule) had a
  // 14x14px hit target. Fixed by growing the pseudo-element's own box to
  // 24x24 while keeping the visible glyph at a fixed, smaller
  // background-size — mirrors FullScreenMenu.tsx's small-glyph-in-a-
  // bigger-hit-box pattern (h-6 w-6 wrapping a 16px ChevronIcon), just via
  // background-size instead of a padded child, since this is one
  // UA-rendered pseudo-element, not two nested real DOM nodes. A pseudo-
  // element isn't reachable via a normal CSS selector/locator, so its
  // computed size is read directly via getComputedStyle's two-argument
  // form. Chromium and WebKit (this suite's 4 projects — see
  // playwright.config.ts) both render this pseudo-element; Firefox isn't
  // among this suite's projects and wouldn't render it if it were (see the
  // CSS rule's own comment).
  test('the native search-clear ("x") button has a WCAG 2.5.8-compliant 24x24px hit target', async ({
    page,
    browserName,
  }) => {
    // Chromium-engine only (this suite's `chromium`/`laptop` projects) —
    // confirmed empirically, not assumed: WebKit (`mobile-safari`/`tablet`)
    // does not expose this non-standard, vendor-prefixed pseudo-element's
    // computed box through getComputedStyle(el, pseudoElt) the way
    // Chromium does (every property reads back as '', so parseFloat gives
    // NaN), even though WebKit fully supports *styling* it — the existing
    // background-image/color override one-way above already proves that.
    // This is a limitation of this verification technique on WebKit, not
    // of the fix: the CSS rule itself is plain, engine-agnostic
    // width/height on a selector WebKit already honors, so verifying it on
    // Chromium is sufficient signal that the rule applies correctly.
    test.skip(
      browserName === 'webkit',
      'WebKit does not expose this pseudo-element’s computed box via getComputedStyle(el, pseudoElt)',
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const input = dialog.getByRole('searchbox');
    // The cancel button only renders once the field has a value.
    await input.fill('hoodie');

    const size = await input.evaluate((el) => {
      const style = getComputedStyle(el, '::-webkit-search-cancel-button');
      return { width: parseFloat(style.width), height: parseFloat(style.height) };
    });
    expect(size.width).toBeGreaterThanOrEqual(24);
    expect(size.height).toBeGreaterThanOrEqual(24);
  });

  test('Tab-cycle focus trap wraps forward and backward across CLOSE, input, and results', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const input = dialog.getByRole('searchbox');
    const closeButton = dialog.getByRole('button', { name: 'CLOSE' });

    await expect(input).toBeFocused();

    // Type a query that produces both a category result and (in this
    // Shopify-unconfigured environment) a settled products error state —
    // waiting for both to settle keeps the focusable set stable for the
    // rest of this test, rather than racing the debounced fetch.
    await input.fill('hoodie');
    const categoryLink = dialog.getByRole('link', { name: 'TOPS / Hoodies' });
    await expect(categoryLink).toBeVisible();
    const retryButton = dialog.getByRole('button', { name: 'Retry' });
    await expect(retryButton).toBeVisible();

    // Backward from the input (not the first focusable element — CLOSE
    // precedes it in DOM order) moves to CLOSE via ordinary tab order, not
    // the trap's own wrap logic.
    await input.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(closeButton).toBeFocused();

    // Shift+Tab from CLOSE (the first focusable element) wraps to the
    // last one — Retry, since the products section settled below the
    // category link.
    await page.keyboard.press('Shift+Tab');
    await expect(retryButton).toBeFocused();

    // Forward Tab from the last element wraps back to the first (CLOSE).
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Mirrors smoke.spec.ts's identical check for .esque-menu — the closed
    // overlay's own non-zero transition-delay (280ms on visibility) is
    // what actually proves the reduced-motion override is suppressing
    // something real, checked on the closed (initial) state.
    const closedDelay = await page
      .locator('#esque-search-overlay')
      .evaluate((el) => getComputedStyle(el).transitionDelay);
    for (const value of closedDelay.split(',')) {
      expect(parseFloat(value)).toBeLessThan(0.05);
    }

    await page.getByRole('button', { name: 'SEARCH' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const duration = await dialog.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration === '0s' || parseFloat(duration) < 0.05).toBe(true);
  });
});

import { test, expect } from '@playwright/test';

// ROADMAP.md Phase 12 — "Cross-device QA" (mobile/tablet/laptop/desktop),
// the last unchecked item in the phase sequence. playwright.config.ts's four
// projects (mobile-safari, tablet, laptop, chromium) now give DESIGN_SYSTEM.md
// §14/§15's four documented breakpoint tiers (mobile/tablet/desktop/large
// desktop) real, project-level coverage — see DECISIONS.md D-056 for the
// full audit (methodology, every finding, and honest limitations).
//
// This file holds cross-cutting assertions that specifically depend on
// *this project's own configured viewport* rather than a hardcoded
// override. homepage.spec.ts's and smoke.spec.ts's existing "no horizontal
// overflow" tests both force a 375px viewport regardless of which project
// runs them, so they gain nothing from the two new projects — this file is
// what actually exercises each project's real, distinct viewport (768px
// tablet, 1024px laptop, 1280px chromium, 390px mobile-safari).
//
// What this file deliberately does NOT cover, and why: ProductGrid's
// 12/8/4-column transition, the PDP's 60/40 desktop split, the Interactive
// Model's hotspot/panel layout, and SizeGuidePanel/ShopTheLookPanel's
// side-panel-vs-bottom-sheet threshold all depend on real Shopify product
// data to render at all — every category/PDP route in this Shopify-
// unconfigured dev/CI environment hits the generic error boundary before
// ever reaching that markup (the same D-023-class limitation catalog.spec.ts/
// pdp.spec.ts already document). Those were verified instead via a
// temporary fixture probe, mirroring D-045/D-048/D-049/D-053's established
// technique exactly (deleted before commit, confirmed via `git status
// --short`) — see DECISIONS.md D-056 for the full methodology and results.
// A permanent automated test for them would need the same real store this
// project has never had; recorded honestly rather than invented around.

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

// A representative sample of real, reachable routes — not a duplicate of
// catalog.spec.ts's full seven-route functional sweep, which already exists
// for content correctness. Every category/subcategory route renders the
// exact same generic error-boundary markup in this environment, so one
// top-level category and one subcategory are enough to exercise that shared
// shape without redundant bloat.
const REAL_ROUTES = [
  '/',
  '/access',
  '/new',
  '/tops/hoodies',
  '/products/any-handle',
  '/legal/privacy',
  '/legal/terms',
  '/legal/shipping',
  '/legal/returns',
  '/legal/refunds',
  '/legal/accessibility',
  '/contact',
  '/this-route-does-not-exist',
] as const;

test.describe('horizontal overflow — every real route, at this project’s own configured viewport', () => {
  for (const route of REAL_ROUTES) {
    test(`${route} produces no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});

test.describe('header utility nav — tablet and up shows full text, not the mobile icon-compressed mode', () => {
  test('SEARCH and ACCOUNT render as full-text controls once this project’s own viewport reaches md (768px)', async ({
    page,
  }) => {
    const viewport = page.viewportSize();
    test.skip(
      !viewport || viewport.width < 768,
      'below md — smoke.spec.ts’s own mobile-viewport test already covers the icon-only mode here',
    );

    await page.goto('/');
    const search = page.getByRole('button', { name: 'SEARCH' });
    const account = page.getByRole('button', { name: 'ACCOUNT' });
    // Below md, Header.tsx visually clips this same <span> to ~1px via
    // sr-only (smoke.spec.ts's mirroring mobile-only assertion checks that
    // side) — at md and up (Header.tsx's `md:not-sr-only`) it must render at
    // its natural, visible text width instead.
    expect((await search.locator('span').boundingBox())?.width ?? 0).toBeGreaterThan(1);
    expect((await account.locator('span').boundingBox())?.width ?? 0).toBeGreaterThan(1);
    // The icon-only SVGs are the mobile-only presentation (Header.tsx's
    // `md:hidden`) — confirms this isn't just the label growing while an
    // icon also stays visible.
    await expect(search.locator('svg')).toBeHidden();
    await expect(account.locator('svg')).toBeHidden();
  });
});

test.describe('touch targets — WCAG 2.5.8 (24x24px minimum) on a real touch-capable project', () => {
  test('Request Access consent checkbox’s clickable label meets the minimum', async ({
    page,
    isMobile,
  }) => {
    // Pins DECISIONS.md D-051's fix at every genuinely touch-classed project
    // (mobile-safari and the new tablet project both report isMobile/hasTouch
    // true) — not chromium/laptop's mouse-driven ones, which this criterion
    // doesn't gate on.
    test.skip(!isMobile, 'touch-target sizing is only meaningful on a touch-capable project');

    await page.goto('/access');
    await page.getByRole('button', { name: 'REQUEST ACCESS' }).click();
    const consentLabel = page.locator('label', {
      hasText: 'I agree to receive Esque emails, including access and collection updates.',
    });
    const box = await consentLabel.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  });
});

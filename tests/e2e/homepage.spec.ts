import { test, expect } from '@playwright/test';

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env) — Selected
// Pieces' and the Shop the Look ring's fetches always fail here. This is
// deliberately the load-bearing case for this project's graceful-
// degradation architecture (DECISIONS.md D-033/D-034): the other scenes
// must still render correctly regardless, and a Shopify-dependent scene
// must degrade to its own honest fallback rather than render broken.
test.describe('homepage — renders real scene content even with Shopify unconfigured', () => {
  test('the hero renders its real structure, placeholder labels, and CTA', async ({ page }) => {
    await page.goto('/');
    const hero = page.getByRole('region', { name: 'Collection Hero' });
    await expect(page.getByRole('heading', { name: 'ESQUE', level: 1 })).toBeVisible();
    await expect(hero.getByText('COLLECTION 001')).toBeVisible();
    const campaignHeroLabel = hero.getByText('ESQUE PLACEHOLDER — CAMPAIGN, HERO');
    const campaignStatementLabel = hero.getByText('ESQUE PLACEHOLDER — CAMPAIGN STATEMENT');
    await expect(campaignHeroLabel).toBeVisible();
    await expect(campaignStatementLabel).toBeVisible();
    // Regression for DECISIONS.md D-048: both labels previously rendered in
    // text-esque-text-muted (#666662, ~3.3:1 against this scene's black
    // background — fails WCAG AA's 4.5:1 text-contrast minimum). Now
    // text-esque-text-secondary (#A5A5A0, ~8:1).
    await expect(campaignHeroLabel).toHaveCSS('color', 'rgb(165, 165, 160)');
    await expect(campaignStatementLabel).toHaveCSS('color', 'rgb(165, 165, 160)');
    const cta = hero.getByRole('link', { name: 'ENTER COLLECTION' });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/new$/);
  });

  test('the Shop the Look placeholder is present and honestly labeled', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Shop the Look' });
    await expect(scene).toBeVisible();
    await expect(scene.getByText('LOOK 01')).toBeVisible();
    const modelPlaceholderLabel = scene.getByText('ESQUE PLACEHOLDER — MODEL, FULL BODY');
    await expect(modelPlaceholderLabel).toBeVisible();
    // Regression for DECISIONS.md D-048 — see the equivalent hero assertion
    // above for the full contrast reasoning.
    await expect(modelPlaceholderLabel).toHaveCSS('color', 'rgb(165, 165, 160)');
    await expect(scene.getByRole('heading', { name: 'ARRIVING SOON.' })).toBeVisible();
  });

  test('the looks ring does not mount when Shopify is unconfigured', async ({ page }) => {
    await page.goto('/');
    // Proves LooksSection's no-looks branch (DECISIONS.md D-091) renders
    // only the placeholder — none of the ring's real controls exist.
    const scene = page.getByRole('region', { name: 'Shop the Look' });
    await expect(scene.getByRole('button', { name: 'VIEW ALL LOOKS' })).toHaveCount(0);
    await expect(scene.getByRole('group', { name: 'Looks' })).toHaveCount(0);
  });

  test('the collection statement renders its real copy', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Collection Statement' });
    await expect(scene.getByRole('heading', { name: 'NOT MADE TO REMAIN.' })).toBeVisible();
  });

  test('Selected Pieces is entirely absent when Shopify is unconfigured', async ({ page }) => {
    await page.goto('/');
    // Proves the graceful-omission path (DECISIONS.md D-033) — not just
    // "the page didn't crash," but that the specific section is genuinely
    // absent rather than rendered empty or erroring.
    await expect(page.getByRole('heading', { name: 'Selected Pieces' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Selected Pieces' })).toHaveCount(0);
  });

  test('the category showcase links to the real Phase 4 category routes', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Shop by Category' });
    await expect(scene.getByRole('link', { name: 'TOPS' })).toHaveAttribute('href', '/tops');
    await expect(scene.getByRole('link', { name: 'BOTTOMS' })).toHaveAttribute('href', '/bottoms');
    await expect(scene.getByRole('link', { name: 'ETC.' })).toHaveAttribute('href', '/etc');

    await scene.getByRole('link', { name: 'TOPS' }).click();
    await expect(page).toHaveURL(/\/tops$/);
  });

  test('drop status renders the real, committed catalog copy', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Drop Status' });
    await expect(scene.getByText('COLLECTION 001')).toBeVisible();
    await expect(scene.getByRole('heading', { name: '06 PIECES' })).toBeVisible();
    await expect(scene.getByText('AVAILABLE UNTIL GONE')).toBeVisible();
  });

  test('archive preview (Scene 07) is not rendered this pass', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: /archive/i })).toHaveCount(0);
  });
});

test.describe('homepage — motion', () => {
  // Mirrors FullScreenMenu's existing "respects prefers-reduced-motion"
  // test technique — direct proof for this phase's one new animation
  // (.esque-hero-reveal, app/globals.css) rather than relying only on the
  // pre-existing sitewide rule being correct by inference.
  test('the hero entrance fade respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const duration = await page
      .locator('.esque-hero-reveal')
      .evaluate((el) => getComputedStyle(el).animationDuration);
    // "0.01ms" per the sitewide override, not the authored 500ms.
    expect(parseFloat(duration)).toBeLessThan(0.05);
  });
});

test.describe('homepage — Collection Closet (DECISIONS.md D-089)', () => {
  // The 3D closet needs a current collection from Shopify, which this
  // environment deliberately doesn't have — so what's verifiable here is the
  // degradation contract: the hero renders its complete static poster and
  // never mounts the closet (or downloads three.js) without one. The
  // populated closet's interaction (hover, pull out, rotate, dismiss,
  // keyboard path, mobile swipe) is verified live in Demo Mode — see D-089.
  test('falls back to the static poster, with no closet, when there is no current collection', async ({
    page,
  }) => {
    await page.goto('/');
    const hero = page.getByRole('region', { name: 'Collection Hero' });
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeVisible();
    await expect(hero.locator('[data-closet]')).toHaveCount(0);
    await expect(hero.locator('canvas')).toHaveCount(0);
  });
});

test.describe('homepage — structure and responsiveness', () => {
  test('has exactly one h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('renders scenes in the PROJECT.md §23 / DESIGN_SYSTEM.md §58 order', async ({ page }) => {
    await page.goto('/');
    // Waits for the real page content, not just navigation ('load') —
    // app/(storefront)/page.tsx's Home is one async Server Component
    // (`Promise.all([getClosetCollection(), getSelectedPieces(), ...])`
    // awaited before any JSX returns, no internal <Suspense> splitting
    // the six scenes apart), so the whole scene list resolves as one
    // atomic unit behind the root app/loading.tsx Suspense boundary.
    // Collection Hero is always the first scene and never conditionally
    // omitted (unlike Selected Pieces) — waiting for it is a reliable,
    // sufficient signal that every region is now present, not just this
    // one. Without this wait, evaluateAll() below raced goto()'s 'load'
    // event against that Suspense boundary resolving: on an uncompiled
    // dev-server route, `load` can fire while the DOM still shows
    // loading.tsx's plain "ESQUE" fallback (confirmed via a captured page
    // snapshot — zero role="region" elements present yet), which
    // DECISIONS.md D-074 made newly reachable by moving the shell above
    // that boundary (previously the shell was gated behind the same
    // boundary as the content, so both were equally "not there yet" and
    // this test's query window was effectively never hit in practice).
    await expect(page.getByRole('region', { name: 'Collection Hero' })).toBeVisible();
    const regionNames = await page
      .getByRole('region')
      .evaluateAll((elements) => elements.map((el) => el.getAttribute('aria-label')));
    expect(regionNames).toEqual([
      'Collection Hero',
      'Shop the Look',
      'Collection Statement',
      // Selected Pieces omitted — Shopify unconfigured in this environment.
      'Shop by Category',
      'Drop Status',
    ]);
  });

  test('produces no horizontal overflow at a 375px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

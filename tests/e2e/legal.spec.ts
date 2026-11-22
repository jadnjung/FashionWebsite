import { test, expect, type Page, type TestInfo } from '@playwright/test';

// ROADMAP.md Phase 12 — legal pages (Privacy, Terms, Shipping, Returns,
// Refunds), the Accessibility Statement, and Contact. See DECISIONS.md
// D-054 for the draft-content framing this suite verifies is actually
// visible, not just present in source. Footer's own links to these pages,
// and that each resolves to a real (non-404) page, are covered by
// tests/e2e/smoke.spec.ts's footer suite — this file covers each
// destination page's own content/metadata/draft-framing in depth.

const DRAFT_POLICIES = [
  { path: '/legal/privacy', heading: 'Privacy Policy' },
  { path: '/legal/terms', heading: 'Terms of Service' },
  { path: '/legal/shipping', heading: 'Shipping Policy' },
  { path: '/legal/returns', heading: 'Return Policy' },
  { path: '/legal/refunds', heading: 'Refund Policy' },
] as const;

const LEGAL_DESTINATIONS = [
  ...DRAFT_POLICIES,
  { path: '/legal/accessibility', heading: 'Accessibility Statement' },
  { path: '/contact', heading: 'Contact' },
] as const;

test.describe('draft legal pages', () => {
  for (const { path, heading } of DRAFT_POLICIES) {
    test(`${heading} renders its heading, title, and a visible draft notice`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(heading, 'i'));
      // The draft framing must be visible to a real visitor, not just a
      // code comment — CLAUDE.md/DECISIONS.md D-054's honesty requirement
      // is only met if this actually renders, not merely exists in source.
      await expect(page.getByText('Draft — Not Yet Final')).toBeVisible();
      await expect(page.getByText(/has not been reviewed by legal counsel/i)).toBeVisible();
    });
  }

  test('every open business decision is marked with a visible [Placeholder] flag', async ({
    page,
  }) => {
    // Spot-checks the two pages with the most business-decision-dependent
    // content (PROJECT.md §54/§101: shipping carrier/rates, return window)
    // rather than every page — the mechanism (components/legal/Placeholder.tsx)
    // is the same shared component everywhere, so this is representative,
    // not exhaustive duplication of the same assertion six times over.
    await page.goto('/legal/shipping');
    await expect(page.getByText(/\[Placeholder —/).first()).toBeVisible();

    await page.goto('/legal/returns');
    await expect(page.getByText(/\[Placeholder —/).first()).toBeVisible();
  });
});

test.describe('accessibility statement', () => {
  test('renders as real, non-draft content — no draft notice', async ({ page }) => {
    await page.goto('/legal/accessibility');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Accessibility Statement' }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/accessibility statement/i);
    // Distinguishes this page from the five DRAFT_POLICIES above — see
    // DECISIONS.md D-054 for why this one page is treated as real content.
    await expect(page.getByText('Draft — Not Yet Final')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Conformance Status' })).toBeVisible();
  });
});

test.describe('contact', () => {
  test('renders support categories and an honest placeholder state for the unconfigured support email', async ({
    page,
  }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1, name: 'Contact' })).toBeVisible();
    await expect(page).toHaveTitle(/contact/i);
    await expect(page.getByText('Order support')).toBeVisible();
    await expect(page.getByText('Shipping questions')).toBeVisible();
    // NEXT_PUBLIC_SUPPORT_EMAIL is intentionally unset in this environment
    // (not set in .env.local.example's committed default, and not injected
    // by playwright.config.ts — mirroring how ESQUE_ACCESS_PASSWORD etc.
    // are the only env vars that config deliberately overrides). This
    // proves the honest "not yet configured" branch renders instead of a
    // broken or fabricated mailto: link — see DECISIONS.md D-054.
    await expect(page.getByText('ESQUE PLACEHOLDER — SUPPORT EMAIL')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });
});

async function expectLegalJourneyWithoutErrors(
  page: Page,
  testInfo: TestInfo,
  journey: (recordDestination: (path: string) => void) => Promise<void>,
) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const started = Date.now();
  let destination = '';
  type Diagnostic = Record<string, string | number | boolean | undefined>;
  const events: Diagnostic[] = [];
  let firstError: Diagnostic | undefined;
  let firstPageError: Diagnostic | undefined;
  const record = (event: string, details: Diagnostic = {}) => {
    const entry = {
      event,
      elapsedMs: Date.now() - started,
      destination,
      activePath: new URL(page.url()).pathname,
      ...details,
    };
    events.push(entry);
    if (events.length > 30) events.shift();
    if (!firstError && ['consoleerror', 'pageerror', 'requestfailed'].includes(event)) {
      firstError = entry;
    }
    if (!firstPageError && event === 'pageerror') firstPageError = entry;
  };
  const safeText = (text: string, limit = 300) =>
    text
      // WebKit access-control messages can omit the URL scheme.
      .replace(/[?#][^\s"'<>)]*/g, '')
      .replace(/https?:\/\/[^\s"'<>]+/g, (url) => {
        try {
          return new URL(url).pathname;
        } catch {
          return '[invalid URL]';
        }
      })
      .slice(0, limit);
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
      record('consoleerror', { message: safeText(message.text()) });
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
    record('pageerror', {
      message: safeText(error.message),
      stack: safeText(error.stack ?? '', 2_000),
    });
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    const rsc = url.searchParams.has('_rsc');
    if (response.request().isNavigationRequest() || rsc) {
      record('response', { path: url.pathname, rsc, status: response.status() });
    }
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    const rsc = url.searchParams.has('_rsc');
    if (request.isNavigationRequest() || rsc) {
      record('requestfailed', {
        path: url.pathname,
        rsc,
        message: safeText(request.failure()?.errorText ?? ''),
      });
    }
  });

  try {
    await journey((path) => {
      destination = path;
      record('navigate');
    });

    const context = `Legal navigation: ${JSON.stringify({ destination, activePath: new URL(page.url()).pathname, firstError: firstError && { ...firstError, stack: undefined }, network: events.filter(({ event }) => event === 'response' || event === 'requestfailed').slice(-3) })}`;
    expect(consoleErrors, context).toEqual([]);
    expect(pageErrors, context).toEqual([]);
  } catch (error) {
    await testInfo.attach('legal-page-diagnostics', {
      body: JSON.stringify({ destination, firstError, firstPageError, events }, null, 2),
      contentType: 'application/json',
    });
    throw error;
  }
}

test.describe('legal pages — cross-cutting', () => {
  // Each direct arrival gets Playwright's fresh page/context fixture. The old
  // rapid hard-navigation sweep mixed document teardown with page health.
  for (const { path, heading } of LEGAL_DESTINATIONS) {
    test(`${heading} arrives with no console or page errors`, async ({ page }, testInfo) => {
      await expectLegalJourneyWithoutErrors(page, testInfo, async (recordDestination) => {
        recordDestination(path);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page).toHaveURL(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
        await expect(page).toHaveTitle(new RegExp(heading, 'i'));
      });
    });
  }

  test('footer links visit all seven pages with no console or page errors', async ({
    page,
  }, testInfo) => {
    await expectLegalJourneyWithoutErrors(page, testInfo, async (recordDestination) => {
      recordDestination('/');
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
      for (const [index, { path, heading }] of LEGAL_DESTINATIONS.entries()) {
        const link = page.getByRole('contentinfo').getByRole('link', { name: heading });
        recordDestination(path);
        if (index === 0) {
          await link.focus();
          await expect(link).toBeFocused();
          await link.press('Enter');
        } else {
          await link.click();
        }
        await expect(page).toHaveURL(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
        await expect(page).toHaveTitle(new RegExp(heading, 'i'));
      }
    });
  });

  test('sitemap.xml lists every legal page and contact', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    for (const path of [
      '/legal/privacy',
      '/legal/terms',
      '/legal/shipping',
      '/legal/returns',
      '/legal/refunds',
      '/legal/accessibility',
      '/contact',
    ]) {
      expect(body).toContain(path);
    }
  });
});

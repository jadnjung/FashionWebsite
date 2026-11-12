import { defineConfig, devices } from '@playwright/test';

// Demo Mode suite (DECISIONS.md D-057/D-090): tests that need populated
// catalog data — fixture products, collections, the homepage Collection
// Closet — run here, against a dev server with PREVIEW_DEMO_MODE=1. The
// main suite (playwright.config.ts) deliberately runs with no store at all
// to prove every Shopify-dependent surface degrades honestly; the two
// can't share one server, and Next 16 allows only one `next dev` per
// project directory, so CI runs this suite as its own step after the main
// one (`pnpm test:e2e:demo`).
//
// Locally, `reuseExistingServer` reuses a dev server already on :3000 —
// that server must itself be running with PREVIEW_DEMO_MODE=1, or these
// tests will see the unconfigured-store state and fail.
export default defineConfig({
  testDir: './tests/e2e-demo',
  fullyParallel: true,
  // At most two browsers at once: every closet test software-renders WebGL,
  // and more concurrent canvases than that exhausted the machine — browser
  // sessions crashed mid-test ("session closed") locally, while each test
  // passed on its own.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: 'playwright-report-demo', open: 'never' }]],
  outputDir: 'test-results-demo',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  // Chromium-engine projects only: the closet needs WebGL, which headless
  // Chromium provides everywhere (software-rendered on CI runners), while
  // headless WebKit on Linux CI does not reliably. A desktop and a touch
  // phone profile cover the closet's two layouts.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      PREVIEW_DEMO_MODE: '1',
      // Same reasoning as playwright.config.ts: never let a developer's
      // real Klaviyo credentials turn a test run into real list signups.
      KLAVIYO_PRIVATE_API_KEY: '',
      KLAVIYO_LIST_ID: '',
      // Pinned empty too: unlike the main suite (where drop routes hit the
      // unconfigured-store error boundary first), Demo Mode renders a real
      // upcoming-drop gate, so a developer's real early-access code must
      // never be live during a test run.
      ESQUE_DROP_ACCESS_CODE: '',
    },
  },
});

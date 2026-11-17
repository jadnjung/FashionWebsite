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
// Each run owns its server. Set PLAYWRIGHT_PRODUCTION=1 to build and test
// the optimized output with exactly the same pinned mode and integrations.
export default defineConfig({
  globalSetup: './tests/support/verify-server-mode.ts',
  metadata: { previewMode: 'demo' },
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
  // Chromium's software WebGL covers the real closet scene. Mobile WebKit
  // covers populated shopping journeys, excluding the scene-specific spec
  // because headless WebKit's WebGL availability varies across CI platforms.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'tablet', use: { ...devices['iPad Mini'] }, testIgnore: '**/closet.spec.ts' },
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
    },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      testIgnore: '**/closet.spec.ts',
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_EXTERNAL_SERVER === '1'
      ? undefined
      : {
          command: 'node scripts/run-browser-server.mjs',
          url: 'http://localhost:3000',
          reuseExistingServer: false,
          timeout: 240_000,
          env: {
            PREVIEW_DEMO_MODE: '1',
            PREVIEW_COLLECTION_SCENARIO: '',
            // Same reasoning as playwright.config.ts: never let a developer's
            // real Klaviyo credentials turn a test run into real list signups.
            SHOPIFY_STORE_DOMAIN: '',
            SHOPIFY_STOREFRONT_API_TOKEN: '',
            NEXT_PUBLIC_GA4_MEASUREMENT_ID: '',
            NEXT_PUBLIC_GA4_STREAM_PRIVACY_VERIFIED_FOR: '',
            NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: '',
            NEXT_PUBLIC_SUPPORT_EMAIL: '',
            NEXT_PUBLIC_PREVIEW_ANALYTICS: '1',
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

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    // Obviously-fake test fixtures, not secrets — the access-gate E2E specs
    // need real (test) values to actually grant access. @next/env does not
    // override a key already present in process.env (verified against the
    // installed Next 16.3.1 behavior), so these win even for a developer
    // who has real passwords set in their own .env.local. Playwright merges
    // this into the child process's env on top of the inherited one
    // (verified against the installed 1.62.1 behavior), so PATH etc. still
    // resolve normally.
    env: {
      ESQUE_ACCESS_PASSWORD: 'ci-test-general-password',
      ESQUE_EARLY_ACCESS_PASSWORD: 'ci-test-vip-password',
      // Pinned empty (not omitted) for the same reason as the password
      // fixtures above: getKlaviyoConfig() treats '' as unconfigured, same
      // as unset, so this keeps access-gate.spec.ts's "Klaviyo not
      // configured" test exercising the not-configured path deterministically
      // — instead of, the moment a developer's own .env.local gains real
      // Klaviyo credentials, silently switching to the real-API-call path
      // and POSTing sam@example.com into a live marketing list on every
      // local E2E run.
      KLAVIYO_PRIVATE_API_KEY: '',
      KLAVIYO_LIST_ID: '',
    },
  },
});

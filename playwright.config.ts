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
  // Four projects, one per DESIGN_SYSTEM.md §14/§15 breakpoint tier
  // (mobile/tablet/desktop/large-desktop) — ROADMAP.md Phase 12 "Cross-device
  // QA". Before this pass, only two tiers had real coverage: mobile-safari
  // (390px, below the `md` breakpoint) and chromium, whose default viewport
  // was assumed to need checking rather than guessed at — verified directly
  // (`devices['Desktop Chrome'].viewport`) to already be exactly 1280x720,
  // i.e. already sitting at/above Tailwind's `xl` (1280px) boundary, the
  // "large desktop" tier. That left the entire 768-1279px band — Tailwind's
  // `md` (768, tablet, 8-column grid) through the lower half of `lg` (1024,
  // desktop, 12-column grid + the PDP's 60/40 split) — with zero project
  // coverage; a handful of individual tests override the viewport to 375px
  // inline, but that's a one-off assertion, not tier coverage.
  //
  // 'tablet': devices['iPad Mini'] (768x1024, WebKit/Safari engine,
  // hasTouch/isMobile true) — a real Playwright-shipped iPad-class profile,
  // deliberately at exactly the `md` breakpoint's own lower boundary so the
  // grid/margin/header transition that activates there is genuinely
  // exercised, not just assumed to look fine above it. Runs WebKit (like
  // mobile-safari) because a real iPad is Safari, not Chrome.
  //
  // 'laptop': Desktop Chrome engine (mouse/trackpad, fine pointer, no touch —
  // deliberately NOT a touch-tablet profile) at a custom 1024x768 viewport —
  // the `lg` breakpoint's own lower boundary (12-column grid, PDP's sticky
  // 60/40 split, Interactive Model desktop sizing all first activate here)
  // and the one genuinely unique pixel range chromium's own 1280px viewport
  // never exercises. Distinct from 'tablet' in both engine and input model:
  // a small laptop/desktop window is a mouse-driven device even though its
  // width overlaps what a tablet might also use.
  //
  // Honest limitation (see DECISIONS.md D-056): this emulates CSS viewport
  // width/height and the `hasTouch`/pointer-media outcomes Playwright's
  // device profiles declare — it does not reproduce real touch-vs-mouse
  // hardware, a physical device's actual rendering quirks, or a tablet used
  // with an attached mouse/trackpad (fine pointer at a tablet-sized
  // viewport) as a single target. lib/motion/media.test.ts already unit-
  // tests both `hasFinePointerAndHover` outcomes directly via injected
  // matchMedia results — this config's job is real layout/DOM response to
  // viewport size and touch, not re-deriving that pointer/hover logic.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
    { name: 'tablet', use: { ...devices['iPad Mini'] } },
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
    },
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

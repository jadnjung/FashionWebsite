import { defineConfig } from '@playwright/test';
import demo from './playwright.demo.config';

// A separate server build keeps the standard five-collection fixture stable.
export default defineConfig({
  ...demo,
  metadata: {
    previewMode: 'demo',
    collectionScenario: 'continuation-45',
    browserTestProfile: 'demo-drop-grant-isolated',
    dropGrantFixture: true,
  },
  testDir: './tests/e2e-collections',
  reporter: [
    ...(process.env.CI ? [['github'] as ['github']] : []),
    ['html', { outputFolder: 'playwright-report-demo/collections', open: 'never' }],
  ],
  outputDir: 'test-results-demo/collections',
  webServer:
    process.env.PLAYWRIGHT_EXTERNAL_SERVER === '1'
      ? undefined
      : {
          ...demo.webServer,
          command: 'node scripts/run-browser-server.mjs',
          url: 'http://localhost:3000',
          reuseExistingServer: false,
          timeout: 240_000,
          env: {
            ...(demo.webServer && !Array.isArray(demo.webServer) ? demo.webServer.env : {}),
            PREVIEW_DEMO_MODE: '1',
            PREVIEW_COLLECTION_SCENARIO: 'continuation-45',
            BROWSER_TEST_DROP_GRANT_PROFILE: 'demo45-grant',
          },
        },
});

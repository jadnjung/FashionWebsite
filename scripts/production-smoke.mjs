import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const playwright = require.resolve('@playwright/test/cli');
for (const [config, specs] of [
  ['playwright.config.ts', ['smoke.spec.ts', 'access-gate.spec.ts']],
  [
    'playwright.demo.config.ts',
    ['shopping-journey.spec.ts', 'purchase-feedback.spec.ts', 'product-gallery.spec.ts'],
  ],
]) {
  const result = spawnSync(
    process.execPath,
    [playwright, 'test', '-c', config, ...specs, '--project=chromium'],
    {
      stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_PRODUCTION: '1' },
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

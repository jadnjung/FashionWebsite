import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const next = require.resolve('next/dist/bin/next');
const production = process.env.PLAYWRIGHT_PRODUCTION === '1';
const demo = process.env.PREVIEW_DEMO_MODE === '1';
const collectionScenario =
  demo && ['continuation-21', 'continuation-45'].includes(process.env.PREVIEW_COLLECTION_SCENARIO)
    ? process.env.PREVIEW_COLLECTION_SCENARIO
    : '';
const environment = {
  ...process.env,
  PREVIEW_DEMO_MODE: demo ? '1' : '',
  PREVIEW_COLLECTION_SCENARIO: collectionScenario,
  SHOPIFY_STORE_DOMAIN: '',
  SHOPIFY_STOREFRONT_API_TOKEN: '',
  KLAVIYO_PRIVATE_API_KEY: '',
  KLAVIYO_LIST_ID: '',
  ESQUE_DROP_ACCESS_CODE: '',
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: '',
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: '',
  NEXT_PUBLIC_SUPPORT_EMAIL: '',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_PREVIEW_ANALYTICS: demo ? '1' : '',
  BROWSER_TEST_PROFILE: demo ? 'demo-isolated' : 'unconfigured-isolated',
};
if (production) {
  const build = spawnSync(process.execPath, [next, 'build'], {
    stdio: 'inherit',
    env: environment,
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
}
const child = spawn(process.execPath, [next, production ? 'start' : 'dev'], {
  stdio: 'inherit',
  env: environment,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 1));

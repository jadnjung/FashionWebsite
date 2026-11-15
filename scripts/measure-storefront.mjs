import { chromium } from '@playwright/test';
const baseURL = process.env.MEASURE_BASE_URL ?? 'http://localhost:3000';
const browser = await chromium.launch({ args: ['--disable-webgl'] });
const samples = [];
try {
  for (let sample = 0; sample < 3; sample++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 200_000,
      uploadThroughput: 93_750,
    });
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__measure = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__measure.lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__measure.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(new URL('/products/preview-featherweight-crewneck', baseURL).href);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.waitForTimeout(2500);
    const initial = await page.evaluate(() => ({
      ...window.__measure,
      scriptBytes: performance
        .getEntriesByType('resource')
        .filter((e) => e.initiatorType === 'script')
        .reduce((sum, e) => sum + e.transferSize, 0),
    }));
    const start = performance.now();
    await page.getByRole('button', { name: /search/i }).click();
    const input = page.getByRole('searchbox');
    await input.fill('crewneck');
    await page
      .getByRole('dialog')
      .getByText('Featherweight Crewneck Sweater', { exact: true })
      .first()
      .waitFor();
    const searchMs = performance.now() - start;
    await page.keyboard.press('Escape');
    const variantStart = performance.now();
    await page.locator('label').filter({ hasText: /^M$/ }).first().click();
    await page
      .locator('label')
      .filter({ hasText: /^Ecru$/ })
      .first()
      .click();
    await page.getByRole('main').getByText('$136.00', { exact: true }).first().waitFor();
    const variantMs = performance.now() - variantStart;
    const galleryStart = performance.now();
    await page
      .getByRole('link', {
        name: 'Enlarge Featherweight Crewneck Sweater, image 1 of 3',
        exact: true,
      })
      .press('Enter');
    const viewer = page.getByRole('dialog', {
      name: 'Featherweight Crewneck Sweater image viewer',
    });
    await viewer.waitFor();
    const galleryMs = performance.now() - galleryStart;
    await viewer.getByRole('button', { name: 'Close image viewer', exact: true }).click();
    const bagStart = performance.now();
    await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).first().click();
    await page.getByRole('status').filter({ hasText: 'Added to demo bag.' }).first().waitFor();
    const bagMs = performance.now() - bagStart;
    const activated = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((e) => e.initiatorType === 'script')
        .reduce((sum, e) => sum + e.transferSize, 0),
    );
    samples.push({
      sample: sample + 1,
      ...initial,
      searchInteractionMs: searchMs,
      variantInteractionMs: variantMs,
      galleryInteractionMs: galleryMs,
      bagInteractionMs: bagMs,
      activatedScriptBytes: activated,
    });
    await context.close();
  }
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        viewport: '390x844',
        cpuSlowdown: 4,
        latencyMs: 150,
        downloadBytesPerSecond: 200000,
        cache: 'disabled',
        webgl: false,
        samples,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}

import { expect, test, type Page } from '@playwright/test';
import { DROP_ACCESS_COOKIE_NAME, DROP_ACCESS_EVENT_COOKIE_NAME } from '@/lib/access/cookies';

const HANDLE = 'demo-collection-021';
const FIXTURE_CODE = 'fixture-drop-grant-53';
type CapturedEvent = { name: string; properties: Record<string, unknown> };

async function servedCookieSecurity(page: Page) {
  const mode = await page.locator('html').getAttribute('data-render-mode');
  expect(['development', 'production']).toContain(mode);
  if (process.env.PLAYWRIGHT_PRODUCTION === '1') expect(mode).toBe('production');
  return mode === 'production';
}

async function captureEvents(page: Page) {
  const events: CapturedEvent[] = [];
  await page.exposeFunction('captureDropEvent', (event: CapturedEvent) => {
    events.push(event);
  });
  await page.addInitScript(() => {
    const target = window as typeof window & {
      dropDocument: string;
      captureDropEvent: (event: CapturedEvent) => Promise<void>;
    };
    target.dropDocument = crypto.randomUUID();
    window.addEventListener('esque:analytics', (event) => {
      void target.captureDropEvent((event as CustomEvent).detail);
    });
  });
  return events;
}

test('real configured action grants once through the same-path form replacement', async ({
  page,
  context,
  browserName,
}, testInfo) => {
  test.skip(
    testInfo.config.metadata.dropGrantFixture !== true || browserName !== 'chromium',
    'Requires the isolated synthetic-code build; production Secure cookies over local HTTP are verified in Chromium.',
  );
  const events = await captureEvents(page);
  const grants = () => events.filter((event) => event.name === 'drop_access_granted');
  await page.goto(`/collections/${HANDLE}`);
  const secure = await servedCookieSecurity(page);
  await expect(page.getByLabel('EARLY ACCESS CODE', { exact: true })).toBeVisible();
  const document = await page.evaluate(
    () => (window as typeof window & { dropDocument: string }).dropDocument,
  );
  await page.getByRole('link', { name: 'BAG (0)', exact: true }).click();
  await expect(page).toHaveURL(/\/bag$/);
  await expect(page.getByRole('heading', { name: 'Demo bag', exact: true })).toBeVisible();
  expect(grants()).toEqual([]);
  await page.goBack();
  await expect(page.getByLabel('EARLY ACCESS CODE', { exact: true })).toBeVisible();
  await page.getByLabel('EARLY ACCESS CODE', { exact: true }).fill('fixture-wrong-53');
  await page.getByRole('button', { name: 'ENTER', exact: true }).click();
  await expect(page.getByLabel('EARLY ACCESS CODE', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(grants()).toEqual([]);
  expect(
    (await context.cookies()).some(
      (cookie) =>
        cookie.name === DROP_ACCESS_COOKIE_NAME || cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME,
    ),
  ).toBe(false);
  await page.getByLabel('EARLY ACCESS CODE', { exact: true }).fill(FIXTURE_CODE);
  await page.getByRole('button', { name: 'ENTER', exact: true }).click();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(24);
  await expect(page.getByLabel('EARLY ACCESS CODE', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/collections/${HANDLE}$`));
  expect(
    await page.evaluate(() => (window as typeof window & { dropDocument: string }).dropDocument),
  ).toBe(document);
  await expect
    .poll(grants)
    .toEqual([{ name: 'drop_access_granted', properties: { collection_handle: HANDLE } }]);
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === DROP_ACCESS_COOKIE_NAME)).toMatchObject({
    value: HANDLE,
    httpOnly: true,
    secure,
  });
  expect(cookies.some((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME)).toBe(false);
  expect(events.filter((event) => event.name === 'drop_access_attempt')).toHaveLength(2);
  expect(JSON.stringify(events)).not.toContain(FIXTURE_CODE);
  expect(JSON.stringify(events)).not.toContain('fixture-wrong-53');
  await page.getByRole('link', { name: 'BAG (0)', exact: true }).click();
  await expect(page).toHaveURL(/\/bag$/);
  await expect(page.getByRole('heading', { name: 'Demo bag', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(24);
  await page.reload();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(24);
  expect(grants()).toHaveLength(1);
});

test('native no-script action preserves its signal until a later hydrated load consumes it', async ({
  page,
  context,
  browserName,
}, testInfo) => {
  test.skip(
    testInfo.config.metadata.dropGrantFixture !== true || browserName !== 'chromium',
    'Requires the isolated synthetic-code build and Chromium script-execution control.',
  );
  const events = await captureEvents(page);
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setScriptExecutionDisabled', { value: true });
  await page.goto(`/collections/${HANDLE}`);
  const secure = await servedCookieSecurity(page);
  await page.getByLabel('EARLY ACCESS CODE', { exact: true }).fill(FIXTURE_CODE);
  await page.getByRole('button', { name: 'ENTER', exact: true }).click();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(24);
  const granted = await context.cookies();
  expect(granted.find((cookie) => cookie.name === DROP_ACCESS_COOKIE_NAME)).toMatchObject({
    value: HANDLE,
    httpOnly: true,
    secure,
  });
  expect(granted.find((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME)?.value).toBe(
    HANDLE,
  );
  expect(events).toEqual([]);
  await session.send('Emulation.setScriptExecutionDisabled', { value: false });
  await page.reload();
  await expect
    .poll(() => events.filter((event) => event.name === 'drop_access_granted'))
    .toEqual([{ name: 'drop_access_granted', properties: { collection_handle: HANDLE } }]);
  expect(
    (await context.cookies()).some((cookie) => cookie.name === DROP_ACCESS_EVENT_COOKIE_NAME),
  ).toBe(false);
  await page.reload();
  await expect(page.locator('main a[data-cursor="VIEW"]')).toHaveCount(24);
  expect(events.filter((event) => event.name === 'drop_access_granted')).toHaveLength(1);
  expect(JSON.stringify(events)).not.toContain(FIXTURE_CODE);
  await session.detach();
});

import { expect, test, type Locator } from '@playwright/test';

const productPath = '/products/preview-featherweight-crewneck';
const productTitle = 'Featherweight Crewneck Sweater';

async function swipe(image: Locator, deltaX: number, deltaY = 0) {
  // Exercise the same touch events across Chromium and WebKit. This keeps
  // vertical-intent coverage available in desktop projects as well.
  await image.evaluate(
    (element, movement) => {
      const start = { clientX: 200, clientY: 200 };
      const end = { clientX: 200 + movement.deltaX, clientY: 200 + movement.deltaY };
      for (const [type, touches, changedTouches] of [
        ['touchstart', [start], [start]],
        ['touchend', [], [end]],
      ] as const) {
        const event = new Event(type, { bubbles: true });
        Object.defineProperties(event, {
          touches: { value: touches },
          changedTouches: { value: changedTouches },
        });
        element.dispatchEvent(event);
      }
    },
    { deltaX, deltaY },
  );
}

test('gallery navigation keeps the server-rendered images reachable with keyboard controls', async ({
  page,
}) => {
  await page.goto(productPath);
  const gallery = page.getByRole('region', { name: `${productTitle} images`, exact: true });
  const images = gallery.getByRole('link', { name: /Enlarge .* image \d of 3/ });
  await expect(images).toHaveCount(3);
  await expect(gallery.getByRole('status')).toHaveText('Image 1 of 3');
  await gallery.getByRole('button', { name: 'Next image', exact: true }).click();
  await expect(gallery.getByRole('status')).toHaveText('Image 2 of 3');
  await expect(images.nth(1)).toBeInViewport();
  await images.nth(1).focus();
  await images.nth(1).press('ArrowRight');
  await expect(images.nth(2)).toBeFocused();
  await expect(gallery.getByRole('status')).toHaveText('Image 3 of 3');
  await images.nth(2).press('ArrowRight');
  await expect(images.first()).toBeFocused();
  await expect(gallery.getByRole('status')).toHaveText('Image 1 of 3');
});

test('fullscreen image navigation, zoom, focus trap and Escape work together', async ({ page }) => {
  await page.goto(productPath);
  const trigger = page.getByRole('link', { name: `Enlarge ${productTitle}, image 2 of 3` });
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: `${productTitle} image viewer` });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('status')).toHaveText('Image 2 of 3');
  await dialog.press('ArrowRight');
  await expect(dialog.getByRole('status')).toHaveText('Image 3 of 3');
  await dialog.getByRole('button', { name: 'Next image', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Image 1 of 3');
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Zoom out', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const imageViewport = dialog.getByRole('region', { name: 'Product image', exact: true });
  await expect
    .poll(() => imageViewport.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await imageViewport.focus();
  await imageViewport.press('ArrowRight');
  await expect(dialog.getByRole('status')).toHaveText('Image 1 of 3');
  await dialog.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Zoom in', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  const close = dialog.getByRole('button', { name: 'Close image viewer', exact: true });
  await close.focus();
  await close.press('Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('horizontal gallery swipes change images while vertical gestures preserve scrolling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(productPath);
  const gallery = page.getByRole('region', { name: `${productTitle} images`, exact: true });
  const images = gallery.getByRole('link', { name: /Enlarge .* image \d of 3/ });
  await swipe(images.first(), -80, 140);
  await expect(gallery.getByRole('status')).toHaveText('Image 1 of 3');
  await swipe(images.first(), -100, 10);
  await expect(gallery.getByRole('status')).toHaveText('Image 2 of 3');
  await expect(images.nth(1)).toBeInViewport();
  await swipe(images.nth(1), 100, 10);
  await expect(gallery.getByRole('status')).toHaveText('Image 1 of 3');
  await expect(page.getByRole('dialog', { name: `${productTitle} image viewer` })).toBeHidden();
});

test('the server response contains the full gallery and original image links before hydration', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  try {
    await page.goto(productPath);
    // The App Router streams this route into a hidden boundary until hydration.
    // Inspect its server markup directly, independently of client enhancement.
    const gallery = page.locator(`[aria-label="${productTitle} images"]`);
    const images = gallery.locator('img');
    await expect(images).toHaveCount(3);
    await expect(images.first()).not.toHaveAttribute('loading', 'lazy');
    await expect(images.nth(1)).toHaveAttribute('loading', 'lazy');
    await expect(gallery.locator('a[data-gallery-image="0"]')).toHaveAttribute(
      'href',
      /\.(svg|webp|png|jpe?g)(\?.*)?$/,
    );
  } finally {
    await context.close();
  }
});

test('a failed fullscreen image can be retried without closing the viewer', async ({
  browser,
  baseURL,
}) => {
  // A fixed desktop context requests a larger fullscreen source than the
  // server-rendered 58vw stack, avoiding an already decoded image-cache hit.
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  let fullscreenRequests = 0;
  let releaseFailure = () => {};
  const heldFailure = new Promise<void>((resolve) => {
    releaseFailure = resolve;
  });
  await page.route('**/_next/image?*', async (route) => {
    const url = new URL(route.request().url());
    if (
      url.searchParams.get('url') === '/preview-demo/product-3.jpg' &&
      Number(url.searchParams.get('w')) >= 1080
    ) {
      fullscreenRequests += 1;
      if (fullscreenRequests === 1) {
        await heldFailure;
        await route.abort('failed');
        return;
      }
    }
    await route.continue();
  });

  try {
    await page.goto(productPath);
    await page.getByRole('link', { name: `Enlarge ${productTitle}, image 1 of 3` }).press('Enter');
    const dialog = page.getByRole('dialog', { name: `${productTitle} image viewer` });
    await expect(dialog.getByText('Loading image…', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('img')).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => fullscreenRequests).toBe(1);
    releaseFailure();
    await expect(dialog.getByRole('alert')).toHaveText('This image could not load. Try again.');
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', /Demo gallery image 1/);
    await dialog.getByRole('button', { name: 'Retry image', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveCount(0);
    await expect(dialog.getByText('Loading image…', { exact: true })).toHaveCount(0);
    await expect
      .poll(() => dialog.getByRole('img').evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
    await expect(dialog.getByRole('img')).toHaveAttribute('aria-busy', 'false');
    await expect(dialog.getByRole('region', { name: 'Product image', exact: true })).toBeFocused();
    expect(fullscreenRequests).toBeGreaterThanOrEqual(2);
    await dialog.getByRole('button', { name: 'Next image', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Image 2 of 3');
    await expect(dialog.getByRole('alert')).toHaveCount(0);
  } finally {
    releaseFailure();
    await context.close();
  }
});

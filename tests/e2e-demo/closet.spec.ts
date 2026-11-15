import { test, expect, type Page } from '@playwright/test';

// Isolate software-GPU resources from the other customer-journey workers.
test.use({ launchOptions: { args: ['--use-angle=swiftshader'] } });

// Homepage Collection Closet (DECISIONS.md D-089) against Demo Mode's six
// Collection 001 fixtures. Drives the closet through its keyboard/screen-
// reader controls — the same state machine the 3D canvas's pointer events
// use — so assertions are on real DOM state, not pixels.

const PIECES = [
  'Featherweight Crewneck Sweater',
  'Tailored Wide-Leg Trouser Set',
  'Fluid Knit Long-Sleeve',
  'Silk Cami Layering Top',
  'Relaxed Linen Trouser',
  'Velvet Evening Jacket',
];

async function gotoReadyCloset(page: Page) {
  // Software shader compilation belongs to functional coverage, with its own
  // runner budget. Customer performance is measured without these overrides.
  // CI uses software WebGL to exercise the real scene. Override capability
  // metadata only in these functional tests, separately from fallback tests.
  await page.addInitScript(() => {
    Object.defineProperties(navigator, {
      hardwareConcurrency: { value: 8 },
      deviceMemory: { value: 8 },
    });
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      options?: WebGLContextAttributes,
    ) {
      return getContext.call(
        this,
        type,
        type === 'webgl2' ? { ...options, failIfMajorPerformanceCaveat: false } : options,
      );
    } as typeof getContext;
    const getParameter = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function (parameter: number) {
      if (parameter === 37446 || parameter === this.RENDERER) return 'Test hardware renderer';
      return getParameter.call(this, parameter);
    };
  });
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Collection Hero' });
  // Waits for the closet to mount (it only does when WebGL is available),
  // not for its canvas fade-in: on GPU-less CI runners everything is
  // software-rendered and the first frame (shader compiles, environment
  // lighting) can take well over 30s, while the closet's buttons, state and
  // info panel — what these tests assert — work from the moment it mounts.
  await expect(hero.locator('[data-closet] li button')).toHaveCount(PIECES.length, {
    timeout: 30_000,
  });
  return hero;
}

test.describe('Collection Closet (Demo Mode)', () => {
  test.describe.configure({ mode: 'default' });
  test.slow();
  test('keeps shopping responsive when WebGL 2 is software-rendered', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperties(navigator, {
        hardwareConcurrency: { value: 8 },
        deviceMemory: { value: 8 },
      });
      // Exercise the renderer-name guard even when the browser would reject
      // this context through its performance-caveat hint instead.
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        options?: WebGLContextAttributes,
      ) {
        return getContext.call(
          this,
          type,
          type === 'webgl2' ? { ...options, failIfMajorPerformanceCaveat: false } : options,
        );
      } as typeof getContext;
      const original = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function (parameter: number) {
        if (parameter === 37446 || parameter === this.RENDERER) {
          (window as Window & { rendererChecked?: boolean }).rendererChecked = true;
          return 'ANGLE SwiftShader Device';
        }
        return original.call(this, parameter);
      };
    });
    await page.goto('/');
    const hero = page.getByRole('region', { name: 'Collection Hero' });
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { rendererChecked?: boolean }).rendererChecked),
      )
      .toBe(true);
    // The menu interaction establishes that the client has hydrated.
    await page.getByRole('button', { name: 'MENU', exact: true }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'CLOSE' }).click();
    await expect(hero.locator('[data-closet]')).toHaveCount(0);
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeVisible();
  });

  test('keeps the static hero usable when only WebGL 1 is available', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
      Object.defineProperty(navigator, 'deviceMemory', { value: 8 });
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        contextId,
        options,
      ) {
        if (contextId === 'webgl2') return null;
        return getContext.call(this, contextId, options);
      } as typeof getContext;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // The browser still supports WebGL 1, reproducing the compatibility
    // mismatch with three.js's WebGL 2-only renderer.
    expect(
      await page.evaluate(() => {
        const context = document.createElement('canvas').getContext('webgl');
        if (!context) return false;
        context.getExtension('WEBGL_lose_context')?.loseContext();
        return true;
      }),
    ).toBe(true);
    const hero = page.getByRole('region', { name: 'Collection Hero' });
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeVisible();
    await expect(hero.locator('[data-closet]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('hangs the curated hero pieces, each with an accessible button', async ({ page }) => {
    const hero = await gotoReadyCloset(page);
    await expect(hero.locator('canvas')).toHaveCount(1);
    for (const name of PIECES) {
      await expect(hero.getByRole('button', { name: new RegExp(`^${name}, \\$`) })).toHaveCount(1);
    }
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeVisible();
  });

  test('keyboard: Enter pulls a piece out with its details; Escape returns it and restores focus', async ({
    page,
  }) => {
    const hero = await gotoReadyCloset(page);
    const closet = hero.locator('[data-closet]');
    const button = hero.getByRole('button', { name: /^Velvet Evening Jacket, \$/ });

    await button.focus();
    await page.keyboard.press('Enter');

    await expect(closet).toHaveAttribute('data-closet-selected', 'true');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(hero.getByRole('heading', { name: 'Velvet Evening Jacket' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'VIEW PRODUCT' })).toHaveAttribute(
      'href',
      '/products/preview-velvet-evening-jacket',
    );
    // The headline and ENTER COLLECTION step aside (and leave the tab order).
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeHidden({
      timeout: 15_000,
    });

    await page.keyboard.press('Escape');
    await expect(closet).toHaveAttribute('data-closet-selected', 'false');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toBeFocused();
    await expect(hero.getByRole('link', { name: 'ENTER COLLECTION' })).toBeVisible();
  });

  test('the info panel announces the selection and CLOSE returns the piece', async ({ page }) => {
    const hero = await gotoReadyCloset(page);
    const panel = hero.locator('[data-closet-panel]');
    await expect(panel).toHaveAttribute('aria-live', 'polite');
    await expect(panel).toBeEmpty();

    const trigger = hero.getByRole('button', { name: /^Silk Cami Layering Top, \$/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toContainText('Silk Cami Layering Top');
    await expect(panel).toContainText('$84.00');

    const close = panel.getByRole('button', { name: 'CLOSE' });
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toBeFocused();
    await expect(hero.locator('[data-closet]')).toHaveAttribute('data-closet-selected', 'false');
    await expect(panel).toBeEmpty();
  });

  test('works under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const hero = await gotoReadyCloset(page);
    await hero.getByRole('button', { name: /^Fluid Knit Long-Sleeve, \$/ }).focus();
    await page.keyboard.press('Enter');
    await expect(hero.getByRole('heading', { name: 'Fluid Knit Long-Sleeve' })).toBeVisible();
  });

  test('pause persists through selection and live reduced-motion changes', async ({ page }) => {
    const hero = await gotoReadyCloset(page);
    const closet = hero.locator('[data-closet]');
    const pause = hero.getByRole('button', { name: 'Pause closet movement', exact: true });
    await pause.focus();
    await pause.press('Enter');
    const resume = hero.getByRole('button', { name: 'Resume closet movement', exact: true });
    await expect(resume).toHaveAttribute('aria-pressed', 'true');
    await expect(closet).toHaveAttribute('data-closet-motion', 'paused', { timeout: 15_000 });
    const trigger = hero.getByRole('button', { name: /^Fluid Knit Long-Sleeve, \$/ });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(closet).toHaveAttribute('data-closet-motion', 'paused', { timeout: 15_000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(closet).toHaveAttribute('data-closet-motion', 'reduced', { timeout: 15_000 });
    await expect(
      hero.getByRole('button', { name: 'Closet movement reduced', exact: true }),
    ).toBeDisabled();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(closet).toHaveAttribute('data-closet-motion', 'paused', { timeout: 15_000 });
    await expect(trigger).toBeFocused();
    await resume.click();
    await expect(closet).toHaveAttribute('data-closet-motion', 'playing', { timeout: 15_000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(closet).toHaveAttribute('data-closet-motion', 'reduced', { timeout: 15_000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(closet).toHaveAttribute('data-closet-motion', 'playing', { timeout: 15_000 });
    await expect(hero.getByRole('heading', { name: 'Fluid Knit Long-Sleeve' })).toBeVisible();
  });

  test('loads with no uncaught page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await gotoReadyCloset(page);
    expect(errors).toEqual([]);
  });
});

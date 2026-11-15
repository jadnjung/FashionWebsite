import { expect, test, type Locator } from '@playwright/test';

test('mobile header keeps every control inside its bounds with 200% text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/bag');
  const header = page.getByRole('banner');
  await expect(header).toHaveCSS('height', '72px');

  await header.evaluate((element) => {
    // Capture every computed size before writing, so inherited text is doubled once.
    const sizes = [element, ...element.querySelectorAll<HTMLElement>('*')].map((node) => {
      const style = getComputedStyle(node);
      return { node, font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
    });
    for (const { node, font, line } of sizes) {
      node.style.fontSize = `${font * 2}px`;
      if (Number.isFinite(line)) node.style.lineHeight = `${line * 2}px`;
    }
  });

  await expect(header.getByRole('button', { name: 'MENU', exact: true })).toHaveCSS(
    'font-size',
    '32px',
  );
  const bounds = await header.evaluate((element) => {
    const headerRect = element.getBoundingClientRect();
    return {
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      top: headerRect.top,
      bottom: headerRect.bottom,
      controls: [...element.querySelectorAll('a, button')].map((control) => {
        const rect = control.getBoundingClientRect();
        return {
          name: control.textContent,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
    };
  });
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.width);
  for (const control of bounds.controls) {
    expect(control.left, control.name ?? '').toBeGreaterThanOrEqual(0);
    expect(control.right, control.name ?? '').toBeLessThanOrEqual(390);
    expect(control.top, control.name ?? '').toBeGreaterThanOrEqual(bounds.top);
    expect(control.bottom, control.name ?? '').toBeLessThanOrEqual(bounds.bottom);
  }
  await header.getByRole('button', { name: 'MENU', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(header.getByRole('button', { name: 'MENU', exact: true })).toBeFocused();
});

async function appearance(radio: Locator) {
  return radio.evaluate((element: HTMLInputElement) => {
    const style = getComputedStyle(element.labels![0]);
    return {
      background: style.backgroundColor,
      color: style.color,
      border: `${style.borderStyle} ${style.borderWidth} ${style.borderColor}`,
      decoration: `${style.textDecorationLine} ${style.textDecorationStyle}`,
    };
  });
}

test('forced colors preserves a selected variant cue after focus moves away', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Forced-colors emulation is verified in Chromium.');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/products/preview-featherweight-crewneck');
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  const size = page.getByRole('group', { name: 'Size', exact: true });
  const selected = size.getByRole('radio', { name: 'M', exact: true });
  const unselected = size.getByRole('radio', { name: 'S', exact: true });
  await selected.focus();
  await selected.press('Space');
  await page.getByRole('banner').getByRole('button', { name: 'MENU', exact: true }).focus();
  await expect(selected).toBeChecked();
  await expect(selected).not.toBeFocused();
  expect(await appearance(selected)).not.toEqual(await appearance(unselected));

  await unselected.focus();
  await expect(unselected).toBeFocused();
  await expect
    .poll(() =>
      unselected.evaluate(
        (element: HTMLInputElement) => getComputedStyle(element.labels![0]).outlineStyle,
      ),
    )
    .not.toBe('none');

  const disabled = size.getByRole('radio', { name: 'XS', exact: true });
  await expect(disabled).toBeDisabled();
  expect((await appearance(disabled)).decoration).toContain('line-through');
  expect(
    await disabled.evaluate(
      (element: HTMLInputElement) => getComputedStyle(element.labels![0]).opacity,
    ),
  ).toBe('1');
});

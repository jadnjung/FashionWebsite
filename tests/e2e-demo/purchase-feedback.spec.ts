import { expect, test, type Locator } from '@playwright/test';

async function selectRadio(radio: Locator) {
  await radio.focus();
  await radio.press('Space');
}

test('PDP explains purchasing availability after a valid selection and clears feedback on quantity edits', async ({
  page,
}) => {
  await page.goto('/products/preview-featherweight-crewneck');
  const add = page.getByRole('button', { name: 'ADD TO BAG', exact: true }).first();
  const status = page.getByRole('status').filter({ hasText: /Purchasing is not available yet\./ });
  await expect(add).toBeDisabled();
  await expect(status).toHaveCount(0);
  await selectRadio(page.getByRole('radio', { name: 'M', exact: true }).first());
  await selectRadio(page.getByRole('radio', { name: 'Black', exact: true }).first());
  await expect(add).toBeEnabled();
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(status).toBeVisible();
  await expect(add).toBeFocused();
  await page.getByRole('spinbutton', { name: 'Quantity' }).fill('2');
  await expect(status).toHaveCount(0);
  await add.focus();
  await add.press('Enter');
  await expect(status).toBeVisible();
});

test('Quick Add gives purchasing feedback and starts fresh after reopening', async ({ page }) => {
  await page.goto('/new');
  const trigger = page.getByRole('button', { name: 'QUICK ADD', exact: true }).first();
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: /^Quick Add/ });
  const add = dialog.getByRole('button', { name: 'ADD TO BAG', exact: true });
  const status = dialog
    .getByRole('status')
    .filter({ hasText: /Purchasing is not available yet\./ });
  await expect(add).toBeDisabled();
  await selectRadio(dialog.getByRole('radio', { name: 'M', exact: true }));
  await selectRadio(dialog.getByRole('radio', { name: 'Black', exact: true }));
  await add.focus();
  await add.press('Enter');
  await expect(status).toBeVisible();
  await dialog.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(dialog).toBeHidden();
  await trigger.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(add).toBeDisabled();
  await expect(status).toHaveCount(0);
});

test('Shop the Look gives purchasing feedback and clears it when the selection or open state changes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Shop the Look' });
  const grid = section.getByRole('list', { name: 'All looks' });
  await expect(grid).toBeVisible();
  const trigger = grid.getByRole('button', { name: /^LOOK 02,/ });
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Shop the Look' });
  await expect(dialog).toBeVisible();
  const add = dialog.getByRole('button', { name: 'ADD LOOK', exact: true });
  const status = dialog
    .getByRole('status')
    .filter({ hasText: /Purchasing is not available yet\./ });
  await expect(add).toBeDisabled();
  for (const group of await dialog.getByRole('group', { name: 'Size', exact: true }).all()) {
    await selectRadio(group.getByRole('radio', { name: 'M', exact: true }));
  }
  for (const group of await dialog.getByRole('group', { name: 'Color', exact: true }).all()) {
    await selectRadio(group.getByRole('radio', { name: 'Black', exact: true }));
  }
  await expect(add).toBeEnabled();
  await add.focus();
  await add.press('Enter');
  await expect(status).toBeVisible();
  await dialog.getByRole('checkbox').first().uncheck();
  await expect(status).toHaveCount(0);
  await add.focus();
  await add.press('Enter');
  await expect(status).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await trigger.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(status).toHaveCount(0);
});

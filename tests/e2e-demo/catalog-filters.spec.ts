import { test, expect } from '@playwright/test';

// lib/catalog/filters.ts's parseCatalogFilters/FilterBar.tsx — a maxPrice
// below minPrice is a contradictory range, dropped rather than silently
// querying a range that would read as "no products". FilterBar surfaces
// that drop instead of leaving it silent. Needs Demo Mode so FilterBar
// renders over real fixture products instead of the unconfigured-store
// error boundary — hence this suite (playwright.demo.config.ts).
test.describe('FilterBar — dropped max-price feedback', () => {
  test('decimal prices submit and preserve sort and availability', async ({ page }) => {
    await page.goto('/new?sort=price-asc&available=1');
    await page.getByRole('spinbutton', { name: 'Min Price' }).fill('95.50');
    await page.getByRole('spinbutton', { name: 'Max Price' }).fill('188.50');
    await page.getByRole('button', { name: 'APPLY', exact: true }).click();
    await expect(page).toHaveURL(/minPrice=95\.50/);
    const params = new URL(page.url()).searchParams;
    expect(params.get('maxPrice')).toBe('188.50');
    expect(params.get('sort')).toBe('price-asc');
    expect(params.get('available')).toBe('1');
    await expect(page.getByRole('link', { name: /Fluid Knit Long-Sleeve/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Velvet Evening Jacket/ })).toHaveCount(0);
  });

  test('maxPrice below minPrice: field renders blank, note is visible, aria-describedby wires it to the input', async ({
    page,
  }) => {
    await page.goto('/tops?minPrice=200&maxPrice=50');
    const maxPriceInput = page.getByRole('spinbutton', { name: 'Max Price' });
    const note = page.getByText('Max price below min — ignored.');

    await expect(maxPriceInput).toHaveValue('');
    await expect(note).toBeVisible();

    const describedBy = await maxPriceInput.getAttribute('aria-describedby');
    expect(describedBy).toBe('max-price-dropped-note');
    await expect(page.locator(`#${describedBy}`)).toHaveText('Max price below min — ignored.');

    // minPrice itself is untouched — only maxPrice was dropped.
    await expect(page.getByRole('spinbutton', { name: 'Min Price' })).toHaveValue('200');
  });

  test('a valid range (minPrice < maxPrice): no note, no aria-describedby', async ({ page }) => {
    await page.goto('/tops?minPrice=50&maxPrice=200');
    const maxPriceInput = page.getByRole('spinbutton', { name: 'Max Price' });

    await expect(maxPriceInput).toHaveValue('200');
    await expect(page.getByText('Max price below min — ignored.')).toHaveCount(0);
    await expect(maxPriceInput).not.toHaveAttribute('aria-describedby');
  });

  test('no filters at all: no note', async ({ page }) => {
    await page.goto('/tops');
    await expect(page.getByText('Max price below min — ignored.')).toHaveCount(0);
    await expect(page.getByRole('spinbutton', { name: 'Max Price' })).toHaveValue('');
  });

  // Boundary: minPrice === maxPrice is a valid (if degenerate) single-price
  // range, not a contradictory one — must not be dropped (parseCatalogFilters
  // only drops a strictly-lesser maxPrice).
  test('minPrice equal to maxPrice is a valid range, not dropped', async ({ page }) => {
    await page.goto('/tops?minPrice=100&maxPrice=100');
    const maxPriceInput = page.getByRole('spinbutton', { name: 'Max Price' });

    await expect(maxPriceInput).toHaveValue('100');
    await expect(page.getByText('Max price below min — ignored.')).toHaveCount(0);
    await expect(maxPriceInput).not.toHaveAttribute('aria-describedby');
  });
});

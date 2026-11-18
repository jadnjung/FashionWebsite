import { afterEach, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { isValidElement, type ReactNode } from 'react';
import { CategoryListing } from './CategoryListing';
import { FilterBar } from './FilterBar';
import * as catalog from '@/lib/catalog/products';
import { analyzeCatalogSelections, parseCatalogFilters } from '@/lib/catalog/filters';

afterEach(() => vi.restoreAllMocks());

for (const group of ['size', 'color', 'collection']) {
  test(`over-budget ${group} submission retains every choice without any catalog lookup`, async () => {
    const lookup = vi
      .spyOn(catalog, 'getCatalogPage')
      .mockRejectedValue(new Error('unexpected catalog lookup'));
    const choices = Array.from({ length: 21 }, (_, index) => `${group}-${index + 1}`);
    const html = renderToStaticMarkup(
      await CategoryListing({
        category: 'new',
        searchParams: {
          [group]: choices,
          sort: 'price-desc',
          available: '1',
          minPrice: '95.5',
          after: 'stale',
        },
      }),
    );
    expect(lookup).not.toHaveBeenCalled();
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('id="catalog-results"');
    expect(html).not.toContain('aria-label="Product pages"');
    expect(html).not.toContain('aria-label="Filter option pages"');
    const inputs = html.match(new RegExp(`<input[^>]+name="${group}"[^>]*>`, 'g')) ?? [];
    expect(inputs).toHaveLength(21);
    expect(inputs.every((input) => input.includes('checked=""'))).toBe(true);
    expect(html).toContain('name="sort" value="price-desc"');
    expect(html).toContain('name="minPrice" value="95.5"');
  });
}

test('multiple over-budget groups preserve all normalized drafts and the other criteria atomically', async () => {
  const lookup = vi
    .spyOn(catalog, 'getCatalogPage')
    .mockRejectedValue(new Error('unexpected catalog lookup'));
  const sizes = Array.from({ length: 22 }, (_, index) => `Size ${index + 1}`);
  const colors = Array.from({ length: 21 }, (_, index) => `Color ${index + 1}`);
  const html = renderToStaticMarkup(
    await CategoryListing({
      category: 'tops',
      searchParams: {
        size: sizes,
        color: colors,
        collection: 'INVALID HANDLE',
        maxPrice: '999.50',
        sort: 'price-desc',
        available: '1',
      },
    }),
  );
  expect(lookup).not.toHaveBeenCalled();
  expect(html.match(/name="size"[^>]*checked=""/g)).toHaveLength(22);
  expect(html.match(/name="color"[^>]*checked=""/g)).toHaveLength(21);
  expect(html).toContain('value="INVALID HANDLE"');
  expect(html.match(/aria-invalid="true"/g)).toHaveLength(2);
  expect(html).toContain('name="maxPrice" value="999.5"');
  expect(html).toContain('Clear Filters');
  expect(html).not.toContain('id="catalog-results"');
});

test('large recovery drafts retain every checkbox without quadratic per-value removal URLs', async () => {
  vi.spyOn(catalog, 'getCatalogPage').mockRejectedValue(new Error('unexpected catalog lookup'));
  const render = async (count: number) =>
    renderToStaticMarkup(
      await CategoryListing({
        category: 'new',
        searchParams: { size: Array.from({ length: count }, (_, index) => `Size ${index + 1}`) },
      }),
    );
  const small = await render(100);
  const large = await render(1000);
  expect(large.match(/name="size"[^>]*checked=""/g)).toHaveLength(1000);
  expect(large.includes('aria-label="Remove size')).toBe(false);
  expect(large).toContain('Clear Filters');
  expect(large.length).toBeLessThan(small.length * 15);
});

test('recovery form identity includes choices beyond the bounded first 20 while option paging retains it', () => {
  function formKey(node: ReactNode): string | null | undefined {
    if (Array.isArray(node)) return node.map(formKey).find((key) => key !== undefined);
    if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
    return node.type === 'form' ? node.key : formKey(node.props.children);
  }
  const sizes = Array.from({ length: 20 }, (_, index) => `Size ${index + 1}`);
  const key = (last: string, optionsAfter?: string) => {
    const searchParams = { size: [...sizes, last], optionsAfter };
    return formKey(
      FilterBar({
        pathname: '/new',
        searchParams,
        filters: parseCatalogFilters(searchParams),
        recoverySelections: analyzeCatalogSelections(searchParams).selections,
      }),
    );
  };
  expect(key('Size 21')).toBeTruthy();
  expect(key('Size 21')).not.toBe(key('Size 22'));
  expect(key('Size 21')).toBe(key('Size 21', 'another-option-page'));
});

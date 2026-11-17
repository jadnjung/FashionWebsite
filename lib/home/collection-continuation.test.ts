import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CollectionsIndex } from '@/app/(storefront)/collections/CollectionsIndex';
import { ArchiveIndex } from '@/components/archive/ArchiveIndex';
import { getClosetCollection } from '@/lib/home/closet';
import { getUpcomingDrop } from '@/lib/home/upcoming-drop';
import * as collectionsModule from '@/lib/shopify/collections';
import * as productsModule from '@/lib/shopify/products';

afterEach(() => vi.restoreAllMocks());

function summaries(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `collection-${index}`,
    handle: `collection-${index}`,
    title: `Collection ${index}`,
    dropStatus: 'archived',
    dropDate: null as string | null,
    archivedAt: '2026-01-01T00:00:00Z' as string | null,
  }));
}

function sourcePages(collections: collectionsModule.CollectionSummary[]) {
  return vi
    .spyOn(collectionsModule, 'getCollections')
    .mockImplementation(async (first = 20, after) => {
      const offset = after ? Number(after) : 0;
      const page = collections.slice(offset, offset + first);
      return {
        collections: page,
        hasNextPage: offset + page.length < collections.length,
        endCursor: page.length ? String(offset + page.length) : null,
      };
    });
}

describe('collection continuation through normal entry points', () => {
  test('empty archive copy reflects first-page exhaustion and continuation scope', async () => {
    vi.spyOn(collectionsModule, 'getCollections').mockResolvedValue({
      collections: [],
      hasNextPage: false,
      endCursor: null,
    });
    expect(renderToStaticMarkup(await ArchiveIndex())).toContain('THE ARCHIVE BEGINS HERE.');
    const continuation = renderToStaticMarkup(await ArchiveIndex({ after: 'last-page' }));
    expect(continuation).toContain('NO ARCHIVED COLLECTIONS ON THIS PAGE.');
    expect(continuation).toContain('First page');
    expect(continuation).not.toContain('THE ARCHIVE BEGINS HERE.');
  });
  test('45 collections retain a native route to the second source page', async () => {
    sourcePages(summaries(45));
    expect(renderToStaticMarkup(await CollectionsIndex())).toContain('Next collections');
  });

  test('21 source collections retain archive continuation when the first page has no archive', async () => {
    const all = summaries(21).map((item, index) =>
      index === 20 ? item : { ...item, dropStatus: 'active', archivedAt: null },
    );
    sourcePages(all);
    const html = renderToStaticMarkup(await ArchiveIndex());
    expect(html).toContain('Next collections');
    expect(html).not.toContain('THE ARCHIVE BEGINS HERE.');
  });

  test('closet finds the first current collection after 40 excluded collections', async () => {
    const all = summaries(45);
    all[40] = { ...all[40], dropStatus: 'active', archivedAt: null };
    sourcePages(all);
    const products = vi.spyOn(productsModule, 'getClosetProducts').mockResolvedValue([
      {
        id: 'product',
        handle: 'piece',
        title: 'Piece',
        description: '',
        productType: 'Hoodies',
        minPrice: { amount: '10', currencyCode: 'USD' },
        image: null,
        modelUrl: null,
        fabricColor: null,
      },
    ]);
    expect((await getClosetCollection())?.handle).toBe('collection-40');
    expect(products).toHaveBeenCalledWith('collection-40', 6);
  });

  test('upcoming selector finds the first upcoming collection after 20 excluded collections', async () => {
    const all = summaries(21);
    all[20] = {
      ...all[20],
      dropStatus: 'active',
      archivedAt: null,
      dropDate: '2099-01-01T00:00:00Z',
    };
    sourcePages(all);
    expect((await getUpcomingDrop())?.handle).toBe('collection-20');
  });
});

import { afterEach, expect, test, vi } from 'vitest';
import { getCollection, getCollections } from '@/lib/shopify/collections';
import {
  getPreviewProductListItemsByCollection,
  getPreviewProductsByCollection,
} from '@/lib/shopify/preview-demo-fixtures';
import { getArchivedCollections } from '@/lib/archive/collections';
import { generateMetadata as collectionMetadata } from '@/app/(storefront)/collections/page';
import { generateMetadata as archiveMetadata } from '@/app/(storefront)/archive/page';
import CollectionsPage from '@/app/(storefront)/collections/page';
import ArchivePage from '@/app/(storefront)/archive/page';

afterEach(() => vi.unstubAllEnvs());

test.each([21, 45])(
  'opt-in %i-collection source traverses every entry once and all detail helpers resolve',
  async (count) => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    vi.stubEnv('PREVIEW_COLLECTION_SCENARIO', `continuation-${count}`);
    if (count === 21) {
      const firstArchive = await getArchivedCollections();
      expect(firstArchive).toEqual({ collections: [], hasNextPage: true, endCursor: 'preview:20' });
      const laterArchive = await getArchivedCollections(20, firstArchive.endCursor!);
      expect(laterArchive.collections.map((collection) => collection.handle)).toEqual([
        'demo-collection-021',
      ]);
      expect(laterArchive.hasNextPage).toBe(false);
    }
    const ids: string[] = [];
    const sizes: number[] = [];
    let after: string | undefined;
    do {
      const page = await getCollections(20, after);
      sizes.push(page.collections.length);
      for (const collection of page.collections) {
        ids.push(collection.id);
        expect((await getCollection(collection.handle))?.id).toBe(collection.id);
        expect(getPreviewProductsByCollection(collection.handle)?.length).toBeGreaterThan(0);
        expect(getPreviewProductListItemsByCollection(collection.handle)?.length).toBeGreaterThan(
          0,
        );
      }
      after = page.hasNextPage ? page.endCursor! : undefined;
    } while (after);
    expect(sizes).toEqual(count === 45 ? [20, 20, 5] : [20, 1]);
    expect(new Set(ids).size).toBe(count);
    vi.stubEnv('PREVIEW_COLLECTION_SCENARIO', '');
    expect((await getCollections()).collections).toHaveLength(5);
    expect((await getArchivedCollections()).collections).toHaveLength(1);
    expect(await getCollection('demo-collection-041')).toBeNull();
  },
);

test.each([
  ['/collections', collectionMetadata, CollectionsPage],
  ['/archive', archiveMetadata, ArchivePage],
] as const)(
  '%s route and metadata normalize the same cursor',
  async (pathname, metadata, route) => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    for (const [input, after] of [
      ['preview:20', 'preview:20'],
      ['invalid', undefined],
      ['preview:0', undefined],
      [['preview:20', 'preview:40'], undefined],
      ['x'.repeat(4097), undefined],
    ] as const) {
      const props = {
        searchParams: Promise.resolve({ after: input as string | string[], utm_source: 'test' }),
      };
      const result = await metadata(props);
      const expected = `${pathname}${after ? '?after=preview%3A20' : ''}`;
      expect(result.alternates?.canonical).toBe(expected);
      expect(result.openGraph?.url).toBe(expected);
      expect((await route(props)).props.after).toBe(after);
    }
  },
);

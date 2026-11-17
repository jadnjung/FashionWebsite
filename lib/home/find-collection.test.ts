import { afterEach, expect, test, vi } from 'vitest';
import { findHomeCollection } from '@/lib/home/find-collection';
import { getUpcomingDrop } from '@/lib/home/upcoming-drop';
import * as collectionsModule from '@/lib/shopify/collections';

const archived: collectionsModule.CollectionSummary = {
  id: 'archived',
  handle: 'archived',
  title: 'Archived',
  dropStatus: 'archived',
  dropDate: null,
  archivedAt: '2026-01-01T00:00:00Z',
};
const upcoming = {
  ...archived,
  id: 'upcoming',
  handle: 'upcoming',
  dropStatus: 'active',
  archivedAt: null,
  dropDate: '2099-01-01T00:00:00Z',
};
const page = (endCursor: string | null, collections = [archived]) => ({
  collections,
  hasNextPage: endCursor !== null,
  endCursor,
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test.each([
  ['missing', [null]],
  ['repeated', ['a', 'a']],
  ['cyclic', ['a', 'b', 'a']],
])('rejects %s continuation without publishing a partial result', async (_name, cursors) => {
  const read = vi.spyOn(collectionsModule, 'getCollections');
  for (const cursor of cursors) read.mockResolvedValueOnce({ ...page(cursor), hasNextPage: true });
  await expect(findHomeCollection(() => false)).rejects.toThrow('did not advance');
  expect(read).toHaveBeenCalledTimes(cursors.length);
});

test('stops at its explicit 50-page budget even when the source always advances', async () => {
  const read = vi
    .spyOn(collectionsModule, 'getCollections')
    .mockImplementation(async (_first, after) => page(String(Number(after ?? 0) + 1)));
  await expect(findHomeCollection(() => false)).rejects.toThrow('page budget');
  expect(read).toHaveBeenCalledTimes(50);
});

test('deduplicates IDs across pages and stops on the first eligible collection', async () => {
  const read = vi
    .spyOn(collectionsModule, 'getCollections')
    .mockResolvedValueOnce(page('a'))
    .mockResolvedValueOnce(page('b', [archived, upcoming]))
    .mockRejectedValueOnce(new Error('Must not read after first match'));
  const eligible = vi.fn((collection) => collection.id === upcoming.id);
  expect(await findHomeCollection(eligible)).toEqual(upcoming);
  expect(eligible.mock.calls.map(([collection]) => collection.id)).toEqual([
    'archived',
    'upcoming',
  ]);
  expect(read).toHaveBeenCalledTimes(2);
});

test('a later-page failure reaches the existing logged fallback and a new attempt recovers', async () => {
  const read = vi
    .spyOn(collectionsModule, 'getCollections')
    .mockResolvedValueOnce(page('a'))
    .mockRejectedValueOnce(new Error('Synthetic later-page failure'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(await getUpcomingDrop()).toBeNull();
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('Drop Status'),
    expect.objectContaining({ message: 'Synthetic later-page failure' }),
  );
  read.mockResolvedValueOnce(page(null, [upcoming]));
  expect((await getUpcomingDrop())?.handle).toBe('upcoming');
});

test('all pages share one ten-second deadline, with cancellation and fresh-attempt recovery', async () => {
  vi.useFakeTimers();
  let secondSignal: AbortSignal | undefined;
  const read = vi
    .spyOn(collectionsModule, 'getCollections')
    .mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 6_000));
      return page('a');
    })
    .mockImplementationOnce(async (_first, _after, signal) => {
      secondSignal = signal;
      return new Promise((_resolve, reject) => {
        signal!.addEventListener('abort', () => reject(signal!.reason), { once: true });
      });
    });
  const outcome = expect(findHomeCollection(() => false)).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(10_000);
  await outcome;
  expect(read).toHaveBeenCalledTimes(2);
  expect(secondSignal?.aborted).toBe(true);
  read.mockResolvedValueOnce(page(null, [upcoming]));
  expect(await findHomeCollection(() => true)).toEqual(upcoming);
});

test('upcoming classification uses the invocation time across source pages', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-20T11:59:59Z'));
  vi.spyOn(collectionsModule, 'getCollections')
    .mockResolvedValueOnce(page('a'))
    .mockImplementationOnce(async () => {
      vi.setSystemTime(new Date('2026-11-20T12:00:01Z'));
      return page(null, [{ ...upcoming, dropDate: '2026-11-20T12:00:00Z' }]);
    });
  expect((await getUpcomingDrop())?.handle).toBe('upcoming');
});

import { describe, expect, test } from 'vitest';
import { getCollectionHref, getDropPhase, isCollectionUpcoming } from './drop-phase';

const NOW = new Date('2026-10-18T12:00:00Z');

const BASE = { dropStatus: null, archivedAt: null, dropDate: null };

describe('getDropPhase', () => {
  test('returns "current" when dropDate is null', () => {
    expect(getDropPhase({ ...BASE }, NOW)).toBe('current');
  });

  test('returns "upcoming" when dropDate is strictly after now', () => {
    expect(getDropPhase({ ...BASE, dropDate: '2026-11-20T12:00:00Z' }, NOW)).toBe('upcoming');
  });

  test('returns "current" when dropDate is exactly now (the boundary itself has already launched)', () => {
    expect(getDropPhase({ ...BASE, dropDate: NOW.toISOString() }, NOW)).toBe('current');
  });

  test('returns "current" when dropDate is in the past', () => {
    expect(getDropPhase({ ...BASE, dropDate: '2026-01-01T00:00:00Z' }, NOW)).toBe('current');
  });

  test('returns "archived" when dropStatus is "archived", regardless of dropDate', () => {
    expect(
      getDropPhase(
        { dropStatus: 'archived', archivedAt: null, dropDate: '2026-11-20T12:00:00Z' },
        NOW,
      ),
    ).toBe('archived');
  });

  test('returns "archived" when archivedAt is set, even with a future dropDate (archived wins over upcoming)', () => {
    expect(
      getDropPhase(
        { dropStatus: null, archivedAt: '2026-06-01T00:00:00Z', dropDate: '2026-11-20T12:00:00Z' },
        NOW,
      ),
    ).toBe('archived');
  });

  test('defaults `now` to the real current time when omitted', () => {
    // No fixed `now` passed — this collection's dropDate is comfortably in
    // the past relative to any real wall-clock time this test will ever
    // run at, so the default-parameter branch is exercised without making
    // the test's outcome depend on exactly when it runs.
    expect(getDropPhase({ ...BASE, dropDate: '2000-01-01T00:00:00Z' })).toBe('current');
  });
});

describe('isCollectionUpcoming', () => {
  test('returns true only when getDropPhase would resolve to "upcoming"', () => {
    expect(isCollectionUpcoming({ ...BASE, dropDate: '2026-11-20T12:00:00Z' }, NOW)).toBe(true);
    expect(isCollectionUpcoming({ ...BASE, dropDate: '2026-01-01T00:00:00Z' }, NOW)).toBe(false);
    expect(
      isCollectionUpcoming(
        { dropStatus: 'archived', archivedAt: null, dropDate: '2026-11-20T12:00:00Z' },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('getCollectionHref', () => {
  test('returns /archive/[handle] when archived — its real home per the notFound() branch in page.tsx', () => {
    expect(getCollectionHref({ ...BASE, handle: 'collection-000', dropStatus: 'archived' })).toBe(
      '/archive/collection-000',
    );
  });

  test('returns /collections/[handle] when current', () => {
    expect(getCollectionHref({ ...BASE, handle: 'collection-001' })).toBe(
      '/collections/collection-001',
    );
  });

  test('returns /collections/[handle] when upcoming (the teaser/countdown lives inside that route, not in this helper)', () => {
    // Comfortably in the future relative to any real wall-clock time this
    // test will ever run at — getCollectionHref calls getDropPhase with no
    // injected `now` (no such parameter exists on this helper), so unlike
    // the fixed-NOW tests above, this must stay genuinely future-dated.
    expect(
      getCollectionHref({ ...BASE, handle: 'collection-002', dropDate: '2099-01-01T00:00:00Z' }),
    ).toBe('/collections/collection-002');
  });
});

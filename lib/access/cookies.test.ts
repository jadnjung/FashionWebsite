import { describe, expect, it } from 'vitest';
import {
  DROP_ACCESS_EVENT_COOKIE_NAME,
  addUnlockedHandle,
  hasUnlockedCollection,
  parseDropAccessEventCookie,
} from './cookies';

describe('hasUnlockedCollection', () => {
  it('returns false when the cookie is absent', () => {
    expect(hasUnlockedCollection(undefined, 'collection-002')).toBe(false);
  });

  it('returns false when the cookie is present but names a different handle', () => {
    expect(hasUnlockedCollection('collection-003', 'collection-002')).toBe(false);
  });

  it('returns true when the cookie names exactly the given handle', () => {
    expect(hasUnlockedCollection('collection-002', 'collection-002')).toBe(true);
  });

  it('returns true when the handle is one of several in a comma-separated list', () => {
    expect(hasUnlockedCollection('collection-002,collection-003', 'collection-003')).toBe(true);
  });
});

describe('addUnlockedHandle', () => {
  it('starts a new single-handle list when the cookie was absent', () => {
    expect(addUnlockedHandle(undefined, 'collection-002')).toBe('collection-002');
  });

  it('appends a second, different handle rather than overwriting the first', () => {
    expect(addUnlockedHandle('collection-002', 'collection-003')).toBe(
      'collection-002,collection-003',
    );
  });

  it('does not duplicate a handle that is already present', () => {
    expect(addUnlockedHandle('collection-002', 'collection-002')).toBe('collection-002');
  });

  it('does not duplicate a handle already present among several', () => {
    expect(addUnlockedHandle('collection-002,collection-003', 'collection-003')).toBe(
      'collection-002,collection-003',
    );
  });

  // Security regression: `handle` reaches this function via
  // validateDropAccessCode's bound server-action argument, which is
  // client-controlled, untrusted input (unlike a true closure, a .bind()
  // argument carries no encryption) — a `handle` crafted to contain the
  // delimiter must never be allowed to smuggle extra, comma-joined entries
  // into the unlock cookie in one submission.
  it('refuses to append a handle containing the delimiter, leaving the cookie unchanged', () => {
    expect(addUnlockedHandle('collection-001', 'a,b')).toBe('collection-001');
    expect(addUnlockedHandle(undefined, 'a,b')).toBe('');
  });
});

describe('parseDropAccessEventCookie', () => {
  it('returns null when the cookie is absent (the common case)', () => {
    expect(parseDropAccessEventCookie('')).toBeNull();
    expect(parseDropAccessEventCookie('other_cookie=1; another=2')).toBeNull();
  });

  it('reads the handle when that is the only cookie present', () => {
    expect(parseDropAccessEventCookie(`${DROP_ACCESS_EVENT_COOKIE_NAME}=collection-002`)).toBe(
      'collection-002',
    );
  });

  it('reads the handle alongside other, unrelated cookies in either position', () => {
    expect(
      parseDropAccessEventCookie(
        `foo=bar; ${DROP_ACCESS_EVENT_COOKIE_NAME}=collection-002; baz=qux`,
      ),
    ).toBe('collection-002');
    expect(
      parseDropAccessEventCookie(`${DROP_ACCESS_EVENT_COOKIE_NAME}=collection-002; foo=bar`),
    ).toBe('collection-002');
  });

  it('does not match a cookie whose name merely contains the target name as a substring', () => {
    expect(
      parseDropAccessEventCookie(`not_${DROP_ACCESS_EVENT_COOKIE_NAME}=collection-002`),
    ).toBeNull();
  });

  it('decodes a URI-encoded value', () => {
    expect(
      parseDropAccessEventCookie(
        `${DROP_ACCESS_EVENT_COOKIE_NAME}=${encodeURIComponent('collection-002')}`,
      ),
    ).toBe('collection-002');
  });
});

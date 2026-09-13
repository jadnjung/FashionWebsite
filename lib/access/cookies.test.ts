import { describe, expect, it } from 'vitest';
import { ACCESS_EVENT_COOKIE_NAME, parseAccessEventCookie } from './cookies';

describe('parseAccessEventCookie', () => {
  it('returns null when the cookie is absent (the common case)', () => {
    expect(parseAccessEventCookie('')).toBeNull();
    expect(parseAccessEventCookie('other_cookie=1; another=2')).toBeNull();
  });

  it('reads "general" when that is the only cookie present', () => {
    expect(parseAccessEventCookie(`${ACCESS_EVENT_COOKIE_NAME}=general`)).toBe('general');
  });

  it('reads "vip" alongside other, unrelated cookies in either position', () => {
    expect(parseAccessEventCookie(`foo=bar; ${ACCESS_EVENT_COOKIE_NAME}=vip; baz=qux`)).toBe('vip');
    expect(parseAccessEventCookie(`${ACCESS_EVENT_COOKIE_NAME}=vip; foo=bar`)).toBe('vip');
  });

  it('does not match a cookie whose name merely contains the target name as a substring', () => {
    expect(parseAccessEventCookie(`not_${ACCESS_EVENT_COOKIE_NAME}=vip`)).toBeNull();
  });

  it('returns null for an unrecognized value rather than guessing', () => {
    expect(parseAccessEventCookie(`${ACCESS_EVENT_COOKIE_NAME}=nonsense`)).toBeNull();
  });

  it('decodes a URI-encoded value', () => {
    expect(parseAccessEventCookie(`${ACCESS_EVENT_COOKIE_NAME}=${encodeURIComponent('vip')}`)).toBe(
      'vip',
    );
  });
});

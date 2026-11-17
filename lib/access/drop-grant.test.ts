import { afterEach, expect, test, vi } from 'vitest';
import { consumeDropGrantSignal } from './drop-grant';
import { trackEvent } from '@/lib/analytics/gtag';
import { DROP_ACCESS_EVENT_COOKIE_NAME } from './cookies';

vi.mock('@/lib/analytics/gtag', () => ({ trackEvent: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

function cookieJar(initial: string, order: string[] = []) {
  let value = initial;
  const target = {
    get cookie() {
      return value;
    },
    set cookie(next: string) {
      order.push('clear');
      expect(next).toBe(`${DROP_ACCESS_EVENT_COOKIE_NAME}=; Max-Age=0; path=/`);
      value = '';
    },
  };
  vi.stubGlobal('document', target);
  return {
    target,
    setSignal(handle: string) {
      value = `${DROP_ACCESS_EVENT_COOKIE_NAME}=${encodeURIComponent(handle)}`;
    },
  };
}

test('overlapping consumers clear before emission and consume the signal only once', () => {
  const order: string[] = [];
  cookieJar(`${DROP_ACCESS_EVENT_COOKIE_NAME}=collection-002`, order);
  vi.mocked(trackEvent).mockImplementation(() => {
    order.push('track');
    consumeDropGrantSignal();
  });
  consumeDropGrantSignal();
  consumeDropGrantSignal();
  expect(order[0]).toBe('clear');
  expect(order[1]).toBe('track');
  expect(trackEvent).toHaveBeenCalledExactlyOnceWith('drop_access_granted', {
    collection_handle: 'collection-002',
  });
});

test('a genuinely later grant for the same handle emits again', () => {
  const jar = cookieJar('');
  jar.setSignal('collection-002');
  consumeDropGrantSignal();
  jar.setSignal('collection-002');
  consumeDropGrantSignal();
  expect(trackEvent).toHaveBeenCalledTimes(2);
});

test.each(['', `${DROP_ACCESS_EVENT_COOKIE_NAME}=%`, `${DROP_ACCESS_EVENT_COOKIE_NAME}=%FF`])(
  'absent or malformed optional state cannot turn teardown into a grant',
  (value) => {
    const jar = cookieJar(value);
    consumeDropGrantSignal();
    expect(jar.target.cookie).toBe('');
    expect(trackEvent).not.toHaveBeenCalled();
  },
);

test('blocked cookie reads and writes leave the journey usable and emit no grant', () => {
  for (const target of [
    {
      get cookie(): string {
        throw new Error('read blocked');
      },
    },
    {
      get cookie() {
        return `${DROP_ACCESS_EVENT_COOKIE_NAME}=collection-002`;
      },
      set cookie(_value: string) {
        throw new Error('write blocked');
      },
    },
  ]) {
    vi.stubGlobal('document', target);
    expect(() => consumeDropGrantSignal()).not.toThrow();
  }
  expect(trackEvent).not.toHaveBeenCalled();
});

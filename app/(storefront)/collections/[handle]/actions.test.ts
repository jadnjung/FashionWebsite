import { describe, expect, test, vi, beforeEach } from 'vitest';
import { validateDropAccessCode } from './actions';

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

beforeEach(() => {
  mockCookieStore.set.mockClear();
  mockCookieStore.get.mockReset();
  mockCookieStore.get.mockReturnValue(undefined);
});

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe('validateDropAccessCode', () => {
  test('sets the unlock cookie (with the handle) and the signal cookie, then redirects, on a matching code', async () => {
    vi.stubEnv('ESQUE_DROP_ACCESS_CODE', 'thursday-early');

    const boundAction = validateDropAccessCode.bind(null, 'collection-002');
    await expect(
      boundAction({ success: false }, formData({ code: 'thursday-early' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_drop_access',
      'collection-002',
      expect.objectContaining({
        httpOnly: true,
        // Hardcoded `false` here for the same reason as the deleted
        // whole-site gate's own test: cookieOptions is a module-level
        // const evaluated once at import time, under vitest's ambient
        // NODE_ENV ('test'), not 'production'.
        secure: false,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_drop_access_event',
      'collection-002',
      expect.objectContaining({ httpOnly: false, sameSite: 'lax', path: '/' }),
    );
  });

  test('appends a second, different handle to the unlock cookie rather than overwriting the first', async () => {
    vi.stubEnv('ESQUE_DROP_ACCESS_CODE', 'thursday-early');
    mockCookieStore.get.mockReturnValue({ value: 'collection-001' });

    const boundAction = validateDropAccessCode.bind(null, 'collection-002');
    await expect(
      boundAction({ success: false }, formData({ code: 'thursday-early' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_drop_access',
      'collection-001,collection-002',
      expect.any(Object),
    );
  });

  test('sets the secure cookie flag when the module is loaded with NODE_ENV=production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ESQUE_DROP_ACCESS_CODE', 'thursday-early');
    vi.resetModules();
    const { validateDropAccessCode: validateUnderProduction } = await import('./actions');

    const boundAction = validateUnderProduction.bind(null, 'collection-002');
    await expect(
      boundAction({ success: false }, formData({ code: 'thursday-early' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_drop_access',
      'collection-002',
      expect.objectContaining({ secure: true }),
    );
  });

  test('returns { success: false } without setting cookies or redirecting on a non-matching code', async () => {
    vi.stubEnv('ESQUE_DROP_ACCESS_CODE', 'thursday-early');

    const boundAction = validateDropAccessCode.bind(null, 'collection-002');
    const result = await boundAction({ success: false }, formData({ code: 'wrong-code' }));

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches any submission when ESQUE_DROP_ACCESS_CODE is wholly unset', async () => {
    vi.stubEnv('ESQUE_DROP_ACCESS_CODE', undefined);

    const boundAction = validateDropAccessCode.bind(null, 'collection-002');
    const result = await boundAction({ success: false }, formData({ code: '' }));

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches an empty submitted code when ESQUE_DROP_ACCESS_CODE is set to the empty string', async () => {
    vi.stubEnv('ESQUE_DROP_ACCESS_CODE', '');

    const boundAction = validateDropAccessCode.bind(null, 'collection-002');
    const result = await boundAction({ success: false }, formData({ code: '' }));

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches when the code field is missing from the submitted form data entirely', async () => {
    vi.stubEnv('ESQUE_DROP_ACCESS_CODE', 'thursday-early');

    const boundAction = validateDropAccessCode.bind(null, 'collection-002');
    const result = await boundAction({ success: false }, new FormData());

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});

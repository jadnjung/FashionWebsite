import { describe, expect, test, vi, beforeEach } from 'vitest';
import { validatePassword } from './actions';

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
});

describe('validatePassword', () => {
  test('sets the general access cookie and redirects on a matching general password', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    await expect(validatePassword('letmein')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_access',
      '1',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
    );
  });

  test('sets both access cookies and redirects on a matching early-access password', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    await expect(validatePassword('vip-letmein')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_access', '1', expect.any(Object));
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_vip_access', '1', expect.any(Object));
  });

  test('returns { success: false } without setting cookies or redirecting on no match', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    const result = await validatePassword('wrong-password');

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches an empty submitted password when the password env vars are wholly unset', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', undefined);
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', undefined);

    const result = await validatePassword('');

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches an empty submitted password when the password env vars are set to the empty string', async () => {
    // Distinct from the "wholly unset" case above: here the env vars are
    // present but blank, which `vi.stubEnv(name, undefined)` cannot
    // simulate (that deletes the key entirely). This is the only case
    // that actually exercises the `earlyAccessPassword &&` / `generalPassword
    // &&` truthiness guards — without them, '' === '' would grant access.
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', '');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', '');

    const result = await validatePassword('');

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('grants early access (not general access) when both password env vars are misconfigured to the same value', async () => {
    // Guards against an accidental reordering of the two tier checks: if
    // an operator sets both env vars to the same value, the early-access
    // branch must win rather than silently downgrading to general access.
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'shared-secret');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'shared-secret');

    await expect(validatePassword('shared-secret')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_access', '1', expect.any(Object));
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_vip_access', '1', expect.any(Object));
  });
});

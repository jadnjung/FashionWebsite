import { describe, expect, test, vi, beforeEach } from 'vitest';
import { validatePassword, submitRequestAccess } from './actions';
import * as subscribeModule from '@/lib/klaviyo/subscribe';

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

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe('validatePassword', () => {
  test('sets the general access cookie and redirects on a matching general password', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    await expect(
      validatePassword({ success: false }, formData({ password: 'letmein' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_access',
      '1',
      expect.objectContaining({
        httpOnly: true,
        // Hardcoded `false`, not recomputed from process.env.NODE_ENV here:
        // cookieOptions is a module-level const in actions.ts, evaluated
        // once when the module is first imported (at the top of this file,
        // before any vi.stubEnv call runs) — vitest's ambient NODE_ENV at
        // that time is 'test' (verified directly), so this branch's baked
        // value is always `false` for every test in this file that uses
        // the static `validatePassword` import. The production branch
        // (`secure: true`) is pinned separately below via a module reset +
        // dynamic re-import under a stubbed 'production' NODE_ENV — that
        // is the only way to actually exercise the other side of the
        // conditional, since reassigning process.env.NODE_ENV later never
        // retroactively changes an already-evaluated module constant.
        secure: false,
        sameSite: 'lax',
        path: '/',
      }),
    );
  });

  test('sets the secure cookie flag when the module is loaded with NODE_ENV=production', async () => {
    // cookieOptions.secure is `process.env.NODE_ENV === 'production'`, read
    // once at module-evaluation time — vi.stubEnv alone cannot change a
    // value already baked into a loaded module's module-level const. To
    // actually exercise the production branch, the module must be
    // re-evaluated *after* NODE_ENV is stubbed: reset vitest's module
    // registry, then dynamically re-import './actions' so its top-level
    // `cookieOptions` is recomputed under the stubbed environment.
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');
    vi.resetModules();
    const { validatePassword: validatePasswordUnderProduction } = await import('./actions');

    await expect(
      validatePasswordUnderProduction({ success: false }, formData({ password: 'letmein' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'esque_access',
      '1',
      expect.objectContaining({ secure: true }),
    );
  });

  test('sets both access cookies and redirects on a matching early-access password', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    await expect(
      validatePassword({ success: false }, formData({ password: 'vip-letmein' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_access', '1', expect.any(Object));
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_vip_access', '1', expect.any(Object));
  });

  test('returns { success: false } without setting cookies or redirecting on no match', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    const result = await validatePassword(
      { success: false },
      formData({ password: 'wrong-password' }),
    );

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches an empty submitted password when the password env vars are wholly unset', async () => {
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', undefined);
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', undefined);

    const result = await validatePassword({ success: false }, formData({ password: '' }));

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

    const result = await validatePassword({ success: false }, formData({ password: '' }));

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('never matches when the password field is missing from the submitted form data entirely', async () => {
    // New case specific to the FormData-based signature (distinct from "
    // submitted as an empty string" above): exercises the `?? ''` fallback
    // when formData.get('password') returns null outright because no
    // `password` key is present at all. A hand-built FormData can produce
    // this; a real <input name="password" required> submission normally
    // cannot — covered anyway since it's a real branch in the function.
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'letmein');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'vip-letmein');

    const result = await validatePassword({ success: false }, new FormData());

    expect(result).toEqual({ success: false });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  test('grants early access (not general access) when both password env vars are misconfigured to the same value', async () => {
    // Guards against an accidental reordering of the two tier checks: if
    // an operator sets both env vars to the same value, the early-access
    // branch must win rather than silently downgrading to general access.
    vi.stubEnv('ESQUE_ACCESS_PASSWORD', 'shared-secret');
    vi.stubEnv('ESQUE_EARLY_ACCESS_PASSWORD', 'shared-secret');

    await expect(
      validatePassword({ success: false }, formData({ password: 'shared-secret' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_access', '1', expect.any(Object));
    expect(mockCookieStore.set).toHaveBeenCalledWith('esque_vip_access', '1', expect.any(Object));
  });
});

describe('submitRequestAccess', () => {
  test('returns a validation error when firstName is missing', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ email: 'a@example.com', consent: 'on' }),
    );
    expect(result).toEqual({ success: false, error: 'First name is required.' });
  });

  test('returns a validation error when email is missing', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', consent: 'on' }),
    );
    expect(result).toEqual({ success: false, error: 'Email is required.' });
  });

  test('returns a validation error when consent is not checked', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: 'a@example.com' }),
    );
    expect(result).toEqual({
      success: false,
      error: 'Consent is required to request access.',
    });
  });

  test('calls subscribeToAccessList and returns success when all fields are valid', async () => {
    const subscribeSpy = vi
      .spyOn(subscribeModule, 'subscribeToAccessList')
      .mockResolvedValue(undefined);

    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: 'sam@example.com', consent: 'on' }),
    );

    expect(subscribeSpy).toHaveBeenCalledWith('sam@example.com');
    expect(result).toEqual({ success: true });
  });

  test('throws (does not swallow) when subscribeToAccessList fails — a genuine failure, not a validation outcome', async () => {
    vi.spyOn(subscribeModule, 'subscribeToAccessList').mockRejectedValue(
      new Error('Klaviyo request failed: 500 Internal Server Error'),
    );

    await expect(
      submitRequestAccess(
        { success: false },
        formData({ firstName: 'Sam', email: 'sam@example.com', consent: 'on' }),
      ),
    ).rejects.toThrow('Klaviyo request failed');
  });
});

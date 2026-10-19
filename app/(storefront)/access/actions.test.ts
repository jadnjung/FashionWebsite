import { describe, expect, test, vi } from 'vitest';
import { submitRequestAccess } from './actions';
import * as subscribeModule from '@/lib/klaviyo/subscribe';

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe('submitRequestAccess', () => {
  test('returns a validation error when firstName is missing', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ email: 'a@example.com', consent: 'on' }),
    );
    expect(result).toEqual({
      success: false,
      error: 'First name is required.',
      field: 'firstName',
    });
  });

  test('returns a validation error when email is missing', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', consent: 'on' }),
    );
    expect(result).toEqual({ success: false, error: 'Email is required.', field: 'email' });
  });

  test('returns a validation error when firstName is whitespace-only', async () => {
    // Present-but-blank, distinct from the omitted-key case above — this is
    // what actually exercises `.trim()` on firstName. An omitted key alone
    // would pass even with `.trim()` deleted, since `formData.get` already
    // returns null and the `?? ''` fallback produces an empty string either
    // way.
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: '   ', email: 'a@example.com', consent: 'on' }),
    );
    expect(result).toEqual({
      success: false,
      error: 'First name is required.',
      field: 'firstName',
    });
  });

  test('returns a validation error when email is whitespace-only', async () => {
    // Same rationale as the firstName case above, for `.trim()` on email —
    // load-bearing since this value reaches Klaviyo.
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: '   ', consent: 'on' }),
    );
    expect(result).toEqual({ success: false, error: 'Email is required.', field: 'email' });
  });

  test('returns a validation error when email is malformed', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: 'notanemail', consent: 'on' }),
    );
    expect(result).toEqual({ success: false, error: 'Email is invalid.', field: 'email' });
  });

  test('accepts a well-formed email address rather than rejecting it as malformed', async () => {
    const subscribeSpy = vi
      .spyOn(subscribeModule, 'subscribeToAccessList')
      .mockResolvedValue(undefined);

    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: 'sam+test@mail.example.co.uk', consent: 'on' }),
    );

    expect(subscribeSpy).toHaveBeenCalledWith('sam+test@mail.example.co.uk');
    expect(result).toEqual({ success: true });
  });

  test('returns a validation error when consent is not checked', async () => {
    const result = await submitRequestAccess(
      { success: false },
      formData({ firstName: 'Sam', email: 'a@example.com' }),
    );
    expect(result).toEqual({
      success: false,
      error: 'Consent is required to request access.',
      field: 'consent',
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

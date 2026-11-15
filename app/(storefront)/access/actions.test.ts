import { afterEach, describe, expect, test, vi } from 'vitest';
import { submitRequestAccess } from './actions';
import * as subscribeModule from '@/lib/klaviyo/subscribe';
function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe('Request Access', () => {
  test.each([
    [{ consent: 'on' }, 'email'],
    [{ email: 'invalid', consent: 'on' }, 'email'],
    [{ email: '   ', consent: 'on' }, 'email'],
    [{ email: 'demo@example.com' }, 'consent'],
  ])('validates submitted fields', async (fields, field) => {
    const result = await submitRequestAccess({ success: false }, formData(fields));
    expect(result).toMatchObject({ success: false, field });
  });
  test('submits consented email without requiring unused personal data', async () => {
    const subscribe = vi
      .spyOn(subscribeModule, 'subscribeToAccessList')
      .mockResolvedValue(undefined);
    expect(
      await submitRequestAccess(
        { success: false },
        formData({ email: ' sam@example.com ', consent: 'on' }),
      ),
    ).toEqual({ success: true });
    expect(subscribe).toHaveBeenCalledWith('sam@example.com');
  });
  test('keeps service failure recoverable and does not return internal detail', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(subscribeModule, 'subscribeToAccessList').mockRejectedValue(
      new Error('private upstream detail'),
    );
    const result = await submitRequestAccess(
      { success: false },
      formData({ email: 'demo@example.com', consent: 'on' }),
    );
    expect(result).toEqual({
      success: false,
      error: 'Your request could not be submitted. Please try again.',
    });
  });
  test('Demo success and failure never call the email service', async () => {
    vi.stubEnv('PREVIEW_DEMO_MODE', '1');
    const subscribe = vi.spyOn(subscribeModule, 'subscribeToAccessList');
    expect(
      (
        await submitRequestAccess(
          { success: false },
          formData({ email: 'demo@example.com', consent: 'on' }),
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await submitRequestAccess(
          { success: false },
          formData({ email: 'demo@example.com', consent: 'on', previewOutcome: 'unavailable' }),
        )
      ).success,
    ).toBe(false);
    expect(subscribe).not.toHaveBeenCalled();
  });
});

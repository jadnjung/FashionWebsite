import { describe, expect, test, vi, beforeEach } from 'vitest';
import { klaviyoRequest, getKlaviyoListId } from '@/lib/klaviyo/client';

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('klaviyoRequest', () => {
  test('throws a clear error when KLAVIYO_PRIVATE_API_KEY is unset', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', undefined);
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    await expect(klaviyoRequest('/test/', {})).rejects.toThrow(
      'Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.',
    );
  });

  test('throws a clear error when KLAVIYO_LIST_ID is unset', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', undefined);
    await expect(klaviyoRequest('/test/', {})).rejects.toThrow(
      'Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.',
    );
  });

  test('sends an authenticated POST request and resolves on a successful response', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, statusText: 'Accepted' });
    vi.stubGlobal('fetch', fetchMock);

    await klaviyoRequest('/profile-subscription-bulk-create-jobs/', { hello: 'world' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Klaviyo-API-Key test-key' }),
        body: JSON.stringify({ hello: 'world' }),
      }),
    );
  });

  test('throws with the response status when Klaviyo returns a non-ok response', async () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' }),
    );

    await expect(klaviyoRequest('/test/', {})).rejects.toThrow(
      'Klaviyo request failed: 401 Unauthorized',
    );
  });
});

describe('getKlaviyoListId', () => {
  test('returns the configured list ID', () => {
    vi.stubEnv('KLAVIYO_PRIVATE_API_KEY', 'test-key');
    vi.stubEnv('KLAVIYO_LIST_ID', 'test-list-id');
    expect(getKlaviyoListId()).toBe('test-list-id');
  });
});

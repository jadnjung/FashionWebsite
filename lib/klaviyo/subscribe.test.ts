import { describe, expect, test, vi } from 'vitest';
import { subscribeToAccessList } from '@/lib/klaviyo/subscribe';
import * as clientModule from '@/lib/klaviyo/client';

describe('subscribeToAccessList', () => {
  test('sends the expected JSON:API request shape to Klaviyo', async () => {
    vi.spyOn(clientModule, 'getKlaviyoListId').mockReturnValue('test-list-id');
    const requestSpy = vi.spyOn(clientModule, 'klaviyoRequest').mockResolvedValue(undefined);

    await subscribeToAccessList('shopper@example.com');

    expect(requestSpy).toHaveBeenCalledWith('/profile-subscription-bulk-create-jobs/', {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Esque Access Gate — Request Access',
          historical_import: false,
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: 'shopper@example.com',
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: 'test-list-id',
            },
          },
        },
      },
    });
  });

  test('propagates the "not configured" error rather than attempting a request', async () => {
    vi.spyOn(clientModule, 'getKlaviyoListId').mockImplementation(() => {
      throw new Error(
        'Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.',
      );
    });

    await expect(subscribeToAccessList('shopper@example.com')).rejects.toThrow(
      'Klaviyo is not configured',
    );
  });
});

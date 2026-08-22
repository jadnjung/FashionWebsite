import { klaviyoRequest, getKlaviyoListId } from '@/lib/klaviyo/client';

/**
 * Subscribes `email` to the configured Klaviyo list with marketing
 * consent, via a direct REST call to Klaviyo's Subscribe Profiles
 * endpoint (verified against Klaviyo's current docs — the
 * `subscriptions.email.marketing.consent` shape, not the older flat
 * `marketing_newsletter` boolean some cached references still show).
 * See DECISIONS.md D-020 for why this uses fetch directly rather than
 * Klaviyo's Node SDK.
 *
 * Takes email only: this endpoint's documented profile attributes cover
 * identification (email/phone_number) and consent, not name/properties —
 * attaching a name to the Klaviyo profile would need a separate
 * profile-create/update call once a real Klaviyo account justifies
 * adding one. The Request Access form's first-name field is still
 * validated server-side (actions.ts's submitRequestAccess, Task 5); it's
 * just not forwarded to this call (DECISIONS.md D-020).
 */
export async function subscribeToAccessList(email: string): Promise<void> {
  const listId = getKlaviyoListId();

  await klaviyoRequest('/profile-subscription-bulk-create-jobs/', {
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
                email,
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
            id: listId,
          },
        },
      },
    },
  });
}

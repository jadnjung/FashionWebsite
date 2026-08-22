const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
// Klaviyo requires a dated revision header on every request. Bump this
// alongside checking Klaviyo's changelog for breaking changes — see
// DECISIONS.md D-020. Verified against Klaviyo's current official docs
// (developers.klaviyo.com reference pages for Get Accounts and Get Web
// Feeds both list '2026-07-15' as the current default revision; the
// Bulk Subscribe Profiles reference's cURL example also pins this date).
const KLAVIYO_REVISION = '2026-07-15';

interface KlaviyoConfig {
  apiKey: string;
  listId: string;
}

/**
 * Reads and validates Klaviyo configuration from environment variables.
 * Throws only when called (never at module load), mirroring
 * lib/shopify/client.ts's getStorefrontClient() — so importing this file
 * never fails just because Klaviyo isn't configured yet. The thrown error
 * is expected to propagate to app/error.tsx once a real caller exists —
 * no separate "not configured" UI is built here.
 */
function getKlaviyoConfig(): KlaviyoConfig {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    throw new Error('Klaviyo is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.');
  }

  return { apiKey, listId };
}

/**
 * Sends a JSON:API POST request to a Klaviyo endpoint using the
 * configured private API key. Throws with the response status on
 * failure — callers let this propagate rather than swallowing it
 * (DECISIONS.md D-020's error-handling note).
 */
export async function klaviyoRequest(path: string, body: unknown): Promise<void> {
  const { apiKey } = getKlaviyoConfig();

  const response = await fetch(`${KLAVIYO_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      accept: 'application/json',
      'content-type': 'application/json',
      revision: KLAVIYO_REVISION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Klaviyo request failed: ${response.status} ${response.statusText}`);
  }
}

export function getKlaviyoListId(): string {
  return getKlaviyoConfig().listId;
}

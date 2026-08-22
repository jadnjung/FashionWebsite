import {
  createStorefrontApiClient,
  type ClientResponse,
  type StorefrontApiClient,
} from '@shopify/storefront-api-client';

// Falls back to this if SHOPIFY_STOREFRONT_API_VERSION isn't set. Keep in
// sync with .graphqlrc.ts's hardcoded apiVersion (Task 3) — codegen runs
// as a standalone CLI tool outside Next.js's env loading, so it can't
// read this fallback directly; both must be bumped together when the
// pinned Storefront API version changes.
const DEFAULT_API_VERSION = '2026-07';

/**
 * Returns a configured Shopify Storefront API client, or throws a clear
 * error if SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_API_TOKEN aren't
 * set. Called lazily by every fetch function in products.ts/collections.ts
 * — never instantiated at module load time, so importing this file (or
 * anything that transitively imports it) never fails just because
 * Shopify isn't configured yet. The thrown error is expected to
 * propagate to app/error.tsx once a real caller exists in a later phase
 * — no separate "not configured" UI is built here.
 */
export function getStorefrontClient(): StorefrontApiClient {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const publicAccessToken = process.env.SHOPIFY_STOREFRONT_API_TOKEN;

  if (!storeDomain || !publicAccessToken) {
    throw new Error(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  }

  return createStorefrontApiClient({
    storeDomain,
    apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION,
    publicAccessToken,
  });
}

type RequestErrors = NonNullable<ClientResponse<unknown>['errors']>;

/**
 * Builds a clear Error from a Shopify Storefront API response's `errors`
 * field. `errors.message` alone is a fixed generic string for GraphQL-level
 * errors ("...Review 'graphQLErrors' for details.") — the real detail is in
 * `errors.graphQLErrors[].message`, so prefer that when present. Never
 * JSON.stringify(errors): `errors.response` is a raw Fetch Response with no
 * own-enumerable properties, so stringifying the whole object silently
 * collapses to '{}'.
 */
export function toRequestError(errors: RequestErrors): Error {
  const detail = errors.graphQLErrors?.map((e) => e.message).join('; ');
  const status = errors.networkStatusCode ? ` (HTTP ${errors.networkStatusCode})` : '';
  return new Error(
    `Shopify Storefront API request failed${status}: ${detail || errors.message || 'Unknown error'}`,
  );
}

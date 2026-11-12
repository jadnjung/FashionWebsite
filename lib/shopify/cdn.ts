// The one remote origin product media may be loaded from — the same host
// next.config.ts's images.remotePatterns allows for next/image. Code that
// fetches Shopify media directly (bypassing next/image, e.g. the homepage
// Collection Closet's three.js loaders, DECISIONS.md D-089) checks this
// first, so a malformed or unexpected URL is never fetched.
export const SHOPIFY_CDN_HOSTNAME = 'cdn.shopify.com';

/** True only for an absolute `https://cdn.shopify.com/...` URL. */
export function isShopifyCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === SHOPIFY_CDN_HOSTNAME;
  } catch {
    return false;
  }
}

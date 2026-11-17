import { DROP_ACCESS_EVENT_COOKIE_NAME, parseDropAccessEventCookie } from '@/lib/access/cookies';
import { trackEvent } from '@/lib/analytics/gtag';

/** Synchronous consumption lets overlapping lifecycle observers share one signal. */
export function consumeDropGrantSignal(): void {
  try {
    const handle = parseDropAccessEventCookie(document.cookie);
    // Clear malformed optional state too, before any event can run another consumer.
    document.cookie = `${DROP_ACCESS_EVENT_COOKIE_NAME}=; Max-Age=0; path=/`;
    if (handle) trackEvent('drop_access_granted', { collection_handle: handle });
  } catch {
    // Optional cookie access or delivery must not interrupt the storefront.
  }
}

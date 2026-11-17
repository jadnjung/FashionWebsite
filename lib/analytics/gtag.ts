// Browser adapter for the closed event taxonomy. The root bootstrap owns
// gtag's queue, and every real event supplies sanitized URL context itself.
import { isAnalyticsConfigured } from './config';
import { getBrowserAnalyticsContext } from './page-context';
import { queueAnalyticsCommand } from './queue';
import {
  dispatchAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from './events';

export { isAnalyticsConfigured } from './config';

function gtagSink(eventName: string, properties: Record<string, unknown>): void {
  queueAnalyticsCommand('event', eventName, {
    ...properties,
    ...getBrowserAnalyticsContext(),
  });
}

/**
 * Records one real, documented analytics event (see lib/analytics/events.ts
 * for the full taxonomy). This is the only function UI code should call.
 *
 * Safe by construction — never throws, never blocks the UI (CLAUDE.md
 * Analytics section):
 * - No-ops outside a browser (SSR/RSC — `window` doesn't exist yet).
 * - No-ops until the configured stream's URL collection settings are verified.
 * - Delegates taxonomy validation, PII stripping, and swallowing a sink
 *   failure to dispatchAnalyticsEvent (lib/analytics/events.ts).
 */
export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventProperties<Name>,
): void {
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_PREVIEW_ANALYTICS === '1') {
    dispatchAnalyticsEvent(name, properties, (eventName, payload) => {
      window.dispatchEvent(
        new CustomEvent('esque:analytics', { detail: { name: eventName, properties: payload } }),
      );
    });
    return;
  }
  if (!isAnalyticsConfigured()) return;
  dispatchAnalyticsEvent(name, properties, gtagSink);
}

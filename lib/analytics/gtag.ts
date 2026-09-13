// The thin, browser-only adapter to GA4 — the one piece of this module that
// actually touches a third-party script. Everything else (taxonomy,
// validation, PII stripping) lives in lib/analytics/events.ts and is
// GA4-agnostic. See DECISIONS.md D-055.
//
// `sendGAEvent` (from `@next/third-parties/google`, the current, official
// Next.js-recommended mechanism for loading GA4 — confirmed against this
// project's exact installed Next 16.3.1 via its own bundled docs,
// node_modules/next/dist/docs/01-app/02-guides/third-party-libraries.md)
// pushes onto `window.dataLayer`, which gtag.js (loaded by the
// <GoogleAnalytics> component mounted in app/layout.tsx) drains once it
// finishes loading. Confirmed directly by reading @next/third-parties's own
// source (node_modules/@next/third-parties/dist/google/ga.js): sendGAEvent
// itself already no-ops with a console.warn (never throws) if
// <GoogleAnalytics> was never mounted — but it does not guard against
// running outside a browser at all (it references `window` unconditionally,
// which would throw a ReferenceError under SSR/RSC) — trackEvent's own
// `typeof window` check below is what makes this safe to call from any
// client-component effect/handler regardless of when it fires.
import { sendGAEvent } from '@next/third-parties/google';
import {
  dispatchAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from './events';

/**
 * True once a real GA4 property's measurement ID is configured. Mirrors
 * this project's established placeholder-env-var pattern (D-020's Klaviyo
 * precedent, .env.local.example) — no real GA4 property exists yet, so this
 * is false in every environment this codebase currently runs in, and every
 * trackEvent call safely no-ops as a result.
 */
export function isAnalyticsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);
}

function gtagSink(eventName: string, properties: Record<string, unknown>): void {
  sendGAEvent('event', eventName, properties);
}

/**
 * Records one real, documented analytics event (see lib/analytics/events.ts
 * for the full taxonomy). This is the only function UI code should call.
 *
 * Safe by construction — never throws, never blocks the UI (CLAUDE.md
 * Analytics section):
 * - No-ops outside a browser (SSR/RSC — `window` doesn't exist yet).
 * - No-ops when GA4 isn't configured (NEXT_PUBLIC_GA4_MEASUREMENT_ID unset).
 * - Delegates taxonomy validation, PII stripping, and swallowing a sink
 *   failure to dispatchAnalyticsEvent (lib/analytics/events.ts).
 */
export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventProperties<Name>,
): void {
  if (typeof window === 'undefined') return;
  if (!isAnalyticsConfigured()) return;
  dispatchAnalyticsEvent(name, properties, gtagSink);
}

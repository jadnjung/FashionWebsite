// Shared between actions.ts (sets these cookies on a correct password)
// and proxy.ts (checks for them on every request) — a single source of
// truth so the two can never drift out of sync on the exact names.
export const ACCESS_COOKIE_NAME = 'esque_access';
export const VIP_ACCESS_COOKIE_NAME = 'esque_vip_access';

// ~30 days, per ARCHITECTURE.md §6 / DESIGN_SYSTEM.md §57.
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// A short-lived, deliberately NOT httpOnly, non-authoritative signal cookie
// — see DECISIONS.md D-055. actions.ts sets it (value 'general' or 'vip')
// alongside the real, httpOnly ACCESS_COOKIE_NAME/VIP_ACCESS_COOKIE_NAME
// cookies, only on a successful validatePassword call. Its only purpose is
// letting client-side code (which cannot read the real httpOnly cookies)
// learn that access was JUST granted, so ShellClient can fire the
// access_granted analytics event exactly once and then clear it. This is
// NOT a security boundary: proxy.ts never reads it, and a visitor forging
// their own copy of it grants themselves nothing beyond a fake analytics
// event about their own session — the real access check is unaffected.
export const ACCESS_EVENT_COOKIE_NAME = 'esque_access_event';
// Short on purpose: the client-side read-and-clear (ShellClient.tsx) is the
// primary mechanism; this is only a safety net in case that never runs
// (JavaScript disabled, or the effect throws before clearing it) so a stale
// flag can't linger and misreport "just granted" on a much later visit.
export const ACCESS_EVENT_COOKIE_MAX_AGE_SECONDS = 60;

export type AccessEventTier = 'general' | 'vip';

/**
 * Parses ACCESS_EVENT_COOKIE_NAME's value out of a raw `document.cookie`
 * string. Pure (no DOM access itself) so it stays unit-testable in this
 * project's Node-only vitest environment — the caller (ShellClient.tsx)
 * supplies the real `document.cookie` string, mirroring
 * lib/motion/media.ts's injected-dependency pattern. Returns null when the
 * cookie is absent (the common case — most page loads are not immediately
 * after gaining access) or holds an unrecognized value.
 */
export function parseAccessEventCookie(cookieString: string): AccessEventTier | null {
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${ACCESS_EVENT_COOKIE_NAME}=([^;]*)`));
  if (!match?.[1]) return null;
  const value = decodeURIComponent(match[1]);
  return value === 'general' || value === 'vip' ? value : null;
}

// Collection-scoped early-access cookie logic — see
// app/(storefront)/collections/[handle]/actions.ts (sets these on a
// matching drop code) and app/(storefront)/collections/[handle]/page.tsx
// (reads them to decide whether to render the real collection or the
// locked teaser). A single source of truth so the two can never drift out
// of sync on the exact names/shapes.
//
// The whole-site password gate this file previously backed
// (ACCESS_COOKIE_NAME/VIP_ACCESS_COOKIE_NAME/ACCESS_EVENT_COOKIE_NAME) is
// gone — see DECISIONS.md's gate-removal entry. A returning visitor's
// browser may still hold a stale `esque_access`/`esque_vip_access` cookie
// from before this change; nothing reads those names anymore, so they
// become permanently inert and expire naturally within their own ~30-day
// window. No explicit cleanup is needed.
export const DROP_ACCESS_COOKIE_NAME = 'esque_drop_access';
// Generous (30 days, matching the old gate's own persistence window) —
// harmless once a collection is no longer 'upcoming', since the
// route-level check (page.tsx) only ever consults this cookie during that
// one phase.
export const DROP_ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * True when `cookieValue` (a comma-separated list of unlocked collection
 * handles) names `handle`. The value is a list, not a boolean, so an
 * unlock is scoped to the specific drop it was granted for — a stale
 * cookie from a past drop can never unlock a future, differently-coded
 * one. Every real Shopify handle is a URL-safe slug (no commas), so a
 * plain split is safe for any value this cookie can actually hold —
 * addUnlockedHandle (below) is what enforces that invariant on write,
 * not merely assumes it.
 */
export function hasUnlockedCollection(cookieValue: string | undefined, handle: string): boolean {
  if (!cookieValue) return false;
  return cookieValue.split(',').includes(handle);
}

/**
 * Appends `handle` to the comma-separated list in `cookieValue`, without
 * duplicating a handle that's already present. Used by
 * validateDropAccessCode on a successful code match to build the next
 * cookie value to set.
 *
 * Defensively refuses to append a `handle` containing the delimiter
 * (returns `cookieValue` unchanged instead of a corrupted join). This
 * never affects legitimate traffic — a real Shopify handle never
 * contains a comma — but `handle` reaches this function via
 * validateDropAccessCode's bound server-action argument, and bound
 * arguments are NOT encrypted the way a true closure over a local
 * variable would be (unlike Next.js's documented closure-encryption for
 * inline actions, a `.bind()`-supplied argument is, per React's own
 * "use server" reference, "fully client-controlled... treat [it] as
 * untrusted input"). Without this guard, a tampered request could
 * submit a correct code with a `handle` like `"a,b"` and smuggle two
 * comma-joined entries into one unlock cookie in a single submission.
 */
export function addUnlockedHandle(cookieValue: string | undefined, handle: string): string {
  const existing = cookieValue ? cookieValue.split(',') : [];
  if (handle.includes(',')) return existing.join(',');
  return existing.includes(handle) ? existing.join(',') : [...existing, handle].join(',');
}

// A short-lived, deliberately NOT httpOnly, non-authoritative signal
// cookie — mirrors the deleted whole-site gate's ACCESS_EVENT_COOKIE_NAME
// shape exactly (same reasoning), but its value is an arbitrary collection
// handle, not a closed tier enum. actions.ts sets it (to the unlocked
// handle) alongside the real, httpOnly DROP_ACCESS_COOKIE_NAME cookie,
// only on a successful validateDropAccessCode call. Its only purpose is
// letting client-side code (which cannot read the real httpOnly cookie)
// learn that access was JUST granted, so ShellClient can fire the
// drop_access_granted analytics event exactly once and then clear it. This
// is NOT a security boundary: the route-level check in page.tsx never
// reads it, and a visitor forging their own copy grants themselves nothing
// beyond a fake analytics event about their own session.
export const DROP_ACCESS_EVENT_COOKIE_NAME = 'esque_drop_access_event';
// Short on purpose: the client-side read-and-clear (ShellClient.tsx) is the
// primary mechanism; this is only a safety net in case that never runs
// (JavaScript disabled, or the effect throws before clearing it) so a stale
// flag can't linger and misreport "just granted" on a much later visit.
export const DROP_ACCESS_EVENT_COOKIE_MAX_AGE_SECONDS = 60;

/**
 * Parses DROP_ACCESS_EVENT_COOKIE_NAME's value out of a raw
 * `document.cookie` string. Pure (no DOM access itself) so it stays
 * unit-testable in this project's Node-only vitest environment — the
 * caller (ShellClient.tsx) supplies the real `document.cookie` string,
 * mirroring lib/motion/media.ts's injected-dependency pattern. Returns
 * null when the cookie is absent (the common case) — unlike the deleted
 * parseAccessEventCookie, there is no closed value set to validate
 * against: any decoded, non-empty value is a real collection handle.
 */
export function parseDropAccessEventCookie(cookieString: string): string | null {
  const match = cookieString.match(
    new RegExp(`(?:^|;\\s*)${DROP_ACCESS_EVENT_COOKIE_NAME}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

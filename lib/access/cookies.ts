// Shared between actions.ts (sets these cookies on a correct password)
// and proxy.ts (checks for them on every request) — a single source of
// truth so the two can never drift out of sync on the exact names.
export const ACCESS_COOKIE_NAME = 'esque_access';
export const VIP_ACCESS_COOKIE_NAME = 'esque_vip_access';

// ~30 days, per ARCHITECTURE.md §6 / DESIGN_SYSTEM.md §57.
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

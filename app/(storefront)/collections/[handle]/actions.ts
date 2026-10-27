'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  DROP_ACCESS_COOKIE_NAME,
  DROP_ACCESS_COOKIE_MAX_AGE_SECONDS,
  DROP_ACCESS_EVENT_COOKIE_NAME,
  DROP_ACCESS_EVENT_COOKIE_MAX_AGE_SECONDS,
  addUnlockedHandle,
} from '@/lib/access/cookies';

export interface ValidateDropAccessResult {
  success: false;
}

const dropAccessCookieOptions = {
  httpOnly: true,
  // Not a bare `true`: WebKit (Safari/mobile-safari) refuses to store a
  // `Secure` cookie set over plain `http://localhost` — unlike Chromium,
  // which treats localhost as a secure context regardless of scheme. Gating
  // on NODE_ENV keeps the cookie Secure in every real deployment (production
  // always sets NODE_ENV=production) while allowing local/E2E http
  // development across all browsers. Mirrors the deleted whole-site gate's
  // identical cookieOptions reasoning exactly (see git history).
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: DROP_ACCESS_COOKIE_MAX_AGE_SECONDS,
};

// Deliberately NOT httpOnly (unlike dropAccessCookieOptions above) —
// ShellClient.tsx reads this client-side via document.cookie to fire the
// drop_access_granted analytics event exactly once, then clears it. Not a
// security boundary: see lib/access/cookies.ts's
// DROP_ACCESS_EVENT_COOKIE_NAME comment. Short maxAge is a safety net in
// case the client-side clear never runs.
const dropAccessEventCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: DROP_ACCESS_EVENT_COOKIE_MAX_AGE_SECONDS,
};

/**
 * Compares the submitted `code` field against this one env-var-held
 * secret (plain string equality, after trimming incidental leading/
 * trailing whitespace from both sides — intentionally not hashed/
 * rate-limited; this is a brand gate, not a security boundary, per
 * CONTENT.md §5 and DECISIONS.md D-005, carried over unchanged for the
 * collection-scoped mechanic). The trim guards against the one real
 * delivery channel for this code — a manually-sent Klaviyo email with the
 * code on its own line (PROJECT.md §21) — where copy-pasting out of a
 * mail client is exactly the action most likely to carry an incidental
 * space; it does not loosen the match in any other way (still exact,
 * still case-sensitive, still no substring match). See DECISIONS.md
 * D-084. On a match, appends `handle` to the unlocked-handles cookie
 * and redirects back to the same `/collections/${handle}` URL — the fresh
 * server render then reads the now-set cookie and renders CollectionView
 * instead of the teaser. redirect() throws internally by design (Next.js's
 * documented mechanism for triggering navigation from a Server Action) —
 * this function never actually returns on that path. Only a non-matching
 * code resolves normally, with `{ success: false }` for the caller's
 * branded incorrect-code UI — never throws for a wrong code, since that's
 * an expected outcome, not a failure.
 *
 * Takes `(handle, prevState, formData)` rather than the plain
 * `(prevState, formData)` useActionState shape: this action needs to know
 * *which* collection's code to check against, and useActionState requires
 * a 2-arg action signature. The call site
 * (DropAccessForm.tsx) binds `handle` via
 * `validateDropAccessCode.bind(null, handle)` before passing the result to
 * useActionState — the documented Next.js/React pattern for a bound server
 * action.
 */
export async function validateDropAccessCode(
  handle: string,
  _prevState: ValidateDropAccessResult,
  formData: FormData,
): Promise<ValidateDropAccessResult> {
  const code = String(formData.get('code') ?? '');
  const configuredCode = process.env.ESQUE_DROP_ACCESS_CODE;
  const cookieStore = await cookies();

  if (configuredCode && code.trim() === configuredCode.trim()) {
    const existing = cookieStore.get(DROP_ACCESS_COOKIE_NAME)?.value;
    cookieStore.set(
      DROP_ACCESS_COOKIE_NAME,
      addUnlockedHandle(existing, handle),
      dropAccessCookieOptions,
    );
    cookieStore.set(DROP_ACCESS_EVENT_COOKIE_NAME, handle, dropAccessEventCookieOptions);
    redirect(`/collections/${handle}`);
  }

  return { success: false };
}

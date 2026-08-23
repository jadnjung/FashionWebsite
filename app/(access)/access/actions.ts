'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ACCESS_COOKIE_NAME,
  VIP_ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/access/cookies';
import { subscribeToAccessList } from '@/lib/klaviyo/subscribe';

export interface ValidatePasswordResult {
  success: false;
}

const cookieOptions = {
  httpOnly: true,
  // Not a bare `true`: WebKit (Safari/mobile-safari) refuses to store a
  // `Secure` cookie set over plain `http://localhost` — unlike Chromium,
  // which treats localhost as a secure context regardless of scheme.
  // Verified directly: with `secure: true` unconditionally, the E2E cookie
  // assertions in tests/e2e/access-gate.spec.ts passed on chromium but
  // failed on mobile-safari (`esque_access` cookie never present after a
  // correct password). Gating on NODE_ENV keeps the cookie Secure in every
  // real deployment (production always sets NODE_ENV=production) while
  // allowing local/E2E http development across all browsers.
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
};

/**
 * Compares `password` against the general and early-access passwords
 * (plain string equality — intentionally not hashed/rate-limited; this is
 * a brand gate, not a security boundary, per CONTENT.md §5 and
 * DECISIONS.md D-005). On a match, sets the appropriate access cookie(s)
 * and redirects to `/`. redirect() throws internally by design (Next.js's
 * documented mechanism for triggering navigation from a Server Action,
 * verified against current docs) — this function never actually returns
 * on that path, so callers must never wrap it in a try/catch (that would
 * swallow the redirect). Only a non-matching password resolves normally,
 * with `{ success: false }` for the caller's branded incorrect-password
 * UI — never throws for a wrong password, since that's an expected
 * outcome, not a failure.
 */
export async function validatePassword(password: string): Promise<ValidatePasswordResult> {
  const generalPassword = process.env.ESQUE_ACCESS_PASSWORD;
  const earlyAccessPassword = process.env.ESQUE_EARLY_ACCESS_PASSWORD;
  const cookieStore = await cookies();

  // Early-access checked first: if an operator ever misconfigures both env
  // vars to the same value, this ordering still grants the higher tier
  // rather than silently downgrading it. Both branches guard on the env
  // var itself being truthy — without that, an unset ESQUE_ACCESS_PASSWORD
  // (empty string) would match an empty submitted password.
  if (earlyAccessPassword && password === earlyAccessPassword) {
    cookieStore.set(ACCESS_COOKIE_NAME, '1', cookieOptions);
    cookieStore.set(VIP_ACCESS_COOKIE_NAME, '1', cookieOptions);
    redirect('/');
  }

  if (generalPassword && password === generalPassword) {
    cookieStore.set(ACCESS_COOKIE_NAME, '1', cookieOptions);
    redirect('/');
  }

  return { success: false };
}

export interface RequestAccessState {
  success: boolean;
  error?: string;
}

/**
 * Validates the Request Access form's fields server-side (native HTML
 * `required` attributes are the first line of defense client-side, but
 * "client-side checks are not authorization" — this is the real
 * boundary). Missing/invalid input is an expected, recoverable outcome
 * and is returned as state (Next.js's own recommended pattern for form
 * validation with useActionState), not thrown.
 *
 * A genuine failure calling Klaviyo (not configured, or a real API
 * error) is different: that throws through to the nearest error.tsx
 * boundary rather than being modeled as a return value, per Next.js's
 * own distinction between expected and uncaught/unexpected errors, and
 * per this feature's design spec's Error Handling section.
 */
export async function submitRequestAccess(
  _prevState: RequestAccessState,
  formData: FormData,
): Promise<RequestAccessState> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const consent = formData.get('consent') === 'on';

  if (!firstName) {
    return { success: false, error: 'First name is required.' };
  }
  if (!email) {
    return { success: false, error: 'Email is required.' };
  }
  if (!consent) {
    return { success: false, error: 'Consent is required to request access.' };
  }

  await subscribeToAccessList(email);

  return { success: true };
}

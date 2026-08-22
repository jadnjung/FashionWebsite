'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ACCESS_COOKIE_NAME,
  VIP_ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/access/cookies';

export interface ValidatePasswordResult {
  success: false;
}

const cookieOptions = {
  httpOnly: true,
  secure: true,
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

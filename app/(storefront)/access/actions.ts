'use server';

import { subscribeToAccessList } from '@/lib/klaviyo/subscribe';

// `field` names the one input `error` actually concerns — DECISIONS.md
// D-050. Every branch below returns at most one error, always about a
// specific, known field (the checks short-circuit in order), so this is
// never ambiguous. RequestAccessForm.tsx uses it to set aria-invalid/
// aria-describedby on that field alone, rather than either marking every
// field invalid (misleading — only one is actually wrong) or associating
// the error with no field at all.
export type RequestAccessField = 'firstName' | 'email' | 'consent';

export interface RequestAccessState {
  success: boolean;
  error?: string;
  field?: RequestAccessField;
}

// Deliberately minimal — a sanity check, not an RFC-5322 validator: a
// non-empty local part, an "@", and a non-empty domain containing a dot.
// Hoisted to module scope so the regex is compiled once, not on every
// submission. This exists because the client's `type="email"` constraint
// (RequestAccessForm.tsx) is not itself a server-side guarantee — a client
// that bypasses the form (exactly what the neighbouring consent-bypass E2E
// test simulates) can submit anything as `email`, and Klaviyo's API
// returning a 400 for a malformed address would otherwise surface as an
// uncaught error-boundary crash for a recoverable typo instead of the
// branded validation message this function already returns for the other
// fields.
const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return { success: false, error: 'First name is required.', field: 'firstName' };
  }
  if (!email) {
    return { success: false, error: 'Email is required.', field: 'email' };
  }
  if (!EMAIL_FORMAT_PATTERN.test(email)) {
    return { success: false, error: 'Email is invalid.', field: 'email' };
  }
  if (!consent) {
    return { success: false, error: 'Consent is required to request access.', field: 'consent' };
  }

  await subscribeToAccessList(email);

  return { success: true };
}

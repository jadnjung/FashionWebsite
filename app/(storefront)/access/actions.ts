'use server';

import { subscribeToAccessList } from '@/lib/klaviyo/subscribe';

export type RequestAccessField = 'email' | 'consent';
export interface RequestAccessState {
  success: boolean;
  error?: string;
  field?: RequestAccessField;
}

const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitRequestAccess(
  _prevState: RequestAccessState,
  formData: FormData,
): Promise<RequestAccessState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { success: false, error: 'Email is required.', field: 'email' };
  if (email.length > 254 || !EMAIL_FORMAT_PATTERN.test(email)) {
    return { success: false, error: 'Enter a valid email address.', field: 'email' };
  }
  if (formData.get('consent') !== 'on') {
    return { success: false, error: 'Consent is required to request access.', field: 'consent' };
  }
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    if (formData.get('previewOutcome') === 'unavailable') {
      return {
        success: false,
        error: 'The preview request failed. Choose a successful outcome and try again.',
      };
    }
    return { success: true };
  }
  try {
    await subscribeToAccessList(email);
    return { success: true };
  } catch {
    console.error('Request Access subscription failed.');
    return { success: false, error: 'Your request could not be submitted. Please try again.' };
  }
}

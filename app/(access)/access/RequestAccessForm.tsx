'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitRequestAccess, type RequestAccessState } from './actions';

const initialState: RequestAccessState = { success: false };

export function RequestAccessForm({ onBack }: { onBack: () => void }) {
  const [state, formAction, pending] = useActionState(submitRequestAccess, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-heading-2 tracking-display text-esque-text">ACCESS SENT.</p>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          CHECK YOUR EMAIL.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-4 text-center">
      <Input label="FIRST NAME" name="firstName" required autoComplete="given-name" />
      <Input label="EMAIL" name="email" type="email" required autoComplete="email" />
      <label className="flex items-start gap-2 text-left text-utility text-esque-text-secondary">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        />
        I agree to receive Esque emails, including access and collection updates.
      </label>
      {state.error && (
        // text-esque-text, not text-esque-error: --color-esque-error (#A74338)
        // measures 3.40:1 against --color-esque-black (#050505) — below WCAG
        // AA's 4.5:1 minimum for this text size. DESIGN_SYSTEM.md's Error
        // entry also asks errors to rely on typography/motion rather than
        // bright red UI. Matches the incorrect-password message in
        // AccessForm.tsx for consistency (see DECISIONS.md D-021).
        <p role="alert" className="text-utility uppercase tracking-metadata text-esque-text">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
          REQUEST ACCESS
        </Button>
        <Button type="button" variant="editorial" onClick={onBack} disabled={pending}>
          Back
        </Button>
      </div>
    </form>
  );
}

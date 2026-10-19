'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics/gtag';
import { validateDropAccessCode, type ValidateDropAccessResult } from './actions';

// CONTENT.md §5 — moved from the deleted app/(access)/access/AccessForm.tsx
// unchanged: explicitly permitted for reuse as "incorrect code," not just
// "incorrect password" — never the generic "Incorrect password.", and
// never an immediate repeat of the last line shown.
export const INCORRECT_CODE_MESSAGES = [
  'NOT THIS ONE.',
  'ACCESS NOT RECOGNIZED.',
  'TRY ANOTHER.',
  'ACCESS DENIED.',
  'TRY AGAIN.',
] as const;

export function pickNextMessage(lastMessage: string | null): string {
  const candidates = lastMessage
    ? INCORRECT_CODE_MESSAGES.filter((message) => message !== lastMessage)
    : INCORRECT_CODE_MESSAGES;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

// Stable module-level reference — `state === initialState` is how the
// render-time derivation below distinguishes "no attempt yet" from "first
// attempt just failed" the moment `state` first changes.
const initialState: ValidateDropAccessResult = { success: false };

export function DropAccessForm({ handle }: { handle: string }) {
  // Bound server action: validateDropAccessCode needs `handle` (which
  // collection's code to check against) in addition to useActionState's
  // own 2-arg (prevState, formData) shape — Next.js/React's documented
  // pattern for a bound server action.
  const boundAction = validateDropAccessCode.bind(null, handle);
  // CODE is deliberately an *uncontrolled* input (no `value`/`onChange`)
  // submitted via `<form action={formAction}>` — same fix as the deleted
  // AccessForm.tsx's PASSWORD field (D-022): validateDropAccessCode reads
  // the code from the submitted FormData, the browser's own native form
  // serialization, always accurate at submit time regardless of hydration
  // timing.
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Derives the rotating branded message and the shake-animation `attempt`
  // counter from *changes* to the action's result — React's own documented
  // alternative to an Effect for "respond to a value that changed."
  // `state` only ever changes identity when validateDropAccessCode
  // actually resolves — a correct code redirects (redirect() throws
  // instead of resolving), so every resolved `state` here is a genuine
  // failed attempt.
  const [priorState, setPriorState] = useState(state);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  if (state !== priorState) {
    setPriorState(state);
    setErrorMessage((previous) => pickNextMessage(previous));
    setAttempt((count) => count + 1);
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 text-center">
      <form
        action={formAction}
        // Fires on every real submission attempt, regardless of eventual
        // server-side validation outcome — mirrors request_access_attempt's
        // exact "fires on every submission, doesn't preventDefault" shape.
        // Never includes the submitted code itself.
        onSubmit={() => trackEvent('drop_access_attempt', { collection_handle: handle })}
        className="flex w-full flex-col gap-4"
      >
        {/* Re-keyed per attempt so the shift animation restarts on every
            failure, even repeated ones with the CSS class name unchanged. */}
        <div key={attempt} className={attempt > 0 ? 'esque-access-error-shift' : undefined}>
          <Input
            label="EARLY ACCESS CODE"
            type="text"
            name="code"
            autoComplete="off"
            required
            // Restores focus to the code field after each failed attempt,
            // via the key={attempt} remount above. Excludes the very first,
            // initial-load mount — a visitor landing on the teaser for the
            // first time shouldn't have focus stolen from them.
            autoFocus={attempt > 0}
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? 'drop-access-code-error' : undefined}
          />
        </div>
        {errorMessage && (
          <p
            id="drop-access-code-error"
            key={`${errorMessage}-${attempt}`}
            role="alert"
            // text-esque-text, not text-esque-error — D-021: --color-esque-error
            // fails WCAG AA contrast at this text size. DESIGN_SYSTEM.md's
            // Error entry also asks errors to rely on typography/motion
            // rather than bright red UI, which the shift + letter-spacing
            // split already provides.
            className="esque-access-error-message text-utility uppercase tracking-metadata text-esque-text"
          >
            {errorMessage}
          </p>
        )}
        <div className="flex items-center justify-center">
          <Button type="submit" variant="primary" disabled={isPending}>
            ENTER
          </Button>
        </div>
      </form>
      <Link
        href="/access"
        className="text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
      >
        DON&apos;T HAVE A CODE? REQUEST ACCESS.
      </Link>
    </div>
  );
}

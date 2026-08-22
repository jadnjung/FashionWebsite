'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validatePassword } from './actions';
import { RequestAccessForm } from './RequestAccessForm';

// CONTENT.md §5 — never the generic "Incorrect password.", and never an
// immediate repeat of the last line shown.
export const INCORRECT_PASSWORD_MESSAGES = [
  'NOT THIS ONE.',
  'ACCESS NOT RECOGNIZED.',
  'TRY ANOTHER.',
  'ACCESS DENIED.',
  'TRY AGAIN.',
] as const;

export function pickNextMessage(lastMessage: string | null): string {
  const candidates = lastMessage
    ? INCORRECT_PASSWORD_MESSAGES.filter((message) => message !== lastMessage)
    : INCORRECT_PASSWORD_MESSAGES;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export function AccessForm() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Toggle owned here (not a separate wrapper component) so the entry
  // screen and the Request Access screen share one interactive unit — the
  // spec names AccessForm/RequestAccessForm as the two Client Components;
  // nothing in it requires a third file just to hold this one boolean.
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    // A correct password redirects server-side via next/navigation's
    // redirect() inside validatePassword, which throws internally to
    // trigger client-side navigation (verified Next.js behavior) — this
    // call is deliberately NOT wrapped in try/catch, which would swallow
    // that redirect. Execution only reaches the lines below when the
    // password was wrong (validatePassword resolved normally instead).
    await validatePassword(password);
    setIsSubmitting(false);
    setErrorMessage((previous) => pickNextMessage(previous));
    setAttempt((count) => count + 1);
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Rendered above the showRequestAccess conditional (not inside an
          early return) so it stays on screen in both states — ENTER ESQUE
          is the page's own title (CONTENT.md §3), not the entry form's
          label, so the Request Access screen must not lose its only
          heading. */}
      <h1 className="font-display text-display-l tracking-display text-esque-text">ENTER ESQUE</h1>
      {showRequestAccess ? (
        <RequestAccessForm onBack={() => setShowRequestAccess(false)} />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
            {/* Re-keyed per attempt so the shift animation restarts on every
                failure, even repeated ones with the CSS class name unchanged. */}
            <div key={attempt} className={attempt > 0 ? 'esque-access-error-shift' : undefined}>
              <Input
                label="PASSWORD"
                type="password"
                name="password"
                autoComplete="off"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                // Restores focus to the password field after each failed
                // attempt. The remount above (needed to restart the CSS
                // shift animation) would otherwise silently drop focus to
                // <body> — a real regression for anyone submitting via
                // Enter. Only fires on a keyed remount, never on initial
                // load (attempt starts at 0), so it needs no effect.
                autoFocus={attempt > 0}
              />
            </div>
            {errorMessage && (
              <p
                key={`${errorMessage}-${attempt}`}
                role="alert"
                // text-esque-text, not text-esque-error: --color-esque-error
                // (#A74338) measures 3.40:1 against --color-esque-black
                // (#050505) — below WCAG AA's 4.5:1 minimum for this text
                // size. DESIGN_SYSTEM.md §56 also asks errors to rely on
                // typography/motion rather than bright red UI, which the
                // shift + letter-spacing split already provides. See
                // DECISIONS.md D-021.
                className="esque-access-error-message text-utility uppercase tracking-metadata text-esque-text"
              >
                {errorMessage}
              </p>
            )}
            <div className="flex items-center justify-center gap-4">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                ENTER
              </Button>
              <Button type="button" variant="editorial" onClick={() => setShowRequestAccess(true)}>
                REQUEST ACCESS
              </Button>
            </div>
          </form>
          <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            ACCESS TO CURRENT COLLECTIONS.
          </p>
        </>
      )}
    </div>
  );
}

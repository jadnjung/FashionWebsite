'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validatePassword, type ValidatePasswordResult } from './actions';
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

// Stable module-level reference (mirrors RequestAccessForm.tsx's own
// `initialState` constant) — `state === initialState` is how the render-time
// derivation below distinguishes "no attempt yet" from "first attempt just
// failed" the moment `state` first changes.
const initialState: ValidatePasswordResult = { success: false };

export function AccessForm() {
  // PASSWORD is deliberately an *uncontrolled* input (see the Input usage
  // below — no `value`/`onChange`) submitted via `<form action={formAction}>`.
  // validatePassword reads the password from the submitted FormData, not
  // from React state, so the browser's own native form serialization —
  // always accurate at submit time, with or without hydration having
  // finished — is the only source of truth for what was typed. This is a
  // deliberate fix for a real defect: the previous controlled-input
  // (`useState` + `onChange`) version could silently submit an empty
  // password on mobile-safari if a keystroke's `input` event fired before
  // React finished hydrating and attached the listener. See actions.ts's
  // validatePassword docstring and tests/e2e/access-gate.spec.ts's
  // native-value regression test, which pins this exact defect.
  const [state, formAction, isPending] = useActionState(validatePassword, initialState);
  // Toggle owned here (not a separate wrapper component) so the entry
  // screen and the Request Access screen share one interactive unit — the
  // spec names AccessForm/RequestAccessForm as the two Client Components;
  // nothing in it requires a third file just to hold this one boolean.
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  // Derives the rotating branded message and the shake-animation `attempt`
  // counter from *changes* to the action's result, instead of mutating them
  // inside a manual submit handler (there is no manual handler anymore —
  // the form submits via the action directly). Adjusting state during
  // rendering, guarded by an identity comparison, is React's own documented
  // alternative to an Effect for "respond to a value that changed": it
  // re-renders immediately with the corrected state before anything commits
  // to the screen, rather than committing a stale frame first and fixing it
  // up afterward the way an Effect-based version would.
  // `state` only ever changes identity when validatePassword actually
  // resolves — a correct password redirects (redirect() throws instead of
  // resolving), so every resolved `state` here is a genuine failed attempt.
  // Comparing against the stable module-level `initialState` reference
  // (captured as this state's own initial value) is what makes the very
  // first failure detectable as a change, exactly like RequestAccessForm's
  // `state.success`/`state.error` checks distinguish "no submission yet"
  // from a real result.
  const [priorState, setPriorState] = useState(state);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  if (state !== priorState) {
    setPriorState(state);
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
          <form action={formAction} className="flex w-full max-w-xs flex-col gap-4">
            {/* Re-keyed per attempt so the shift animation restarts on every
                failure, even repeated ones with the CSS class name unchanged. */}
            <div key={attempt} className={attempt > 0 ? 'esque-access-error-shift' : undefined}>
              <Input
                label="PASSWORD"
                type="password"
                name="password"
                autoComplete="off"
                required
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
                // typography and motion rather than bright red UI, which the
                // shift + letter-spacing split already provides. See
                // DECISIONS.md D-021.
                className="esque-access-error-message text-utility uppercase tracking-metadata text-esque-text"
              >
                {errorMessage}
              </p>
            )}
            <div className="flex items-center justify-center gap-4">
              <Button type="submit" variant="primary" disabled={isPending}>
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

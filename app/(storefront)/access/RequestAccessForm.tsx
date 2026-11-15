'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { trackEvent } from '@/lib/analytics/gtag';
import { submitRequestAccess, type RequestAccessState } from './actions';

const initialState: RequestAccessState = { success: false };

// `onBack` (and the rendered "Back" button it supported) is gone: this
// form no longer toggles between itself and a sibling password screen —
// there is no whole-site gate left to return to, and /access now lives
// inside the storefront shell, so Header's own navigation already
// provides a way elsewhere.
export function RequestAccessForm({ demo = false }: { demo?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(submitRequestAccess, initialState);

  // Access Funnel: "Request Access opens" (PROJECT.md §82). Previously
  // fired from AccessForm's now-deleted REQUEST ACCESS toggle button;
  // visiting /access directly *is* opening the request-access flow now,
  // with no separate "open" gesture left to attach the event to, so this
  // fires once on mount instead.
  useEffect(() => {
    trackEvent('request_access_open', {});
  }, []);

  useEffect(() => {
    if (state.success) {
      successRef.current?.focus();
      return;
    }
    if (state.error) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (state.success) {
    return (
      // role="status" — DECISIONS.md D-051: this success screen replaces the
      // whole form (the same "new content appears in place of the old" shape
      // role="alert" already handles elsewhere in this file/AccessForm.tsx),
      // so a screen-reader user submitting the form hears the outcome
      // without needing to notice the visual change themselves.
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="flex flex-col items-center gap-2 text-center"
      >
        <p className="font-display text-heading-2 tracking-display text-esque-text">
          {demo ? 'PREVIEW COMPLETE.' : 'REQUEST RECEIVED.'}
        </p>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          {demo
            ? 'Your demonstration request is complete.'
            : 'Your subscription request has been submitted for future collection updates.'}
        </p>
      </div>
    );
  }

  // Ties the one actually-invalid field to the error message
  // programmatically — DECISIONS.md D-050 — in addition to the role="alert"
  // announcement below. submitRequestAccess's `field` names exactly which
  // input `error` concerns (its checks short-circuit in order, so there's
  // never more than one at a time); marking every field invalid regardless
  // would misinform the user about which one actually needs fixing.
  const errorFieldProps = (field: RequestAccessState['field']) =>
    state.field === field
      ? { 'aria-invalid': true as const, 'aria-describedby': 'request-access-error' }
      : {};

  return (
    <form
      ref={formRef}
      action={formAction}
      onReset={(event) => event.preventDefault()}
      aria-busy={pending}
      // Access Funnel: "Request Access conversion attempt" (PROJECT.md
      // §82) — fires on every real submission attempt, regardless of
      // eventual server-side validation outcome, which is exactly what
      // "attempt" means. Deliberately carries no properties: the submitted
      // email/consent values must never reach an analytics
      // payload (CLAUDE.md's Analytics section) — dispatchAnalyticsEvent's
      // PII denylist would strip them anyway, but not reading them here at
      // all is the more honest, defense-in-depth choice. Does not call
      // preventDefault, so the actual form action submission proceeds
      // exactly as before.
      onSubmit={() => trackEvent('request_access_attempt', {})}
      className="flex w-full max-w-xs flex-col gap-4 text-center"
    >
      <Input
        label="EMAIL"
        name="email"
        type="email"
        required
        autoComplete="email"
        spellCheck={false}
        maxLength={254}
        {...errorFieldProps('email')}
      />
      {/* WCAG 2.2 AA (2.5.8): an independent review measured this checkbox's
          own rendered box at 13x13px — under the 24x24 minimum, and, unlike
          FilterBar's/ShopTheLookPanel's checkboxes, visibly non-square
          despite an explicit h-4 w-4. Root-caused live (not assumed): as an
          `items-start` flex child sitting beside a long, wrapping sentence
          with no `shrink-0`, the checkbox's default flex-shrink:1 was
          compressing its WIDTH (the row's main axis) to help fit the text,
          while its height (the cross axis, unaffected by shrinking) stayed
          at the specified 16px — confirmed by computed style: width 13px,
          height 16px, before this fix; `shrink-0` alone (independent of
          accent-esque-forest, added below purely for the DESIGN_SYSTEM.md
          color-consistency reason, not this bug) restores it to a true
          16x16 square. `py-1` on the label grows the overall clickable box
          to clear 24px vertically, matching FilterBar's identical fix,
          without changing the checkbox's own visual size. */}
      <label className="flex items-start gap-2 py-1 text-left text-utility text-esque-text-secondary">
        <input
          type="checkbox"
          name="consent"
          required
          // accent-esque-forest: DESIGN_SYSTEM.md's color rule reserves the
          // forest accent for real selection states — this consent checkbox
          // is no different in kind from FilterBar's/ShopTheLookPanel's,
          // both of which already use it; this was the one inconsistent
          // holdout.
          className="mt-1 h-4 w-4 shrink-0 accent-esque-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          {...errorFieldProps('consent')}
        />
        I agree to receive Esque emails, including access and collection updates.
      </label>
      {state.error && (
        // text-esque-text, not text-esque-error: --color-esque-error (#A74338)
        // measures 3.40:1 against --color-esque-black (#050505) — below WCAG
        // AA's 4.5:1 minimum for this text size. DESIGN_SYSTEM.md's Error
        // entry also asks errors to rely on typography/motion rather than
        // bright red UI. Matches DropAccessForm.tsx's incorrect-code
        // message for consistency (see DECISIONS.md D-021).
        <p
          id="request-access-error"
          role="alert"
          className="text-utility uppercase tracking-metadata text-esque-text"
        >
          {state.error}
        </p>
      )}
      {demo && (
        <div className="flex flex-col gap-2 text-left text-utility text-esque-text-secondary">
          <p>Demo request with a simulated outcome.</p>
          <label htmlFor="preview-outcome">Preview outcome</label>
          <select
            id="preview-outcome"
            name="previewOutcome"
            className="min-h-11 border border-esque-text-secondary bg-esque-black px-3 text-esque-text"
          >
            <option value="success">Successful request</option>
            <option value="unavailable">Service unavailable</option>
          </select>
        </div>
      )}
      <div className="flex items-center justify-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'SUBMITTING…' : 'REQUEST ACCESS'}
        </Button>
      </div>
    </form>
  );
}

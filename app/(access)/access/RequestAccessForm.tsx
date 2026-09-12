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
      // role="status" — DECISIONS.md D-051: this success screen replaces the
      // whole form (the same "new content appears in place of the old" shape
      // role="alert" already handles elsewhere in this file/AccessForm.tsx),
      // so a screen-reader user submitting the form hears the outcome
      // without needing to notice the visual change themselves.
      <div role="status" className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-heading-2 tracking-display text-esque-text">ACCESS SENT.</p>
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          CHECK YOUR EMAIL.
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
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-4 text-center">
      <Input
        label="FIRST NAME"
        name="firstName"
        required
        autoComplete="given-name"
        // DECISIONS.md D-051 — this component only ever mounts when the
        // visitor has just clicked REQUEST ACCESS on the entry screen (an
        // independent review live-confirmed that transition previously
        // dropped keyboard focus to <body> with nothing claiming it), so
        // autofocusing its first field on every mount is always a wanted
        // response to that deliberate action, unlike AccessForm's own
        // PASSWORD field (which must NOT autofocus on an arriving visitor's
        // very first, unprompted page load).
        autoFocus
        {...errorFieldProps('firstName')}
      />
      <Input
        label="EMAIL"
        name="email"
        type="email"
        required
        autoComplete="email"
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
        // bright red UI. Matches the incorrect-password message in
        // AccessForm.tsx for consistency (see DECISIONS.md D-021).
        <p
          id="request-access-error"
          role="alert"
          className="text-utility uppercase tracking-metadata text-esque-text"
        >
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

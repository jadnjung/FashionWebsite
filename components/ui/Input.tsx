import type { InputHTMLAttributes } from 'react';
import { focusRing } from './focus-ring';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

// DESIGN_SYSTEM.md has no dedicated Input section (unlike Button's §17) —
// this is assembled from the guidance that does exist: surface-black is
// documented as the color for "input surfaces" (§4), the shared
// focus-visible ring applies here exactly as it does to every other
// interactive element (§22, PROJECT.md §78), and the documented Error
// color (§4) drives the one visual error state DESIGN_SYSTEM.md's color
// system actually defines. No `variant` prop: nothing documents more than
// one Input treatment.
//
// Labeling and keyboard behavior are the consumer's responsibility via
// standard HTML (<label htmlFor>) — same division as Button, which
// doesn't manage its own accessible name either. A plain <input> is
// already fully keyboard-operable (focus, typing, selection) with nothing
// custom to add or break.
//
// Error state: styled off `aria-invalid="true"` rather than the native
// :invalid/:user-invalid pseudo-classes, because a consumer may need to
// show an error the browser's own HTML5 constraint validation can't
// express (e.g. a server-rejected value) — aria-invalid is
// application-settable regardless of *why* something is invalid.
// aria-invalid isn't one of Tailwind's built-in aria-* variants (only
// checked/disabled/expanded/hidden/pressed/readonly/required/selected
// are, verified against current Tailwind docs), so this uses the
// arbitrary-value form. Error *copy* is intentionally out of scope here —
// no pattern is documented yet (CONTENT.md has no validation-message
// section) and inventing one isn't this component's job.
//
// No real form exists yet to consume this — see DECISIONS.md D-012 for
// how it's tested (a dev-only preview route) without one.
export function Input({ className = '', ...props }: InputProps) {
  const classes =
    `w-full min-h-11 rounded-none border border-esque-text-muted bg-esque-surface px-3 py-2 font-functional text-body text-esque-text placeholder:text-esque-text-secondary transition-colors duration-200 ease-esque hover:border-esque-text-secondary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-esque-text-muted aria-[invalid=true]:border-esque-error ${focusRing} ${className}`.trim();
  return <input className={classes} {...props} />;
}

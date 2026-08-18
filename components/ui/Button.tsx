import type { ButtonHTMLAttributes, Ref } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'editorial';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  // React 19 supports `ref` as a plain prop on function components — no
  // forwardRef wrapper needed. Consumers that need the underlying DOM node
  // (e.g. FullScreenMenu restoring focus to the MENU trigger) can pass one.
  ref?: Ref<HTMLButtonElement>;
}

// Applied to every variant — DESIGN_SYSTEM.md §22's cursor/focus rules and
// PROJECT.md §78 both require a visible focus state on every interactive
// element; this is not optional regardless of how restrained the resting
// visual style is.
//
// Uses --color-esque-text (outline-esque-text), not --color-esque-forest:
// forest measures ~1.71:1 against the app's black background and ~1.65:1
// against the surface color, both under WCAG 1.4.11's 3:1 minimum for
// focus indicators. See DECISIONS.md D-010.
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text';

const variantClasses: Record<ButtonVariant, string> = {
  // DESIGN_SYSTEM.md §17 — Primary: bg #F3F1EA, text #050505, rectangular
  primary: `bg-esque-text text-esque-black rounded-none px-6 py-3 transition-opacity duration-200 ease-esque hover:opacity-90 ${focusRing}`,
  // Secondary: transparent, thin border, hover reveals underline
  secondary: `bg-transparent text-esque-text border border-esque-text-secondary rounded-none px-6 py-3 transition-colors duration-200 ease-esque hover:border-esque-text ${focusRing}`,
  // Editorial CTA: text-based, no fill
  editorial: `bg-transparent text-esque-text underline-offset-4 tracking-nav uppercase transition-colors duration-200 ease-esque hover:text-esque-text-secondary ${focusRing}`,
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const classes = `${variantClasses[variant]} ${className}`.trim();
  return <button className={classes} {...props} />;
}

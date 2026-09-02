import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'editorial';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Applied to every variant — DESIGN_SYSTEM.md §22's cursor/focus rules and
// PROJECT.md §78 both require a visible focus state on every interactive
// element; this is not optional regardless of how restrained the resting
// visual style is.
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-forest';

const variantClasses: Record<ButtonVariant, string> = {
  // DESIGN_SYSTEM.md §17 — Primary: bg #F3F1EA, text #050505, rectangular
  primary: `bg-esque-text text-esque-black rounded-none px-6 py-3 transition-opacity duration-200 ease-esque hover:opacity-90 ${focusRing}`,
  // Secondary: transparent, thin border, hover reveals underline.
  // Padding is mobile-first compact (px-3 py-2) and steps up to the full
  // px-6 py-3 at md+ — Header's row of four secondary buttons (Task 8)
  // overflows a 375px viewport at the uniform padding a single button
  // looks fine with; discovered via Task 8's mobile-overflow test.
  // min-h-11 (44px, via the --spacing: 4px token) guarantees a comfortable
  // tap target at every breakpoint regardless of how compact the padding
  // gets — the compact mobile padding alone would clear WCAG's 24px
  // minimum but sit well under the 44px usable-touch-target bar CLAUDE.md
  // requires.
  secondary: `bg-transparent text-esque-text border border-esque-text-secondary rounded-none min-h-11 px-3 py-2 md:px-6 md:py-3 transition-colors duration-200 ease-esque hover:border-esque-text ${focusRing}`,
  // Editorial CTA: text-based, no fill
  editorial: `bg-transparent text-esque-text underline-offset-4 tracking-nav uppercase transition-colors duration-200 ease-esque hover:text-esque-text-secondary ${focusRing}`,
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const classes = `${variantClasses[variant]} ${className}`.trim();
  return <button className={classes} {...props} />;
}

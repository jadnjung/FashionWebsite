import { Inter, Oswald } from 'next/font/google';

// PLACEHOLDER: real typefaces are an open decision (PROJECT.md §101).
//
// next/font/local with an empty `src: []` array (relying purely on its
// `fallback` system-font list) was tried first, per DESIGN_SYSTEM.md §6-7's
// "functional Swiss sans / expressive display grotesk" direction, but it
// fails at build time — Next.js's font loader requires at least one font
// source file:
//   Error: Module not found: Can't resolve 'next/font/local/target.css'
//   At least one font is required
//
// Falling back to next/font/google's Inter (functional — a widely-available
// highly readable modern grotesk) and Oswald (display — a condensed grotesk,
// matching the "condensed/extended grotesk" preferred direction) until real
// licensed typefaces are chosen. Swapping in real fonts later is a one-file
// change here — no component touches font loading directly.
export const functionalFont = Inter({
  subsets: ['latin'],
  variable: '--font-functional',
});

export const displayFont = Oswald({
  subsets: ['latin'],
  variable: '--font-display',
});

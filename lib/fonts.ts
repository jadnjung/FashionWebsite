import { Inter, Oswald } from 'next/font/google';

// PLACEHOLDER: real typefaces are an open decision (PROJECT.md §101).
// next/font/local with an empty `src` array (the plan's primary approach)
// fails at build time — "Module not found: Can't resolve
// 'next/font/local/target.css' / At least one font is required" — because
// next/font/local requires at least one real font file to resolve against.
// Falling back to the plan's own documented alternative: Inter (functional)
// and Oswald (display, a condensed-grotesk-family placeholder), both
// widely-available, well-known-safe placeholders matching DESIGN_SYSTEM.md
// §6-7's "highly readable modern sans-serif" / "condensed grotesk"
// direction. Swapping in real, licensed typefaces later is still a
// one-file change confined to this module.
export const functionalFont = Inter({ subsets: ['latin'], variable: '--font-functional' });
export const displayFont = Oswald({ subsets: ['latin'], variable: '--font-display' });

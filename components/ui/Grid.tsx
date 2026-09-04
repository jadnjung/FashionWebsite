import type { HTMLAttributes } from 'react';

// DESIGN_SYSTEM.md §14-15 — page margins and the column grid are combined
// into one primitive rather than two, because every documented use
// (product/collection/homepage layouts) applies both together; nothing in
// DESIGN_SYSTEM.md calls for one without the other.
//
// Column counts (4/8/12) and margins (16/24/32/64px) need no new @theme
// tokens: Tailwind already ships grid-cols-1..12 by default, and the
// margins are plain multiples of the --spacing base unit set in
// app/globals.css's Phase 1 spacing task — 16=px-4, 24=px-6, 32=px-8,
// 64=px-16. This mirrors that task's own precedent: trust Tailwind's
// existing scale once the base unit is set, rather than hand-declaring a
// token per value.
//
// Breakpoints: DESIGN_SYSTEM.md names four tiers (mobile/tablet/desktop/
// large desktop) without pixel values. Mapped onto Tailwind's default
// md/lg/xl (768/1024/1280px) — three breakpoints for four named tiers,
// since "large desktop" only steps up the margin, not the column count.
//
// Gutter: DESIGN_SYSTEM.md §15 documents column counts but never a gutter
// width. 24px is chosen here — already a core spacing value (§13), not an
// arbitrary new number — and stays constant across breakpoints; nothing
// in DESIGN_SYSTEM.md suggests the gutter itself should grow with margin.
//
// No column-span/GridItem helper: DESIGN_SYSTEM.md §15 explicitly expects
// product layouts to "intentionally break the visual grid while still
// being based on it internally" — there's no real consumer yet to know
// what a placement API should look like, so children place themselves
// with Tailwind's own col-span-*/row-span-* utilities against whichever
// column count is active. See DECISIONS.md D-012 for how this component
// is tested without a real page consuming it yet.
export function Grid({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  const classes =
    `grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-6 px-4 md:px-6 lg:px-8 xl:px-16 ${className}`.trim();
  return <div className={classes} {...props} />;
}

// Pure quantity-input resolution for the PDP's Quantity field — no React, no
// DOM. Mirrors lib/product/variants.ts's "no jsdom/RTL in this repo, so real
// behavioral coverage lives here" rationale (vitest.config.ts's environment
// is 'node').

/**
 * Resolves a Quantity <input>'s raw string value to a committed quantity,
 * clamped to a minimum of `min`. Deliberately called only on blur, never on
 * every keystroke (see ProductPurchasePanel.tsx) — clamping synchronously
 * inside onChange snaps a momentarily-empty controlled input back to "1"
 * before the next keystroke lands: clearing the field, then typing "1" then
 * "2" as separate keystrokes, produced "112" (each keystroke appending to
 * the snapped-back "1") instead of "12". Deferring the clamp to blur lets
 * the field hold any transient raw string — including empty — while the
 * user is mid-edit.
 *
 * Preserves the exact clamping semantics of the inline expression this
 * replaces (`Math.max(1, Number(raw) || 1)`): empty/non-numeric/zero/
 * negative all resolve to `min`; a valid number at or above `min` passes
 * through unchanged, including non-integers — quantity was never validated
 * as integer-only before this fix and still isn't; that's a pre-existing,
 * unrelated characteristic, not something this fix changes.
 */
export function resolveQuantity(raw: string, min = 1): number {
  return Math.max(min, Number(raw) || min);
}

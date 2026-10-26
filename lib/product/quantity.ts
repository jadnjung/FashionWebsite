// Pure quantity-input resolution for the PDP's Quantity field — no React, no
// DOM. Mirrors lib/product/variants.ts's "no jsdom/RTL in this repo, so real
// behavioral coverage lives here" rationale (vitest.config.ts's environment
// is 'node').

/**
 * Resolves a Quantity <input>'s raw string value to a committed quantity,
 * clamped to between `min` and `max`. Deliberately called only on blur,
 * never on every keystroke (see ProductPurchasePanel.tsx) — clamping
 * synchronously inside onChange snaps a momentarily-empty controlled input
 * back to "1" before the next keystroke lands: clearing the field, then
 * typing "1" then "2" as separate keystrokes, produced "112" (each
 * keystroke appending to the snapped-back "1") instead of "12". Deferring
 * the clamp to blur lets the field hold any transient raw string —
 * including empty — while the user is mid-edit.
 *
 * Preserves the exact clamping semantics of the inline expression this
 * replaces (`Math.max(1, Number(raw) || 1)`): empty/non-numeric/zero/
 * negative all resolve to `min`; a valid number at or above `min` passes
 * through unchanged.
 *
 * Non-integer input (e.g. "2.5") is floored, not rounded or ceiling'd. A
 * fractional quantity has no honest reading for a physical garment, so the
 * resolved value should never claim a whole unit the customer didn't
 * actually type — rounding "2.5" up to 3 (or always ceiling) would commit
 * to a unit never entered. Flooring also composes with the existing
 * min-clamp for free: "2.5" floors to 2 and passes through (2 >= min),
 * while "0.5" floors to 0 and gets clamped up to `min`, exactly like plain
 * "0" already was — no extra branch needed for the sub-1 case.
 *
 * `max`, when provided, clamps the resolved integer down to not exceed it.
 * It's intended to be a matched variant's real `quantityAvailable`
 * (Shopify inventory — see lib/product/scarcity.ts and DECISIONS.md D-028
 * on never fabricating a count). Omit `max` (or pass `undefined`) for "no
 * known upper bound," which is the correct treatment both before a variant
 * is fully matched and when a matched variant's `quantityAvailable` is
 * `null` (real-world inventory Shopify hasn't told us) — neither case
 * should clamp to 0. If `max` ends up smaller than `min` (a matched
 * variant with, say, 0 `quantityAvailable` while `min` stays at its
 * default of 1), `max` wins: the resolved quantity drops below `min`
 * rather than silently implying units exist that don't. That pairing is
 * already inert in the UI — ProductPurchasePanel's `canAddToBag` disables
 * Add to Bag whenever the matched variant isn't `availableForSale`, so a
 * resolved value under `min` here never reaches an active purchase path.
 */
export function resolveQuantity(raw: string, min = 1, max?: number): number {
  const whole = Math.floor(Number(raw));
  const clamped = Math.max(min, whole || min);
  return max === undefined ? clamped : Math.min(clamped, max);
}

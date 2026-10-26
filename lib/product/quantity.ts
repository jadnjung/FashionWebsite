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
 * It's intended to be a matched variant's real, known-positive
 * `quantityAvailable` (Shopify inventory — see lib/product/scarcity.ts and
 * DECISIONS.md D-028 on never fabricating a count). Omit `max` (or pass
 * `undefined`) for "no known upper bound."
 *
 * This function never returns less than `min`, even if `max` is smaller
 * than `min` — a caller-supplied `max` below `min` is treated as a
 * contradictory range, not as license to resolve to less than the
 * declared minimum purchasable quantity (`Math.max(max, min)` floors the
 * effective ceiling at `min` before applying it). Earlier, `max` was
 * allowed to win outright, on the reasoning that a matched variant with
 * `quantityAvailable <= 0` is already unpurchasable elsewhere in the UI —
 * that reasoning was wrong in general: Shopify's "continue selling when
 * out of stock" setting can leave a variant `availableForSale: true` with
 * `quantityAvailable: 0`, a state this codebase's own
 * `canAddToBag`/`getScarcityStatus` already treat as two independent
 * signals, not one. This function has no way to know, from `max` alone,
 * whether a sub-`min` cap reflects a genuinely blocked purchase or an
 * oversold-but-still-sellable variant, so it no longer guesses — callers
 * decide what a non-positive `quantityAvailable` means for *their* `max`
 * argument (see ProductPurchasePanel.tsx, which now passes `undefined`
 * rather than a non-positive number) rather than this function silently
 * producing a quantity under its own stated minimum.
 */
export function resolveQuantity(raw: string, min = 1, max?: number): number {
  const whole = Math.floor(Number(raw));
  const clamped = Math.max(min, whole || min);
  return max === undefined ? clamped : Math.min(clamped, Math.max(max, min));
}

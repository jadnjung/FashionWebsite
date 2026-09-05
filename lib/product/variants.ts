// Pure variant-selection logic for the PDP's size/color selector — no
// React, no DOM. Mirrors lib/catalog/'s existing pure-logic-plus-thin-
// component split (this project has no jsdom/React Testing Library —
// vitest.config.ts's environment is 'node' — so real behavioral coverage
// lives here, not in a component test). See the design spec's Architecture
// section and DECISIONS.md D-027.

import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

export type OptionSelections = Record<string, string>;

/**
 * PROJECT.md §39: "If only one color exists, the color may already be
 * selected... Size must never be guessed." Auto-fills any option with
 * exactly one possible value, EXCEPT one named "Size" (case-insensitive),
 * which always starts unselected regardless of how many values it has.
 */
export function getInitialSelections(options: ProductOption[]): OptionSelections {
  const selections: OptionSelections = {};
  for (const option of options) {
    if (option.name.toLowerCase() === 'size') continue;
    if (option.values.length === 1) {
      selections[option.name] = option.values[0];
    }
  }
  return selections;
}

/**
 * A variant matches when every one of its own selectedOptions entries
 * equals the corresponding current selection. Naturally returns null for
 * an incomplete selection (an option the product defines but selections
 * hasn't set yet), since selections[name] is undefined and never equals a
 * real value — no separate completeness check is needed for correctness.
 * For a genuinely optionless product (selectedOptions === []), `.every`
 * on an empty array is vacuously true, correctly returning that product's
 * one default variant regardless of (empty) selections.
 */
export function findMatchingVariant(
  variants: ProductVariant[],
  selections: OptionSelections,
): ProductVariant | null {
  return (
    variants.find((variant) =>
      variant.selectedOptions.every((opt) => selections[opt.name] === opt.value),
    ) ?? null
  );
}

/** True iff some available-for-sale variant has this exact (name, value) pair. */
export function isOptionValueAvailable(
  variants: ProductVariant[],
  optionName: string,
  value: string,
): boolean {
  return variants.some(
    (variant) =>
      variant.availableForSale &&
      variant.selectedOptions.some((opt) => opt.name === optionName && opt.value === value),
  );
}

/** True once every option the product defines has a current selection. */
export function isSelectionComplete(
  options: ProductOption[],
  selections: OptionSelections,
): boolean {
  return options.every((option) => selections[option.name] !== undefined);
}

/**
 * True when every variant is unavailable — the product-level SOLD OUT
 * state, independent of which (if any) variant is currently selected.
 * Mirrors ProductCard's own product-level badge condition.
 */
export function isProductSoldOut(variants: ProductVariant[]): boolean {
  return variants.length > 0 && variants.every((variant) => !variant.availableForSale);
}

import { isSelectionComplete, type OptionSelections } from '@/lib/product/variants';
import type { ProductOption } from '@/lib/shopify/products';

export interface LookItemSelectionState {
  included: boolean;
  options: ProductOption[];
  selections: OptionSelections;
}

/**
 * True once at least one item is `included`, and every included item's
 * variant selection is complete. PROJECT.md §29: the system must never add
 * an undefined variant automatically — all required size/color selections
 * must be resolved first. An excluded item's (possibly incomplete)
 * selection never blocks this, since only included items are checked.
 */
export function isLookAddValid(items: LookItemSelectionState[]): boolean {
  const included = items.filter((item) => item.included);
  return (
    included.length > 0 &&
    included.every((item) => isSelectionComplete(item.options, item.selections))
  );
}

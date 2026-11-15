import type { ProductOption, ProductVariant } from '@/lib/shopify/products';
import type { OptionSelections } from './variants';

export function getProductVariantHref(handle: string, variantId: string): string {
  return `/products/${encodeURIComponent(handle)}?${new URLSearchParams({ variant: variantId })}`;
}

/** Only an ID belonging to this product can restore explicit size choices. */
export function getVariantSelections(
  options: ProductOption[],
  variants: ProductVariant[],
  variantId: string | null | undefined,
): OptionSelections | null {
  if (!variantId) return null;
  const variant = variants.find((candidate) => candidate.id === variantId);
  if (
    !variant ||
    !options.every((option) =>
      variant.selectedOptions.some(
        (selection) => selection.name === option.name && option.values.includes(selection.value),
      ),
    )
  )
    return null;
  return Object.fromEntries(variant.selectedOptions.map((option) => [option.name, option.value]));
}

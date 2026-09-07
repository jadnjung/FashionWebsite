import { isOptionValueAvailable, type OptionSelections } from '@/lib/product/variants';
import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

interface VariantPickerProps {
  // Unique per rendered instance (a call-site tag plus the garment's
  // Shopify handle, e.g. `pdp-${handle}`, `preview-${handle}`,
  // `look-${handle}`) — see DECISIONS.md D-036. Native radio-group
  // scoping is by `name` value document-wide (absent a <form> boundary),
  // and this holds even for a radio inside a *closed* native <dialog> —
  // its content remains part of the document regardless of visibility.
  // Two garments that both have a "Size" option (common — T-shirt and
  // pants sizes are both usually named "Size") rendered without distinct
  // prefixes would silently share one radio group: selecting a size for
  // one garment would un-check the other's. The PDP's own single-instance
  // usage never surfaced this because only one VariantPicker was ever
  // mounted there at once.
  namePrefix: string;
  options: ProductOption[];
  variants: ProductVariant[];
  selections: OptionSelections;
  onChange: (optionName: string, value: string) => void;
}

// DECISIONS.md D-027 — native radio groups: sr-only peer input + a sibling
// <label> styled via peer-checked/peer-disabled/peer-focus-visible, giving
// full keyboard support and a real `disabled` state on unavailable values
// for free. Extracted from ProductPurchasePanel (Phase 5, see DECISIONS.md
// D-036) so the Interactive Model's info panel and Shop the Look panel
// (Phase 8) reuse this exact markup instead of a third hand-rolled copy.
export function VariantPicker({
  namePrefix,
  options,
  variants,
  selections,
  onChange,
}: VariantPickerProps) {
  return (
    <>
      {options.map((option) => (
        <fieldset key={option.id} className="flex flex-col gap-3">
          <legend className="text-utility uppercase tracking-metadata text-esque-text-secondary">
            {option.name}
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const available = isOptionValueAvailable(variants, option.name, value);
              const inputId = `option-${namePrefix}-${option.id}-${value}`;
              return (
                <div key={value}>
                  <input
                    type="radio"
                    id={inputId}
                    name={`${namePrefix}-${option.name}`}
                    value={value}
                    checked={selections[option.name] === value}
                    disabled={!available}
                    onChange={() => onChange(option.name, value)}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={inputId}
                    className="block cursor-pointer border border-esque-text-secondary px-4 py-2 text-utility uppercase tracking-metadata text-esque-text transition-colors duration-200 ease-esque peer-checked:border-esque-text peer-checked:bg-esque-text peer-checked:text-esque-black peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-esque-text peer-disabled:cursor-not-allowed peer-disabled:text-esque-text-muted peer-disabled:line-through peer-disabled:opacity-40"
                  >
                    {value}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </>
  );
}

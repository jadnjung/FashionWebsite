'use client';

import { useState } from 'react';

interface FacetOption {
  value: string;
  label: string;
}

interface FacetGroupProps {
  name: string;
  label: string;
  selected: string[];
  options: FacetOption[];
}

interface DraftOption {
  label: string;
  checked: boolean;
}

export function FacetGroup({ name, label, selected, options }: FacetGroupProps) {
  // The parent form's applied-criteria key resets this draft. Option-page
  // navigation retains it, including unchecked rows for focus and reselection.
  const [draftOptions, setDraftOptions] = useState(
    () =>
      new Map<string, DraftOption>(
        selected.map((value) => [
          value,
          {
            label: options.find((option) => option.value === value)?.label ?? value,
            checked: true,
          },
        ]),
      ),
  );
  const displayedOptions = new Map(options.map((option) => [option.value, option]));
  for (const [value, draft] of draftOptions) {
    if (!displayedOptions.has(value)) displayedOptions.set(value, { value, label: draft.label });
  }

  return (
    <details className="col-span-2 min-w-0 self-start md:w-48">
      <summary className="inline-flex min-h-11 cursor-pointer items-center py-2 text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text">
        {label}
        {selected.length ? ` (${selected.length})` : ''}
      </summary>
      <fieldset className="max-h-60 overflow-y-auto border border-esque-surface p-2">
        <legend className="sr-only">{label}</legend>
        {displayedOptions.size ? (
          [...displayedOptions.values()].map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 min-w-0 items-center gap-2 py-2 text-utility text-esque-text [overflow-wrap:anywhere]"
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={draftOptions.get(option.value)?.checked ?? false}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  setDraftOptions((previous) =>
                    new Map(previous).set(option.value, { label: option.label, checked }),
                  );
                }}
                className="h-4 w-4 shrink-0 accent-esque-forest"
              />
              {option.label}
            </label>
          ))
        ) : (
          <p className="py-2 text-utility text-esque-text-secondary">No options available.</p>
        )}
      </fieldset>
    </details>
  );
}

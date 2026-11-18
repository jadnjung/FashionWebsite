'use client';

import { useId, useState } from 'react';
import { FACET_SELECTION_LIMIT } from '@/lib/catalog/filters';

interface FacetOption {
  value: string;
  label: string;
}

interface FacetGroupProps {
  name: string;
  label: string;
  selected: string[];
  options: FacetOption[];
  recovering?: boolean;
}

interface DraftOption {
  label: string;
  checked: boolean;
}

export function FacetGroup({
  name,
  label,
  selected,
  options,
  recovering = false,
}: FacetGroupProps) {
  const guidanceId = useId();
  const statusId = useId();
  const [rejected, setRejected] = useState(false);
  const optionLabels = new Map(options.map((option) => [option.value, option.label]));
  // The parent form's applied-criteria key resets this draft. Option-page
  // navigation retains it, including unchecked rows for focus and reselection.
  const [draftOptions, setDraftOptions] = useState(
    () =>
      new Map<string, DraftOption>(
        selected.map((value) => [
          value,
          {
            label: optionLabels.get(value) ?? value,
            checked: true,
          },
        ]),
      ),
  );
  const displayedOptions = new Map(options.map((option) => [option.value, option]));
  for (const [value, draft] of draftOptions) {
    if (!displayedOptions.has(value)) displayedOptions.set(value, { value, label: draft.label });
  }
  const checkedCount = [...draftOptions.values()].filter((draft) => draft.checked).length;
  const overBudget = checkedCount > FACET_SELECTION_LIMIT;

  return (
    <details open={recovering || undefined} className="col-span-2 min-w-0 self-start md:w-48">
      <summary className="inline-flex min-h-11 cursor-pointer items-center py-2 text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text">
        {label}
        {checkedCount ? ` (${checkedCount})` : ''}
      </summary>
      <p id={guidanceId} className="text-utility text-esque-text-secondary">
        Choose up to {FACET_SELECTION_LIMIT} options.
      </p>
      <p id={statusId} role="status" className="text-utility text-esque-text">
        {overBudget
          ? `${checkedCount} selected. Remove ${checkedCount - FACET_SELECTION_LIMIT} to use at most ${FACET_SELECTION_LIMIT}.`
          : rejected
            ? 'Selection limit reached. Remove an option before choosing another.'
            : null}
      </p>
      <fieldset
        aria-describedby={`${guidanceId}${overBudget || rejected ? ` ${statusId}` : ''}`}
        aria-invalid={overBudget || undefined}
        className="max-h-60 overflow-y-auto border border-esque-surface p-2"
      >
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
                  if (checked && checkedCount >= FACET_SELECTION_LIMIT) {
                    setRejected(true);
                    return;
                  }
                  setRejected(false);
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

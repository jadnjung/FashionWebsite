import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SORT_OPTIONS,
  buildFilterHref,
  type CatalogFilters,
  type CatalogSearchParams,
} from '@/lib/catalog/filters';

interface FilterBarProps {
  pathname: string;
  searchParams: CatalogSearchParams;
  filters: CatalogFilters;
}

// DESIGN_SYSTEM.md §51 — a compact, horizontal filter control above the
// grid. Every control here is a plain Link or a native GET <form> — no
// client component, no onChange/onSubmit handler. This is a deliberate
// architectural choice (see the design spec's Architecture section):
// works with JavaScript disabled, adds zero client-side bundle weight, and
// reuses Button/Input rather than inventing new form primitives.
// DECISIONS.md D-024 defers the mobile bottom-sheet treatment §51 also
// describes until Size/Color/Collection expand the control set enough to
// justify hiding it behind a sheet.
export function FilterBar({ pathname, searchParams, filters }: FilterBarProps) {
  const hasAvailabilityOrPrice =
    filters.available || filters.minPrice !== undefined || filters.maxPrice !== undefined;

  return (
    <div className="flex flex-col gap-6 border-b border-esque-surface pb-6 md:flex-row md:flex-wrap md:items-end md:justify-between">
      <nav aria-label="Sort" className="flex flex-wrap gap-4">
        {SORT_OPTIONS.map((option) => {
          const active = option.value === filters.sort;
          return (
            <Link
              key={option.value}
              href={buildFilterHref(pathname, searchParams, { sort: option.value })}
              aria-current={active ? 'true' : undefined}
              // DESIGN_SYSTEM.md §5 — green indicates selection; a sparing,
              // genuine use of forest here rather than decoration. The
              // focus ring stays --color-esque-text per D-010 regardless.
              className={`text-utility uppercase tracking-metadata transition-colors duration-200 ease-esque focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text ${
                active
                  ? 'text-esque-text underline decoration-esque-forest underline-offset-4'
                  : 'text-esque-text-secondary hover:text-esque-text'
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      <form method="get" action={pathname} className="flex flex-wrap items-end gap-4">
        {/* Preserves the active sort so applying availability/price doesn't reset it. */}
        <input type="hidden" name="sort" value={filters.sort} />
        <label className="flex items-center gap-2 text-utility uppercase tracking-metadata text-esque-text-secondary">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={filters.available}
            // accent-color (not a custom appearance-none control) tints the
            // native checkbox with the brand's forest green — DESIGN_SYSTEM.md
            // §5's sparing selection-state use of green — without building a
            // bespoke widget for a single simple boolean control.
            className="h-4 w-4 accent-esque-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          />
          In Stock Only
        </label>
        <Input
          label="Min Price"
          name="minPrice"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={filters.minPrice ?? ''}
          className="w-24"
        />
        <Input
          label="Max Price"
          name="maxPrice"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={filters.maxPrice ?? ''}
          className="w-24"
        />
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {hasAvailabilityOrPrice && (
          <Link
            href={buildFilterHref(pathname, searchParams, {
              available: undefined,
              minPrice: undefined,
              maxPrice: undefined,
            })}
            className="text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            Clear Filters
          </Link>
        )}
      </form>
    </div>
  );
}

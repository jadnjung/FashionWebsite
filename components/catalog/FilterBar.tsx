import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SORT_OPTIONS,
  buildFilterHref,
  hasActiveFilters,
  type CatalogFilters,
  type CatalogSearchParams,
} from '@/lib/catalog/filters';
import type { CatalogFacets } from '@/lib/catalog/products';

interface FilterBarProps {
  pathname: string;
  searchParams: CatalogSearchParams;
  filters: CatalogFilters;
  facets?: CatalogFacets;
  facetEndCursor?: string | null;
  isFacetContinuation?: boolean;
}

const LINK_CLASS =
  'inline-flex min-h-11 items-center py-2 text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text';

// Apply commits matching changes together and resets the continuation cursor.
export function FilterBar({
  pathname,
  searchParams,
  filters,
  facets,
  facetEndCursor,
  isFacetContinuation,
}: FilterBarProps) {
  const groups = [
    {
      name: 'size',
      label: 'Size',
      selected: filters.sizes ?? [],
      options: [...new Set([...(facets?.sizes ?? []), ...(filters.sizes ?? [])])].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      name: 'color',
      label: 'Color',
      selected: filters.colors ?? [],
      options: [...new Set([...(facets?.colors ?? []), ...(filters.colors ?? [])])].map(
        (value) => ({ value, label: value }),
      ),
    },
    {
      name: 'collection',
      label: 'Collection',
      selected: filters.collections ?? [],
      options: [
        ...new Map(
          [
            ...(filters.collections ?? []).map((handle) => ({ handle, title: handle })),
            ...(facets?.collections ?? []),
          ].map((collection) => [collection.handle, collection]),
        ).values(),
      ].map(({ handle, title }) => ({
        value: handle,
        label: title,
      })),
    },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-esque-surface pb-6">
      <nav aria-label="Sort" className="flex flex-wrap gap-x-4">
        {SORT_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={buildFilterHref(pathname, searchParams, { sort: option.value })}
            aria-current={option.value === filters.sort ? 'true' : undefined}
            className={`${LINK_CLASS} ${option.value === filters.sort ? 'text-esque-text underline decoration-esque-forest underline-offset-4' : ''}`}
          >
            {option.label}
          </Link>
        ))}
      </nav>
      <form
        method="get"
        action={pathname}
        className="grid min-w-0 grid-cols-2 items-end gap-3 md:flex md:flex-wrap md:gap-4"
      >
        <input type="hidden" name="sort" value={filters.sort} />
        {searchParams.optionsAfter && (
          <input
            type="hidden"
            name="optionsAfter"
            value={
              Array.isArray(searchParams.optionsAfter)
                ? searchParams.optionsAfter[0]
                : searchParams.optionsAfter
            }
          />
        )}
        {groups.map((group) => (
          <details key={group.name} className="col-span-2 min-w-0 self-start md:w-48">
            <summary className={`${LINK_CLASS} cursor-pointer`}>
              {group.label}
              {group.selected.length ? ` (${group.selected.length})` : ''}
            </summary>
            <fieldset className="max-h-60 overflow-y-auto border border-esque-surface p-2">
              <legend className="sr-only">{group.label}</legend>
              {group.options.length ? (
                group.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 min-w-0 items-center gap-2 py-2 text-utility text-esque-text [overflow-wrap:anywhere]"
                  >
                    <input
                      type="checkbox"
                      name={group.name}
                      value={option.value}
                      defaultChecked={group.selected.includes(option.value)}
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
        ))}
        <label className="col-span-2 flex min-h-11 items-center gap-2 py-2 text-utility uppercase tracking-metadata text-esque-text-secondary">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={filters.available}
            className="h-4 w-4 accent-esque-forest"
          />
          In Stock Only
        </label>
        <Input
          label="Min Price"
          name="minPrice"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          defaultValue={filters.minPrice ?? ''}
          className="w-full md:w-24"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <Input
            label="Max Price"
            name="maxPrice"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            defaultValue={filters.maxPrice ?? ''}
            className="w-full md:w-24"
            aria-describedby={filters.maxPriceDropped ? 'max-price-dropped-note' : undefined}
          />
          {filters.maxPriceDropped && (
            <p id="max-price-dropped-note" className="text-utility text-esque-text-secondary">
              Max price below min — ignored.
            </p>
          )}
        </div>
        <Button type="submit" variant="secondary" className="col-span-2">
          APPLY
        </Button>
        {hasActiveFilters(filters, 'featured') && (
          <Link
            href={buildFilterHref(pathname, searchParams, {
              available: undefined,
              minPrice: undefined,
              maxPrice: undefined,
              size: undefined,
              color: undefined,
              collection: undefined,
            })}
            className={`${LINK_CLASS} col-span-2`}
          >
            Clear Filters
          </Link>
        )}
      </form>
      <nav
        aria-label="Filter option pages"
        className="flex flex-wrap items-center gap-x-4 text-utility text-esque-text-secondary"
      >
        <p>Filter options from this catalog section.</p>
        {isFacetContinuation && (
          <Link
            href={buildFilterHref(pathname, searchParams, {
              optionsAfter: undefined,
              after: Array.isArray(searchParams.after) ? searchParams.after[0] : searchParams.after,
            })}
            className={LINK_CLASS}
          >
            First filter options
          </Link>
        )}
        {facetEndCursor && (
          <Link
            href={buildFilterHref(pathname, searchParams, {
              optionsAfter: facetEndCursor,
              after: Array.isArray(searchParams.after) ? searchParams.after[0] : searchParams.after,
            })}
            className={LINK_CLASS}
          >
            More filter options
          </Link>
        )}
      </nav>
      <ul aria-label="Active filters" className="flex min-w-0 flex-wrap gap-x-4">
        {groups.flatMap((group) =>
          group.selected.map((value) => (
            <li key={`${group.name}-${value}`} className="min-w-0">
              <Link
                href={buildFilterHref(pathname, searchParams, {
                  [group.name]: group.selected.filter((entry) => entry !== value),
                })}
                className={`${LINK_CLASS} [overflow-wrap:anywhere]`}
                aria-label={`Remove ${group.label.toLowerCase()} ${value}`}
              >
                {group.label}{' '}
                {group.options.find((option) => option.value === value)?.label ?? value} ×
              </Link>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

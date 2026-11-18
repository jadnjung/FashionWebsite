import Link from 'next/link';
import { FacetGroup } from '@/components/catalog/FacetGroup';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SORT_OPTIONS,
  buildFilterHref,
  hasActiveFilters,
  type CatalogFilters,
  type CatalogFacetSelections,
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
  recoverySelections?: CatalogFacetSelections;
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
  recoverySelections,
}: FilterBarProps) {
  const selections = recoverySelections ?? {
    sizes: filters.sizes ?? [],
    colors: filters.colors ?? [],
    collections: filters.collections ?? [],
  };
  const groups = [
    {
      name: 'size',
      label: 'Size',
      selected: selections.sizes,
      options: [...new Set([...(facets?.sizes ?? []), ...selections.sizes])].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      name: 'color',
      label: 'Color',
      selected: selections.colors,
      options: [...new Set([...(facets?.colors ?? []), ...selections.colors])].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      name: 'collection',
      label: 'Collection',
      selected: selections.collections,
      options: [
        ...new Map(
          [
            ...selections.collections.map((handle) => ({ handle, title: handle })),
            ...(facets?.collections ?? []),
          ].map((collection) => [collection.handle, collection]),
        ).values(),
      ].map(({ handle, title }) => ({
        value: handle,
        label: title,
      })),
    },
  ];
  // Applied criteria replace native draft values on navigation. Cursor-only
  // navigation keeps the current draft while revealing more filter options.
  const formKey = JSON.stringify([
    pathname,
    filters.sort,
    filters.available,
    filters.minPrice ?? null,
    filters.maxPrice ?? null,
    ...groups.map((group) => [...group.selected].sort()),
  ]);
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
        key={formKey}
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
          <FacetGroup key={group.name} {...group} recovering={Boolean(recoverySelections)} />
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
        {(recoverySelections || hasActiveFilters(filters, 'featured')) && (
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
      {!recoverySelections && (
        <nav
          aria-label="Filter option pages"
          className="flex flex-wrap items-center gap-x-4 text-utility text-esque-text-secondary"
        >
          <p>Filter options from this catalog section.</p>
          <noscript>
            <p>Apply your choices before opening another filter-option page.</p>
          </noscript>
          {isFacetContinuation && (
            <Link
              href={buildFilterHref(pathname, searchParams, {
                optionsAfter: undefined,
                after: Array.isArray(searchParams.after)
                  ? searchParams.after[0]
                  : searchParams.after,
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
                after: Array.isArray(searchParams.after)
                  ? searchParams.after[0]
                  : searchParams.after,
              })}
              className={LINK_CLASS}
            >
              More filter options
            </Link>
          )}
        </nav>
      )}
      {!recoverySelections && (
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
      )}
    </div>
  );
}

# Interactive Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ROADMAP.md Phase 8 (Interactive Model) — Stages 1-3 (silhouette hotspots, a live product info panel, unified hover/focus/tap activation) and Shop the Look + multi-item add, all built for real against a hand-authored placeholder illustration. Stage 4 (masked luminance motion) and Stage 5 (visual refinement) are deferred — see the spec's Non-Goals.

**Architecture:** A new top-level domain, `components/interactive-model/` + `lib/interactive-model/` (parallel to the existing `catalog/`/`product/`/`home/` pairing, per ARCHITECTURE.md §3's own already-sketched target). `lib/interactive-model/look.ts` resolves one real Shopify product per hotspot region (reusing the existing product-type query mechanism, D-023) and isolates failure exactly like `lib/home/selected-pieces.ts` (D-033). `lib/interactive-model/look-selection.ts` holds the one pure, spec-critical interaction rule (Shop the Look's add-validity gating). Two small, behavior-preserving extractions from the existing `ProductPurchasePanel` (`VariantPicker`, `formatPrice`) give this feature and the PDP one shared implementation instead of a third hand-rolled copy. `InteractiveModel.tsx` (Server Component) decides real-vs-placeholder; `InteractiveModelExperience.tsx` (`'use client'`) owns all interactive state.

**Tech Stack:** No new dependencies. Reuses `next/link`, the existing Shopify client (`getProduct`/`getProducts`), `lib/catalog/taxonomy.ts`/`lib/catalog/filters.ts`, `lib/product/variants.ts`/`lib/product/scarcity.ts`, and plain Tailwind CSS transitions (no `motion/react` — Stage 4's motion is explicitly deferred, so nothing here needs an animation library).

**Spec:** `docs/superpowers/specs/2026-09-06-interactive-model-design.md` — read it in full before starting; this plan assumes its Architecture/Non-Goals/New-Decisions sections as given and doesn't re-justify them.

## Global Constraints

- TypeScript strict mode stays on; no `@ts-ignore`/`@ts-nocheck`/`any`.
- pnpm only.
- No jsdom/React Testing Library — `vitest.config.ts` only collects `**/*.test.ts` (not `.tsx`). Real logic (`look.ts`, `look-selection.ts`, `price.ts`) is unit-tested directly; every React component stays a thin, untested-at-the-unit-level layer verified by typecheck/build plus E2E, matching every prior phase's precedent.
- Two hotspot regions only (`top`, `bottom`) — Collection 001's real catalog has no Etc./Jewelry product to bind a third region to.
- No new client-side dependency. No `motion/react` usage anywhere in this feature (Stage 4 is deferred).
- Every simultaneously-mountable `VariantPicker` instance must receive a unique `namePrefix` (call-site tag + product handle) — native radio `name`/`id` scoping is document-wide regardless of a `<dialog>`'s open/closed state, so this is a correctness requirement, not a style preference. See Task 1 and Task 5.
- Do not modify `lib/shopify/*`, `lib/catalog/*`, `components/catalog/*`, or any access-gate/catalog-page file. This pass touches `components/product/ProductPurchasePanel.tsx` and `components/product/ProductDetail.tsx` (Task 1 only), adds `lib/product/price.ts` and `components/product/VariantPicker.tsx`, adds `components/interactive-model/` and `lib/interactive-model/`, relocates `components/home/InteractiveModelPlaceholder.tsx`, and rewrites `app/(storefront)/page.tsx` and `tests/e2e/homepage.spec.ts`.
- Do not modify `CLAUDE.md` under any circumstance.
- After **every** task: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm build` — fix any failure the task caused before moving on, then commit.
- Record DECISIONS.md D-034/D-035/D-036 and update ROADMAP.md Phase 7's Scene 02 line and Phase 8 exactly as specified in Task 9 — not deferred past it.
- Commit trailer on every commit: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Push to `main` after every commit.

---

### Task 1: Extract shared PDP internals — `formatPrice` and `VariantPicker`

**Files:**
- Create: `lib/product/price.ts`
- Create: `lib/product/price.test.ts`
- Create: `components/product/VariantPicker.tsx`
- Modify: `components/product/ProductPurchasePanel.tsx`
- Modify: `components/product/ProductDetail.tsx`

**Interfaces:**
- Produces: `formatPrice(price: { amount: string; currencyCode: string }): string` from `lib/product/price.ts`. `VariantPicker` component from `components/product/VariantPicker.tsx`, props `{ namePrefix: string; options: ProductOption[]; variants: ProductVariant[]; selections: OptionSelections; onChange: (optionName: string, value: string) => void }`. Both consumed by Tasks 5 and 6.

This task is a pure, behavior-preserving refactor of an already-shipped Phase 5 file — scoped as its own commit specifically so it's reviewable in isolation from the new Phase 8 feature code it exists to serve (DECISIONS.md D-036). `price.ts` gets real TDD (it's genuinely testable); `VariantPicker`/the `ProductPurchasePanel`/`ProductDetail` changes don't get a dedicated unit test (no jsdom/RTL — same precedent as every other component in this codebase), so their correctness is verified by typecheck/build plus the existing `pdp.spec.ts` E2E coverage continuing to pass unchanged in Step 8 below.

- [ ] **Step 1: Write the failing test for `formatPrice`**

Create `lib/product/price.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { formatPrice } from '@/lib/product/price';

describe('formatPrice', () => {
  test('formats a whole-dollar amount as a localized USD string', () => {
    expect(formatPrice({ amount: '180.00', currencyCode: 'USD' })).toBe('$180.00');
  });

  test('formats a fractional amount to two decimal places', () => {
    expect(formatPrice({ amount: '19.5', currencyCode: 'USD' })).toBe('$19.50');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/product/price.ts` doesn't exist yet.

- [ ] **Step 3: Implement `lib/product/price.ts`**

```typescript
/**
 * Formats a Shopify Money-shaped value ({amount, currencyCode}) as a
 * localized currency string, e.g. {amount: '180.00', currencyCode: 'USD'}
 * -> '$180.00'. Extracted from ProductPurchasePanel (Phase 5) so the
 * Interactive Model's info panel and Shop the Look panel (Phase 8) reuse
 * the exact same logic instead of a second/third copy.
 */
export function formatPrice(price: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode,
  }).format(Number(price.amount));
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Implement `components/product/VariantPicker.tsx`**

```tsx
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
```

- [ ] **Step 6: Refactor `ProductPurchasePanel.tsx` to use both**

Replace `components/product/ProductPurchasePanel.tsx` in full:

```tsx
'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SizeGuidePanel } from '@/components/product/SizeGuidePanel';
import { VariantPicker } from '@/components/product/VariantPicker';
import { formatPrice } from '@/lib/product/price';
import { getScarcityLabel, getScarcityStatus } from '@/lib/product/scarcity';
import {
  findMatchingVariant,
  getInitialSelections,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';
import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

interface ProductPurchasePanelProps {
  title: string;
  // Used only to build VariantPicker's namePrefix (`pdp-${handle}`) — see
  // DECISIONS.md D-036. Not rendered.
  handle: string;
  minPrice: { amount: string; currencyCode: string };
  options: ProductOption[];
  variants: ProductVariant[];
  // Server-rendered, static description — passed as children (composition,
  // not a string prop) so it stays zero-JS even though it renders inside
  // this client boundary. See the design spec's Component breakdown.
  children?: ReactNode;
}

// DESIGN_SYSTEM.md §42-45 — the sticky right column: name, price (reflects
// the matched variant once fully selected, otherwise the product's
// minPrice), scarcity, size/color selection, quantity, Add to Bag. See
// DECISIONS.md D-027 (native radio groups, now shared via VariantPicker —
// D-036) and D-029 (Add to Bag is a real, disabled-until-valid button
// whose click handler is a deliberate no-op — no cart exists yet —
// matching Header.tsx's existing SEARCH/ACCOUNT/BAG onClick={() => {}}
// precedent, not a new pattern).
export function ProductPurchasePanel({
  title,
  handle,
  minPrice,
  options,
  variants,
  children,
}: ProductPurchasePanelProps) {
  const [selections, setSelections] = useState<OptionSelections>(() =>
    getInitialSelections(options),
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const soldOut = isProductSoldOut(variants);
  const matchedVariant = findMatchingVariant(variants, selections);
  const selectionComplete = isSelectionComplete(options, selections);
  const displayPrice = matchedVariant?.price ?? minPrice;
  const scarcityLabel = matchedVariant
    ? getScarcityLabel(
        getScarcityStatus(matchedVariant.quantityAvailable, matchedVariant.availableForSale),
      )
    : null;
  const canAddToBag = !soldOut && matchedVariant !== null && matchedVariant.availableForSale;

  function handleOptionChange(optionName: string, value: string) {
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  }

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-[88px] lg:self-start">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-heading-1 uppercase tracking-display text-esque-text">
          {title}
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-body text-esque-text">{formatPrice(displayPrice)}</p>
          {soldOut && (
            <span className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              SOLD OUT
            </span>
          )}
          {!soldOut && scarcityLabel && (
            <span className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              {scarcityLabel}
            </span>
          )}
        </div>
      </div>

      {children}

      {!soldOut && (
        <VariantPicker
          namePrefix={`pdp-${handle}`}
          options={options}
          variants={variants}
          selections={selections}
          onChange={handleOptionChange}
        />
      )}

      {!soldOut && options.length > 0 && (
        <button
          type="button"
          onClick={() => setSizeGuideOpen(true)}
          className="w-fit text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          Size Guide
        </button>
      )}

      {!soldOut && (
        <Input
          label="Quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          className="w-24"
        />
      )}

      {soldOut ? (
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          NO LONGER AVAILABLE.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* No cart exists yet (DECISIONS.md D-016/D-029). disabled is
              fully real; onClick is a deliberate no-op, matching
              Header.tsx's existing SEARCH/ACCOUNT/BAG precedent. */}
          <Button type="button" variant="primary" disabled={!canAddToBag} onClick={() => {}}>
            ADD TO BAG
          </Button>
          {!selectionComplete && (
            <p className="text-utility text-esque-text-secondary">
              Select all options to continue.
            </p>
          )}
        </div>
      )}

      <SizeGuidePanel open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 7: Update `ProductDetail.tsx` to pass the new `handle` prop**

In `components/product/ProductDetail.tsx`, find:

```tsx
          <ProductPurchasePanel
            title={product.title}
            minPrice={product.minPrice}
            options={product.options}
            variants={product.variants}
          >
```

Replace with:

```tsx
          <ProductPurchasePanel
            title={product.title}
            handle={product.handle}
            minPrice={product.minPrice}
            options={product.options}
            variants={product.variants}
          >
```

- [ ] **Step 8: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

`tests/e2e/pdp.spec.ts`'s existing test must still pass unchanged — this is the regression proof that the refactor didn't alter the PDP's behavior.

```bash
git add lib/product/price.ts lib/product/price.test.ts components/product/VariantPicker.tsx components/product/ProductPurchasePanel.tsx components/product/ProductDetail.tsx
git commit -m "Extract VariantPicker and formatPrice from ProductPurchasePanel for reuse"
git push
```

---

### Task 2: Interactive Model data resolution (`lib/interactive-model/look.ts`)

**Files:**
- Create: `lib/interactive-model/look.ts`
- Create: `lib/interactive-model/look.test.ts`

**Interfaces:**
- Consumes: `getProduct`, `getProducts`, `ProductDetail` from `lib/shopify/products.ts` (existing); `buildProductSearchQuery` from `lib/catalog/filters.ts` (existing); `getCategoryProductTypes`, `CategorySlug` from `lib/catalog/taxonomy.ts` (existing).
- Produces: `HotspotRegion` (`'top' | 'bottom'`), `InteractiveModelGarment` (`{ region: HotspotRegion; regionLabel: string; product: ProductDetail }`), `HOTSPOT_REGIONS`, `getInteractiveModelLook(): Promise<InteractiveModelGarment[]>` — all exported. Tasks 4, 5, 6, 7, 8 depend on these exact names and shapes.

- [ ] **Step 1: Write the failing tests**

Create `lib/interactive-model/look.test.ts`:

```typescript
import { describe, expect, test, vi } from 'vitest';
import { getInteractiveModelLook } from '@/lib/interactive-model/look';
import * as productsModule from '@/lib/shopify/products';

const TOP_SUMMARY = {
  id: 'gid://shopify/Product/1',
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  productType: 'Hoodies',
  tags: [],
  availableForSale: true,
  minPrice: { amount: '180.00', currencyCode: 'USD' },
  images: [],
};

const BOTTOM_SUMMARY = {
  id: 'gid://shopify/Product/2',
  handle: 'pants-01',
  title: 'Pants 01',
  productType: 'Trousers',
  tags: [],
  availableForSale: true,
  minPrice: { amount: '160.00', currencyCode: 'USD' },
  images: [],
};

function detailFor(summary: typeof TOP_SUMMARY) {
  return {
    id: summary.id,
    handle: summary.handle,
    title: summary.title,
    description: 'A real description.',
    productType: summary.productType,
    tags: [],
    minPrice: summary.minPrice,
    images: [],
    options: [{ id: 'opt1', name: 'Size', values: ['S', 'M', 'L'] }],
    variants: [
      {
        id: 'v1',
        title: 'S',
        availableForSale: true,
        quantityAvailable: 5,
        price: summary.minPrice,
        selectedOptions: [{ name: 'Size', value: 'S' }],
      },
    ],
  };
}

describe('getInteractiveModelLook', () => {
  test('resolves one garment per hotspot region when every region has a product', async () => {
    vi.spyOn(productsModule, 'getProducts')
      .mockResolvedValueOnce({ products: [TOP_SUMMARY], hasNextPage: false, endCursor: null })
      .mockResolvedValueOnce({ products: [BOTTOM_SUMMARY], hasNextPage: false, endCursor: null });
    vi.spyOn(productsModule, 'getProduct').mockImplementation(async (handle: string) =>
      handle === TOP_SUMMARY.handle ? detailFor(TOP_SUMMARY) : detailFor(BOTTOM_SUMMARY),
    );

    const result = await getInteractiveModelLook();

    expect(result).toEqual([
      { region: 'top', regionLabel: 'Top', product: detailFor(TOP_SUMMARY) },
      { region: 'bottom', regionLabel: 'Bottom', product: detailFor(BOTTOM_SUMMARY) },
    ]);
  });

  test('queries each region by its own category product types', async () => {
    const getProducts = vi
      .spyOn(productsModule, 'getProducts')
      .mockResolvedValue({ products: [], hasNextPage: false, endCursor: null });

    await getInteractiveModelLook();

    // HOTSPOT_REGIONS.map(resolveRegion) invokes getProducts synchronously
    // in array order (top, then bottom) before either promise resolves —
    // call order here reflects that construction order, not timing.
    expect(getProducts).toHaveBeenCalledTimes(2);
    expect(getProducts).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ query: expect.stringContaining('Hoodies') }),
    );
    expect(getProducts).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ query: expect.stringContaining('Trousers') }),
    );
  });

  test('omits a region whose query returns no product, without erroring', async () => {
    vi.spyOn(productsModule, 'getProducts')
      .mockResolvedValueOnce({ products: [], hasNextPage: false, endCursor: null })
      .mockResolvedValueOnce({ products: [BOTTOM_SUMMARY], hasNextPage: false, endCursor: null });
    vi.spyOn(productsModule, 'getProduct').mockResolvedValue(detailFor(BOTTOM_SUMMARY));

    const result = await getInteractiveModelLook();

    expect(result).toEqual([
      { region: 'bottom', regionLabel: 'Bottom', product: detailFor(BOTTOM_SUMMARY) },
    ]);
  });

  test('resolves to an empty list, not a throw, when a Shopify call rejects', async () => {
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(
      new Error('Shopify Storefront API is not configured.'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getInteractiveModelLook()).resolves.toEqual([]);
  });

  test('logs the failure so it stays operationally visible', async () => {
    const error = new Error('Throttled by Shopify');
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await getInteractiveModelLook();

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Look'), error);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/interactive-model/look.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/interactive-model/look.ts`:

```typescript
import { buildProductSearchQuery } from '@/lib/catalog/filters';
import { getCategoryProductTypes, type CategorySlug } from '@/lib/catalog/taxonomy';
import { getProduct, getProducts, type ProductDetail } from '@/lib/shopify/products';

export type HotspotRegion = 'top' | 'bottom';

export interface InteractiveModelGarment {
  region: HotspotRegion;
  regionLabel: string;
  product: ProductDetail;
}

interface RegionConfig {
  region: HotspotRegion;
  regionLabel: string;
  category: CategorySlug;
}

// DECISIONS.md D-034 — each hotspot region binds to one representative
// real product of its garment category (the same product-type query
// mechanism category pages already use, D-023), not a curated per-photo
// "look." Exactly two regions for Collection 001's real catalog (Tops,
// Bottoms) — see the design spec's Non-Goals for why not a third "Etc."
// region; adding one later is one more entry here.
export const HOTSPOT_REGIONS: readonly RegionConfig[] = [
  { region: 'top', regionLabel: 'Top', category: 'tops' },
  { region: 'bottom', regionLabel: 'Bottom', category: 'bottoms' },
];

async function resolveRegion(config: RegionConfig): Promise<InteractiveModelGarment | null> {
  const productTypes = getCategoryProductTypes(config.category);
  const { products } = await getProducts({
    query: buildProductSearchQuery({ productTypes }),
    first: 1,
  });
  const summary = products[0];
  if (!summary) return null;

  const product = await getProduct(summary.handle);
  if (!product) return null;

  return { region: config.region, regionLabel: config.regionLabel, product };
}

/**
 * Resolves the Interactive Model's current "look": one real product per
 * hotspot region. Regions are resolved concurrently (independent queries —
 * no reason to serialize them). Isolates this feature's Shopify dependency
 * exactly like getSelectedPieces (DECISIONS.md D-033): a thrown error
 * (unconfigured store, throttled request, a malformed query) is logged and
 * resolved to an empty list rather than propagating. A region with no
 * matching product is simply omitted, not an error — the caller
 * (InteractiveModel) falls back to the existing static placeholder unless
 * every configured region resolved (see DECISIONS.md D-034).
 */
export async function getInteractiveModelLook(): Promise<InteractiveModelGarment[]> {
  try {
    const resolved = await Promise.all(HOTSPOT_REGIONS.map(resolveRegion));
    return resolved.filter((garment): garment is InteractiveModelGarment => garment !== null);
  } catch (error) {
    console.error(
      '[interactive-model] Look: Shopify fetch failed, falling back to the placeholder.',
      error,
    );
    return [];
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/interactive-model/look.ts lib/interactive-model/look.test.ts
git commit -m "Add Shopify-backed look resolution for the Interactive Model"
git push
```

---

### Task 3: Shop the Look validity logic (`lib/interactive-model/look-selection.ts`)

**Files:**
- Create: `lib/interactive-model/look-selection.ts`
- Create: `lib/interactive-model/look-selection.test.ts`

**Interfaces:**
- Consumes: `isSelectionComplete`, `OptionSelections` from `lib/product/variants.ts` (existing); `ProductOption` from `lib/shopify/products.ts` (existing).
- Produces: `LookItemSelectionState` (`{ included: boolean; options: ProductOption[]; selections: OptionSelections }`), `isLookAddValid(items: LookItemSelectionState[]): boolean` — exported. Task 5 (`ShopTheLookPanel`) depends on both.

- [ ] **Step 1: Write the failing tests**

Create `lib/interactive-model/look-selection.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import {
  isLookAddValid,
  type LookItemSelectionState,
} from '@/lib/interactive-model/look-selection';
import type { ProductOption } from '@/lib/shopify/products';

const SIZE_OPTION: ProductOption[] = [{ id: 'opt1', name: 'Size', values: ['S', 'M', 'L'] }];

function item(overrides: Partial<LookItemSelectionState> = {}): LookItemSelectionState {
  return { included: true, options: SIZE_OPTION, selections: { Size: 'M' }, ...overrides };
}

describe('isLookAddValid', () => {
  test('false when no item is included', () => {
    expect(isLookAddValid([item({ included: false }), item({ included: false })])).toBe(false);
  });

  test('true when every included item has a complete selection', () => {
    expect(isLookAddValid([item(), item()])).toBe(true);
  });

  test('false when an included item has an incomplete selection', () => {
    expect(isLookAddValid([item(), item({ selections: {} })])).toBe(false);
  });

  test('excluding an incomplete item makes the remaining selection valid again', () => {
    expect(isLookAddValid([item(), item({ included: false, selections: {} })])).toBe(true);
  });

  test('false for an empty item list', () => {
    expect(isLookAddValid([])).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/interactive-model/look-selection.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/interactive-model/look-selection.ts`:

```typescript
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/interactive-model/look-selection.ts lib/interactive-model/look-selection.test.ts
git commit -m "Add Shop the Look multi-item add-validity logic"
git push
```

---

### Task 4: `SilhouetteIllustration` component

**Files:**
- Create: `components/interactive-model/SilhouetteIllustration.tsx`

**Interfaces:**
- Consumes: `HotspotRegion`, `InteractiveModelGarment` from `lib/interactive-model/look.ts` (Task 2).
- Produces: `SilhouetteIllustration` component, props `{ garments: InteractiveModelGarment[]; activeRegion: HotspotRegion | null; onHover: (region: HotspotRegion) => void; onToggle: (region: HotspotRegion) => void }` — exported. Task 6 depends on this.

No dedicated test file — matches every presentational component's established precedent (no jsdom/RTL; coverage from `pnpm typecheck`/`pnpm build` plus Task 8's E2E).

- [ ] **Step 1: Implement**

Create `components/interactive-model/SilhouetteIllustration.tsx`:

```tsx
import type { CSSProperties } from 'react';
import type { HotspotRegion, InteractiveModelGarment } from '@/lib/interactive-model/look';

interface RegionShape {
  box: { top: string; left: string; width: string; height: string };
  clipPath: string;
}

// Hand-authored abstract placeholder shapes (straight-line polygons only)
// standing in for real campaign photography — DESIGN_SYSTEM.md §65's
// placeholder-labeling convention, §30's "approximately follow garment
// silhouettes... not rectangular" requirement. Both `box` (the button's own
// position/size) and `clipPath` (the visible/hit-testable shape within that
// box) are percentages, so the shapes stay pixel-aligned with the
// illustration's own responsive size at every viewport — see DECISIONS.md
// D-035 for why this is a real <button> + percentage clip-path rather than
// an SVG <path> or a px-based clip-path.
const REGION_SHAPES: Record<HotspotRegion, RegionShape> = {
  top: {
    box: { top: '12%', left: '20%', width: '60%', height: '46%' },
    clipPath: 'polygon(20% 0%, 80% 0%, 100% 15%, 85% 20%, 85% 100%, 15% 100%, 15% 20%, 0% 15%)',
  },
  bottom: {
    box: { top: '62%', left: '21.25%', width: '57.5%', height: '34%' },
    clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 65% 100%, 60% 35%, 40% 35%, 35% 100%, 5% 100%)',
  },
};

interface SilhouetteIllustrationProps {
  garments: InteractiveModelGarment[];
  activeRegion: HotspotRegion | null;
  onHover: (region: HotspotRegion) => void;
  onToggle: (region: HotspotRegion) => void;
}

// DESIGN_SYSTEM.md §29-30 — the model illustration and its silhouette-
// shaped hotspots. Each hotspot is a real <button> (native keyboard
// support — DECISIONS.md D-027's "prefer native semantics" precedent, no
// hand-rolled role/keydown wiring) clipped to its garment's shape via
// `clip-path: polygon()` in percentage units, so the visible shape and the
// actual clickable/hoverable hit-region are exactly the same non-
// rectangular area at every viewport width — clip-path constrains
// pointer-event hit-testing, not just paint, in every evergreen browser.
// See DECISIONS.md D-035 for the full reasoning (why not SVG-path-as-
// button, why not an ARIA tablist, why click toggles rather than
// navigates).
export function SilhouetteIllustration({
  garments,
  activeRegion,
  onHover,
  onToggle,
}: SilhouetteIllustrationProps) {
  return (
    <div className="relative aspect-[4/5] w-full bg-esque-elevated">
      <p className="pointer-events-none absolute bottom-2 right-2 text-utility uppercase tracking-metadata text-esque-text-muted">
        ESQUE PLACEHOLDER — MODEL, FULL BODY
      </p>
      {garments.map((garment) => {
        const shape = REGION_SHAPES[garment.region];
        const isActive = activeRegion === garment.region;
        const isDimmed = activeRegion !== null && !isActive;
        const style: CSSProperties = {
          top: shape.box.top,
          left: shape.box.left,
          width: shape.box.width,
          height: shape.box.height,
          clipPath: shape.clipPath,
        };
        return (
          <button
            key={garment.region}
            type="button"
            style={style}
            aria-label={`${garment.regionLabel} — ${garment.product.title}`}
            aria-pressed={isActive}
            onMouseEnter={() => onHover(garment.region)}
            onFocus={() => onHover(garment.region)}
            onClick={() => onToggle(garment.region)}
            className={`absolute border-0 p-0 transition-colors duration-200 ease-esque focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text ${
              isActive
                ? 'bg-esque-forest-highlight'
                : isDimmed
                  ? 'bg-esque-text-muted/25'
                  : 'bg-esque-text-muted/60'
            }`}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/interactive-model/SilhouetteIllustration.tsx
git commit -m "Add SilhouetteIllustration component (Stage 1 hotspots)"
git push
```

---

### Task 5: `ShopTheLookPanel` component

**Files:**
- Create: `components/interactive-model/ShopTheLookPanel.tsx`

**Interfaces:**
- Consumes: `InteractiveModelGarment` from `lib/interactive-model/look.ts` (Task 2); `isLookAddValid`, `LookItemSelectionState` from `lib/interactive-model/look-selection.ts` (Task 3); `VariantPicker` from `components/product/VariantPicker.tsx` (Task 1); `formatPrice` from `lib/product/price.ts` (Task 1); `getInitialSelections`, `findMatchingVariant` from `lib/product/variants.ts` (existing); `Button` from `components/ui/Button.tsx` (existing).
- Produces: `ShopTheLookPanel` component, props `{ garments: InteractiveModelGarment[]; open: boolean; onClose: () => void }` — exported. Task 6 depends on this.

No dedicated test file (same precedent as Task 4) — the one piece of real logic it uses (`isLookAddValid`) is already fully unit-tested in Task 3.

- [ ] **Step 1: Implement**

Create `components/interactive-model/ShopTheLookPanel.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VariantPicker } from '@/components/product/VariantPicker';
import type { InteractiveModelGarment } from '@/lib/interactive-model/look';
import { isLookAddValid, type LookItemSelectionState } from '@/lib/interactive-model/look-selection';
import { formatPrice } from '@/lib/product/price';
import { findMatchingVariant, getInitialSelections } from '@/lib/product/variants';

interface ShopTheLookPanelProps {
  garments: InteractiveModelGarment[];
  open: boolean;
  onClose: () => void;
}

type LookSelectionMap = Record<string, LookItemSelectionState>;

function initialSelectionMap(garments: InteractiveModelGarment[]): LookSelectionMap {
  return Object.fromEntries(
    garments.map((garment) => [
      garment.region,
      {
        included: true,
        options: garment.product.options,
        selections: getInitialSelections(garment.product.options),
      },
    ]),
  );
}

// DESIGN_SYSTEM.md §31 — "Shop the Look": a floating/side panel listing
// every garment currently on the illustration, each with its own variant
// controls, gated by one final ADD LOOK action. Implemented as a native
// <dialog> — the exact mechanism SizeGuidePanel already established
// (DECISIONS.md D-027): showModal()/close() via a ref + effect, side panel
// at md+ / bottom sheet below it, focus-trap/Escape/backdrop all native, no
// hand-rolled dialog code needed. PROJECT.md §29: "select individual
// pieces... add selected pieces... add the complete outfit" is
// implemented as one mechanism, not two separate flows — a per-item
// checkbox (checked by default = included in the outfit) that the user can
// uncheck to exclude a piece; ADD LOOK adds whichever pieces are currently
// checked. No cart exists yet (DECISIONS.md D-016), so ADD LOOK is a real,
// correctly-disabled-gated button whose onClick is a deliberate no-op,
// matching D-029's established precedent exactly.
export function ShopTheLookPanel({ garments, open, onClose }: ShopTheLookPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectionMap, setSelectionMap] = useState<LookSelectionMap>(() =>
    initialSelectionMap(garments),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleToggleIncluded(region: string) {
    setSelectionMap((prev) => ({
      ...prev,
      [region]: { ...prev[region], included: !prev[region].included },
    }));
  }

  function handleOptionChange(region: string, optionName: string, value: string) {
    setSelectionMap((prev) => ({
      ...prev,
      [region]: {
        ...prev[region],
        selections: { ...prev[region].selections, [optionName]: value },
      },
    }));
  }

  const canAddLook = isLookAddValid(garments.map((garment) => selectionMap[garment.region]));

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Shop the Look"
      className="fixed inset-x-0 bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-full md:w-full md:max-w-md"
    >
      <div className="flex items-center justify-between pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">Shop the Look</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {garments.map((garment, index) => {
          const item = selectionMap[garment.region];
          const matchedVariant = findMatchingVariant(garment.product.variants, item.selections);
          const displayPrice = matchedVariant?.price ?? garment.product.minPrice;
          return (
            <div
              key={garment.region}
              className="flex flex-col gap-3 border-b border-esque-elevated pb-6"
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={() => handleToggleIncluded(garment.region)}
                  className="mt-1 h-4 w-4 accent-esque-forest"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
                    {String(index + 1).padStart(2, '0')} — {garment.regionLabel}
                  </p>
                  <p className="text-product-name text-esque-text">{garment.product.title}</p>
                  <p className="text-body text-esque-text-secondary">{formatPrice(displayPrice)}</p>
                </div>
              </label>
              {item.included && (
                <VariantPicker
                  namePrefix={`look-${garment.product.handle}`}
                  options={garment.product.options}
                  variants={garment.product.variants}
                  selections={item.selections}
                  onChange={(optionName, value) =>
                    handleOptionChange(garment.region, optionName, value)
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-6">
        <Button type="button" variant="primary" disabled={!canAddLook} onClick={() => {}}>
          ADD LOOK
        </Button>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/interactive-model/ShopTheLookPanel.tsx
git commit -m "Add ShopTheLookPanel component (multi-item add flow)"
git push
```

---

### Task 6: `InteractiveModelExperience` component (state orchestration + info panel)

**Files:**
- Create: `components/interactive-model/InteractiveModelExperience.tsx`

**Interfaces:**
- Consumes: `HotspotRegion`, `InteractiveModelGarment` from `lib/interactive-model/look.ts` (Task 2); `SilhouetteIllustration` (Task 4); `ShopTheLookPanel` (Task 5); `VariantPicker` (Task 1); `formatPrice` (Task 1); `getScarcityLabel`, `getScarcityStatus` from `lib/product/scarcity.ts` (existing); `findMatchingVariant`, `getInitialSelections`, `isProductSoldOut`, `isSelectionComplete`, `OptionSelections` from `lib/product/variants.ts` (existing); `Button` from `components/ui/Button.tsx` (existing).
- Produces: `InteractiveModelExperience` component, props `{ garments: InteractiveModelGarment[] }` — exported. Task 7 depends on this.

No dedicated test file (same precedent as Tasks 4-5).

- [ ] **Step 1: Implement**

Create `components/interactive-model/InteractiveModelExperience.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { VariantPicker } from '@/components/product/VariantPicker';
import { SilhouetteIllustration } from '@/components/interactive-model/SilhouetteIllustration';
import { ShopTheLookPanel } from '@/components/interactive-model/ShopTheLookPanel';
import type { HotspotRegion, InteractiveModelGarment } from '@/lib/interactive-model/look';
import { formatPrice } from '@/lib/product/price';
import { getScarcityLabel, getScarcityStatus } from '@/lib/product/scarcity';
import {
  findMatchingVariant,
  getInitialSelections,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';

interface InteractiveModelExperienceProps {
  garments: InteractiveModelGarment[];
}

function initialSelections(
  garments: InteractiveModelGarment[],
): Record<string, OptionSelections> {
  return Object.fromEntries(
    garments.map((garment) => [garment.region, getInitialSelections(garment.product.options)]),
  );
}

// DESIGN_SYSTEM.md §29-31, PROJECT.md §26-30 — the real Interactive Model:
// silhouette hotspots (Stage 1), a live product info panel (Stage 2), and
// unified hover/focus/tap activation (Stage 3). Masked-luminance motion
// (Stage 4) and visual refinement (Stage 5) are deferred — see the design
// spec's Non-Goals and DECISIONS.md D-034. Rendered only once
// InteractiveModel.tsx (Task 7) has confirmed every hotspot region
// resolved a real product; `garments` is never empty here.
export function InteractiveModelExperience({ garments }: InteractiveModelExperienceProps) {
  const [activeRegion, setActiveRegion] = useState<HotspotRegion | null>(null);
  const [selectionsByRegion, setSelectionsByRegion] = useState(() => initialSelections(garments));
  const [shopTheLookOpen, setShopTheLookOpen] = useState(false);

  const activeGarment = garments.find((garment) => garment.region === activeRegion) ?? null;

  // Hover AND focus both activate/preview a region (mouse and keyboard
  // parity — DESIGN_SYSTEM.md §29's "hovering a garment" applies equally
  // to a keyboard user focusing it). Click/Enter/Space/tap TOGGLE the
  // region instead of navigating — DECISIONS.md D-035. Deliberately no
  // onMouseLeave/onBlur handler: the panel never auto-closes when the
  // pointer/focus leaves a hotspot, so moving the mouse from the hotspot
  // toward the panel's own controls never races the panel closing before
  // you get there.
  function handleHover(region: HotspotRegion) {
    setActiveRegion(region);
  }

  function handleToggle(region: HotspotRegion) {
    setActiveRegion((prev) => (prev === region ? null : region));
  }

  function handleOptionChange(region: HotspotRegion, optionName: string, value: string) {
    setSelectionsByRegion((prev) => ({
      ...prev,
      [region]: { ...prev[region], [optionName]: value },
    }));
  }

  return (
    <section
      aria-label="Interactive Model"
      className="flex flex-col items-center gap-8 bg-esque-surface px-4 py-16 md:px-8"
    >
      {/* Redundant with the section's own aria-label, matching the
          established ProductDetail/RecentlyViewed pattern of a visible-or-
          sr-only heading alongside a landmark aria-label. */}
      <h2 className="sr-only">Interactive Model</h2>
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">LOOK 01</p>

      <div className="w-full max-w-sm">
        <SilhouetteIllustration
          garments={garments}
          activeRegion={activeRegion}
          onHover={handleHover}
          onToggle={handleToggle}
        />
      </div>

      {/* Fixed min-height so the panel's appearance/disappearance never
          reflows the rest of the page. */}
      <div className="min-h-[22rem] w-full max-w-2xl border-t border-esque-elevated pt-8">
        {activeGarment ? (
          <ActiveGarmentPanel
            garment={activeGarment}
            selections={selectionsByRegion[activeGarment.region]}
            onOptionChange={(optionName, value) =>
              handleOptionChange(activeGarment.region, optionName, value)
            }
          />
        ) : (
          <p className="text-utility uppercase tracking-metadata text-esque-text-muted">
            Select a garment to view details.
          </p>
        )}
      </div>

      {/* Always visible, not gated behind hotspot interaction — the
          deliberate, real screen-reader/non-visual alternative to the
          silhouette map (DECISIONS.md D-035). */}
      <Button variant="secondary" onClick={() => setShopTheLookOpen(true)}>
        SHOP THE LOOK
      </Button>

      <ShopTheLookPanel
        garments={garments}
        open={shopTheLookOpen}
        onClose={() => setShopTheLookOpen(false)}
      />
    </section>
  );
}

interface ActiveGarmentPanelProps {
  garment: InteractiveModelGarment;
  selections: OptionSelections;
  onOptionChange: (optionName: string, value: string) => void;
}

// Stage 2's product info panel — PROJECT.md §27: name, category, price,
// colors/sizes, VIEW PRODUCT, QUICK ADD. CONTENT.md §10's exact CTA
// vocabulary is used for both actions. QUICK ADD is the terminal add
// action here (not a trigger that opens a further selector) — the variant
// picker is already inline the moment this panel is visible, so there's no
// further "focused selector" left to open (DECISIONS.md D-035). No cart
// exists yet (D-016), so QUICK ADD is a real, disabled-gated button with a
// deliberate no-op onClick, matching D-029.
function ActiveGarmentPanel({ garment, selections, onOptionChange }: ActiveGarmentPanelProps) {
  const { product } = garment;
  const soldOut = isProductSoldOut(product.variants);
  const matchedVariant = findMatchingVariant(product.variants, selections);
  const selectionComplete = isSelectionComplete(product.options, selections);
  const displayPrice = matchedVariant?.price ?? product.minPrice;
  const scarcityLabel = matchedVariant
    ? getScarcityLabel(
        getScarcityStatus(matchedVariant.quantityAvailable, matchedVariant.availableForSale),
      )
    : null;
  const canQuickAdd = !soldOut && matchedVariant !== null && matchedVariant.availableForSale;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-12">
      <div className="flex flex-col gap-2">
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          {garment.regionLabel} — {product.productType}
        </p>
        <h3 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
          {product.title}
        </h3>
        <div className="flex items-center gap-3">
          <p className="text-body text-esque-text">{formatPrice(displayPrice)}</p>
          {soldOut && (
            <span className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              SOLD OUT
            </span>
          )}
          {!soldOut && scarcityLabel && (
            <span className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              {scarcityLabel}
            </span>
          )}
        </div>
        {product.description && (
          <p className="max-w-sm text-body text-esque-text-secondary">{product.description}</p>
        )}
      </div>

      {soldOut ? (
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          NO LONGER AVAILABLE.
        </p>
      ) : (
        <div className="flex flex-col gap-4 md:w-72">
          <VariantPicker
            namePrefix={`preview-${product.handle}`}
            options={product.options}
            variants={product.variants}
            selections={selections}
            onChange={onOptionChange}
          />
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/products/${product.handle}`}
              className="flex items-center text-utility uppercase tracking-nav text-esque-text underline-offset-4 transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
            >
              VIEW PRODUCT
            </Link>
            <Button type="button" variant="primary" disabled={!canQuickAdd} onClick={() => {}}>
              QUICK ADD
            </Button>
          </div>
          {!selectionComplete && (
            <p className="text-utility text-esque-text-secondary">
              Select all options to continue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/interactive-model/InteractiveModelExperience.tsx
git commit -m "Add InteractiveModelExperience component (Stages 2-3)"
git push
```

---

### Task 7: `InteractiveModel` decider + relocate the placeholder

**Files:**
- Create: `components/interactive-model/InteractiveModelPlaceholder.tsx` (moved from `components/home/`, content unchanged apart from its header comment)
- Delete: `components/home/InteractiveModelPlaceholder.tsx`
- Create: `components/interactive-model/InteractiveModel.tsx`

**Interfaces:**
- Consumes: `HOTSPOT_REGIONS`, `InteractiveModelGarment` from `lib/interactive-model/look.ts` (Task 2); `InteractiveModelExperience` (Task 6); `InteractiveModelPlaceholder` (this task).
- Produces: `InteractiveModel` component, props `{ garments: InteractiveModelGarment[] }` — exported. Task 8 depends on this.

- [ ] **Step 1: Create the relocated placeholder**

Create `components/interactive-model/InteractiveModelPlaceholder.tsx`:

```tsx
// DESIGN_SYSTEM.md §29-31, PROJECT.md §26-30 — Esque's signature
// Interactive Model. ROADMAP.md Phase 8's real feature (silhouette
// hotspots, product info panel, mobile tap behavior, Shop the Look) is
// InteractiveModelExperience.tsx; this placeholder is that feature's own
// honest fallback, rendered by InteractiveModel.tsx whenever Shopify
// hasn't resolved a real product for every hotspot region (unconfigured
// store, or a real store missing Tops/Bottoms products) — mirrors
// DECISIONS.md D-033's graceful-degradation precedent. Masked-luminance
// motion (Stage 4) and visual refinement (Stage 5) remain deferred either
// way — see DECISIONS.md D-034. Relocated from components/home/ as part of
// that phase (content unchanged — see DECISIONS.md D-034).
export function InteractiveModelPlaceholder() {
  return (
    <section
      aria-label="Interactive Model"
      className="flex min-h-[80svh] flex-col items-center justify-center gap-4 bg-esque-surface px-4 text-center"
    >
      {/* DESIGN_SYSTEM.md §29's own suggested copy for this scene. */}
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">LOOK 01</p>
      <div
        aria-hidden="true"
        className="flex aspect-[4/5] w-full max-w-sm items-center justify-center bg-esque-elevated"
      >
        {/* DESIGN_SYSTEM.md §65's own literal placeholder example for this
            asset type. */}
        <p className="text-utility uppercase tracking-metadata text-esque-text-muted">
          ESQUE PLACEHOLDER — MODEL, FULL BODY
        </p>
      </div>
      <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        ARRIVING SOON.
      </h2>
    </section>
  );
}
```

- [ ] **Step 2: Remove the old file**

```bash
git rm components/home/InteractiveModelPlaceholder.tsx
```

- [ ] **Step 3: Implement the decider**

Create `components/interactive-model/InteractiveModel.tsx`:

```tsx
import { InteractiveModelExperience } from '@/components/interactive-model/InteractiveModelExperience';
import { InteractiveModelPlaceholder } from '@/components/interactive-model/InteractiveModelPlaceholder';
import { HOTSPOT_REGIONS, type InteractiveModelGarment } from '@/lib/interactive-model/look';

interface InteractiveModelProps {
  garments: InteractiveModelGarment[];
}

// DECISIONS.md D-034 — renders the real experience only once every
// configured hotspot region resolved a real product; otherwise falls back
// to the existing, honest placeholder (mirrors DECISIONS.md D-033's
// graceful-degradation precedent). A partial result (e.g. Tops resolved
// but Bottoms didn't) is treated the same as a total failure — a figure
// with only one garment drawn would read as broken, not intentional.
export function InteractiveModel({ garments }: InteractiveModelProps) {
  if (garments.length < HOTSPOT_REGIONS.length) {
    return <InteractiveModelPlaceholder />;
  }
  return <InteractiveModelExperience garments={garments} />;
}
```

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

Note: `app/(storefront)/page.tsx` still imports `InteractiveModelPlaceholder` from `components/home/` at this point — Task 8 rewires it. Update that one import line now so the build stays green:

In `app/(storefront)/page.tsx`, change:

```tsx
import { InteractiveModelPlaceholder } from '@/components/home/InteractiveModelPlaceholder';
```

to:

```tsx
import { InteractiveModel } from '@/components/interactive-model/InteractiveModel';
```

and change the render line:

```tsx
      <InteractiveModelPlaceholder />
```

to:

```tsx
      <InteractiveModel garments={[]} />
```

(Task 8 replaces this `[]` placeholder argument with the real, awaited fetch — this task only needs the import graph to stay valid so `pnpm build`/`pnpm typecheck` pass with the file moved.)

```bash
git add components/interactive-model/InteractiveModelPlaceholder.tsx components/interactive-model/InteractiveModel.tsx "app/(storefront)/page.tsx"
git commit -m "Add InteractiveModel decider; relocate InteractiveModelPlaceholder"
git push
```

---

### Task 8: Wire the real Interactive Model into the homepage

**Files:**
- Modify: `app/(storefront)/page.tsx`
- Modify: `tests/e2e/homepage.spec.ts`

- [ ] **Step 1: Implement**

Replace `app/(storefront)/page.tsx` in full:

```tsx
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CollectionHero } from '@/components/home/CollectionHero';
import { CollectionStatement } from '@/components/home/CollectionStatement';
import { DropStatus } from '@/components/home/DropStatus';
import { SelectedPieces } from '@/components/home/SelectedPieces';
import { InteractiveModel } from '@/components/interactive-model/InteractiveModel';
import { getInteractiveModelLook } from '@/lib/interactive-model/look';
import { getSelectedPieces } from '@/lib/home/selected-pieces';

// ROADMAP.md Phase 7/8 — the real homepage. Scene order matches PROJECT.md
// §23 and DESIGN_SYSTEM.md §58's Mobile Homepage sequence exactly. Scene 07
// (Archive Preview) is deliberately omitted — see the homepage design
// spec's Non-Goals. Selected Pieces and the Interactive Model are this
// page's two independent Shopify dependencies — fetched concurrently
// (neither depends on the other) and each isolated so a failure in one
// never affects the other five scenes (DECISIONS.md D-033/D-034).
export default async function Home() {
  const [selectedPieces, interactiveModelLook] = await Promise.all([
    getSelectedPieces(),
    getInteractiveModelLook(),
  ]);

  return (
    <>
      <CollectionHero />
      <InteractiveModel garments={interactiveModelLook} />
      <CollectionStatement />
      <SelectedPieces products={selectedPieces} />
      <CategoryShowcase />
      <DropStatus />
    </>
  );
}
```

- [ ] **Step 2: Update the E2E environment comment and add new assertions**

In `tests/e2e/homepage.spec.ts`, find the file-level comment above `test.describe('homepage — renders real scene content even with Shopify unconfigured', ...)`:

```typescript
// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env) — Selected
// Pieces' fetch always fails here. This is deliberately the load-bearing
// case for this phase's core new architecture (DECISIONS.md D-033): the
// other five rendered scenes must still render correctly regardless.
```

Replace with:

```typescript
// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env) — Selected
// Pieces' and the Interactive Model's fetches always fail here. This is
// deliberately the load-bearing case for this project's graceful-
// degradation architecture (DECISIONS.md D-033/D-034): the other scenes
// must still render correctly regardless, and a Shopify-dependent scene
// must degrade to its own honest fallback rather than render broken.
```

Immediately after the existing test:

```typescript
  test('the interactive model placeholder is present and honestly labeled', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Interactive Model' });
    await expect(scene).toBeVisible();
    await expect(scene.getByText('LOOK 01')).toBeVisible();
    await expect(scene.getByText('ESQUE PLACEHOLDER — MODEL, FULL BODY')).toBeVisible();
    await expect(scene.getByRole('heading', { name: 'ARRIVING SOON.' })).toBeVisible();
  });
```

add:

```typescript
  test('the interactive model does not mount its real, interactive tree when Shopify is unconfigured', async ({
    page,
  }) => {
    await page.goto('/');
    // Proves InteractiveModel.tsx's both-or-placeholder gate (DECISIONS.md
    // D-034) genuinely renders the placeholder branch — not just visually,
    // but that the real client component (and its SHOP THE LOOK entry
    // point) isn't mounted at all.
    await expect(page.getByRole('button', { name: 'SHOP THE LOOK' })).toHaveCount(0);
  });
```

- [ ] **Step 3: Run the full suite**

Run: `pnpm test:e2e`
Expected: all pass, including the pre-existing "renders scenes in the PROJECT.md §23 / DESIGN_SYSTEM.md §58 order" test (the region name `'Interactive Model'` is identical whether the placeholder or real experience renders) and "loads without console errors" (the fallback branch mounts no client component at all, so nothing new can log an error here).

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add "app/(storefront)/page.tsx" tests/e2e/homepage.spec.ts
git commit -m "Wire the real Interactive Model into the homepage"
git push
```

---

### Task 9: Documentation — DECISIONS.md, ROADMAP.md, ARCHITECTURE.md

**Files:**
- Modify: `DECISIONS.md` (append D-034, D-035, D-036)
- Modify: `ROADMAP.md` (Phase 8 checkboxes; Phase 7's Scene 02 line)
- Modify: `ARCHITECTURE.md` (§3 repo structure)

- [ ] **Step 1: DECISIONS.md**

Append three entries (D-034, D-035, D-036) per the design spec's "New Architectural Decisions to Record" section, matching this file's existing citation style exactly (see the design spec for full drafted text of each).

- [ ] **Step 2: ROADMAP.md**

Update Phase 8 to reflect actual, honest per-stage status (built vs. deferred, each citing DECISIONS.md D-034/D-035/D-036 as appropriate), and update Phase 7's Scene 02 line from `[~]` placeholder-slot to `[x]`, noting the real feature now exists in Phase 8 and that `InteractiveModelPlaceholder` is retained as its fallback rather than discarded.

- [ ] **Step 3: ARCHITECTURE.md**

In §3's repo structure sketch, add `lib/interactive-model/` alongside the existing `catalog/`/`product/`/`home/` entries (a short note describing what it holds, matching this document's existing footnote style), update the `components/interactive-model/` comment to note it's now built (Stage 4-5 deferred), and remove `interactive-model/` from the prose paragraph's "remain unbuilt" list.

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add DECISIONS.md ROADMAP.md ARCHITECTURE.md
git commit -m "Record D-034-D-036; mark Phase 8's completed and narrowed items"
git push
```

# PDP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ROADMAP.md Phase 5 (Product Detail Page), narrowed per the design spec: a real `/products/[handle]` route with a 60/40 layout, a generic keyboard-accessible size/color selector backed by an extended `getProduct`, a native-`<dialog>` Size Guide, honest fixture-verified scarcity display, related products (mechanically derived), and a localStorage-backed recently-viewed strip. Quick Add's on-grid entry point stays deferred (see spec Non-Goals / D-029) — this plan builds the variant-selection mechanism it will reuse later, not the entry point itself.

**Architecture:** `getProduct` (existing, previously unused) is extended additively with `options`/`quantityAvailable`. All new interactive/display logic lives in pure, framework-free `lib/product/*.ts` modules (mirroring `lib/catalog/`) — fixture-tested with Vitest, no jsdom/RTL introduced. Client components (`ProductPurchasePanel`, `SizeGuidePanel`, `RecentlyViewed`) are thin wiring layers over that pure logic. `ProductGallery` and `ProductDetail` stay Server Components; `components/catalog/ProductGrid` is reused as-is for Related Products.

**Tech Stack:** No new dependencies. Reuses `@shopify/storefront-api-client`, `Button`/`Input`, `next/image`/`next/link`, React's `cache()`, the native `<dialog>` element.

**Spec:** `docs/superpowers/specs/2026-09-05-pdp-design.md` — read it in full before starting; this plan assumes its Architecture/Non-Goals/New-Decisions sections as given and doesn't re-justify them.

## Global Constraints

- TypeScript strict mode stays on; no `@ts-ignore`/`@ts-nocheck`/`any`.
- pnpm only.
- No jsdom/React Testing Library — logic goes in pure `lib/product/*.ts` functions, unit-tested directly; components stay thin.
- No changes to `lib/shopify/collections.ts`, `lib/shopify/queries/collections.ts`, `GET_PRODUCTS_QUERY`/`getProducts`/`ProductListItem`, `lib/catalog/*`, or any existing catalog component — this pass only extends `GET_PRODUCT_QUERY`/`getProduct`/`ProductDetail`/`ProductVariant` additively.
- Do not modify `CLAUDE.md` under any circumstance.
- After **every** task: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm build` — fix any failure the task caused before moving on, then commit.
- Record DECISIONS.md D-027–D-031 and update ROADMAP.md Phase 5 exactly as specified in Task 11 — not deferred past it.
- Commit trailer on every commit: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

### Task 1: Extend `getProduct` with `options` and `quantityAvailable`

**Files:**
- Modify: `lib/shopify/queries/products.ts` (`GET_PRODUCT_QUERY` only — `GET_PRODUCTS_BY_COLLECTION_QUERY`/`GET_PRODUCTS_QUERY` untouched)
- Modify: `lib/shopify/products.ts` (`ProductDetail`, `ProductVariant`, add `ProductOption`, `getProduct`'s mapping — `ProductSummary`/`ProductListItem`/`getProductsByCollection`/`getProducts` untouched)
- Modify: `lib/shopify/products.test.ts` (update the existing `getProduct` "maps a real-shaped response" test; add two new tests — `getProductsByCollection`/`getProducts` tests untouched)
- Regenerate: `lib/shopify/storefront.generated.d.ts`, `lib/shopify/storefront.types.d.ts` (both tracked per D-017 — commit them)

**Interfaces:**
- Produces: `ProductOption { id, name, values: string[] }` (new export), `ProductVariant` gains `quantityAvailable: number | null`, `ProductDetail` gains `options: ProductOption[]`. Tasks 2, 7, 9 depend on this shape.

- [ ] **Step 1: Extend the query document**

In `lib/shopify/queries/products.ts`, modify `GET_PRODUCT_QUERY` (add `options` after `images`, add `quantityAvailable` inside the `variants` node — everything else unchanged):

```typescript
export const GET_PRODUCT_QUERY = `#graphql
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      productType
      tags
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      options {
        id
        name
        optionValues {
          id
          name
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            availableForSale
            quantityAvailable
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;
```

Do not touch `GET_PRODUCTS_BY_COLLECTION_QUERY` or `GET_PRODUCTS_QUERY` below it.

- [ ] **Step 2: Regenerate codegen against the live schema**

Run: `pnpm graphql-codegen`
Expected: succeeds; `storefront.generated.d.ts`/`storefront.types.d.ts` now also cover `options`/`optionValues`/`quantityAvailable` on the `GetProduct` operation. If it fails, the error names the specific invalid field — re-check Step 1 against `lib/shopify/storefront.types.d.ts`'s existing `ProductOption`/`ProductOptionValue`/`ProductVariant` type definitions (already present in the schema dump even before this query used them) before rerunning.

- [ ] **Step 3: Update the existing test's fixture and add two new tests**

In `lib/shopify/products.test.ts`, update the `getProduct` describe block's `'maps a real-shaped response into a ProductDetail'` test — add `options` to the mocked `product` and `quantityAvailable` to its variant, and mirror both in the expectation:

```typescript
  test('maps a real-shaped response into a ProductDetail', async () => {
    mockClient({
      data: {
        product: {
          id: 'gid://shopify/Product/1',
          handle: 'item-one',
          title: 'Item One',
          description: 'A first piece.',
          productType: 'Tops',
          tags: ['new'],
          priceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'USD' } },
          images: {
            edges: [
              {
                node: {
                  url: 'https://cdn.example/item-one.jpg',
                  altText: null,
                  width: 800,
                  height: 1000,
                },
              },
            ],
          },
          options: [
            {
              id: 'gid://shopify/ProductOption/1',
              name: 'Size',
              optionValues: [
                { id: 'gid://shopify/ProductOptionValue/1', name: 'S' },
                { id: 'gid://shopify/ProductOptionValue/2', name: 'M' },
              ],
            },
          ],
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/1',
                  title: 'M',
                  availableForSale: true,
                  quantityAvailable: 12,
                  price: { amount: '120.00', currencyCode: 'USD' },
                  selectedOptions: [{ name: 'Size', value: 'M' }],
                },
              },
            ],
          },
        },
      },
    });

    const result = await getProduct('item-one');

    expect(result).toEqual({
      id: 'gid://shopify/Product/1',
      handle: 'item-one',
      title: 'Item One',
      description: 'A first piece.',
      productType: 'Tops',
      tags: ['new'],
      minPrice: { amount: '120.00', currencyCode: 'USD' },
      images: [
        { url: 'https://cdn.example/item-one.jpg', altText: null, width: 800, height: 1000 },
      ],
      options: [
        { id: 'gid://shopify/ProductOption/1', name: 'Size', values: ['S', 'M'] },
      ],
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          title: 'M',
          availableForSale: true,
          quantityAvailable: 12,
          price: { amount: '120.00', currencyCode: 'USD' },
          selectedOptions: [{ name: 'Size', value: 'M' }],
        },
      ],
    });
  });
```

Add two new tests directly below it, inside the same `describe('getProduct', ...)` block:

```typescript
  test('maps a product with no options to an empty options array', async () => {
    mockClient({
      data: {
        product: {
          id: 'gid://shopify/Product/2',
          handle: 'simple-item',
          title: 'Simple Item',
          description: 'One size, one color.',
          productType: 'Etc.',
          tags: [],
          priceRange: { minVariantPrice: { amount: '50.00', currencyCode: 'USD' } },
          images: { edges: [] },
          options: [],
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/2',
                  title: 'Default Title',
                  availableForSale: true,
                  quantityAvailable: null,
                  price: { amount: '50.00', currencyCode: 'USD' },
                  selectedOptions: [],
                },
              },
            ],
          },
        },
      },
    });

    const result = await getProduct('simple-item');
    expect(result?.options).toEqual([]);
    expect(result?.variants[0].quantityAvailable).toBeNull();
  });

  test('passes quantityAvailable: null through as null, not coerced to 0', async () => {
    mockClient({
      data: {
        product: {
          id: 'gid://shopify/Product/3',
          handle: 'unknown-inventory-item',
          title: 'Unknown Inventory Item',
          description: '',
          productType: 'Tops',
          tags: [],
          priceRange: { minVariantPrice: { amount: '90.00', currencyCode: 'USD' } },
          images: { edges: [] },
          options: [],
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/3',
                  title: 'Default Title',
                  availableForSale: true,
                  quantityAvailable: null,
                  price: { amount: '90.00', currencyCode: 'USD' },
                  selectedOptions: [],
                },
              },
            ],
          },
        },
      },
    });

    const result = await getProduct('unknown-inventory-item');
    expect(result?.variants[0].quantityAvailable).toBeNull();
  });
```

- [ ] **Step 4: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `getProduct`'s current mapping doesn't produce `options` or `quantityAvailable`.

- [ ] **Step 5: Implement**

In `lib/shopify/products.ts`, add the new interface and extend the two existing ones (keep every existing field):

```typescript
export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}

export interface ProductDetail {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  minPrice: { amount: string; currencyCode: string };
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
}
```

Update `getProduct`'s return mapping (replace the existing `options`-less version):

```typescript
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    productType: product.productType,
    tags: product.tags,
    minPrice: product.priceRange.minVariantPrice,
    images: product.images.edges.map(({ node }) => ({
      url: node.url,
      altText: node.altText ?? null,
      width: node.width ?? null,
      height: node.height ?? null,
    })),
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    variants: product.variants.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      availableForSale: node.availableForSale,
      quantityAvailable: node.quantityAvailable ?? null,
      price: node.price,
      selectedOptions: node.selectedOptions,
    })),
  };
```

(This replaces the previous bare `variants: product.variants.edges.map(({ node }) => node)` passthrough — necessary because `quantityAvailable` now needs `?? null` normalization, so each variant is constructed explicitly instead.)

- [ ] **Step 6: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all tests pass, including every existing `products.test.ts`/`collections.test.ts` test, unchanged.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors. If `option.optionValues`/`node.quantityAvailable` don't structurally match what the regenerated types expect, the generated type is the source of truth — adjust the mapping to match it exactly rather than casting.

- [ ] **Step 8: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/shopify/queries/products.ts lib/shopify/products.ts lib/shopify/products.test.ts lib/shopify/storefront.generated.d.ts lib/shopify/storefront.types.d.ts
git commit -m "Extend getProduct with options and quantityAvailable"
```

Confirm `git status` shows the two generated files as modified (not untracked) before staging — same D-017 checkpoint the catalog plan's Task 4 used.

---

### Task 2: Variant-selection logic (`lib/product/variants.ts`)

**Files:**
- Create: `lib/product/variants.ts`
- Create: `lib/product/variants.test.ts`

**Interfaces:**
- Consumes: `ProductOption`, `ProductVariant` from `lib/shopify/products.ts` (Task 1).
- Produces: `OptionSelections`, `getInitialSelections`, `findMatchingVariant`, `isOptionValueAvailable`, `isSelectionComplete`, `isProductSoldOut` — all exported. Task 7 (`ProductPurchasePanel`) depends on these.

- [ ] **Step 1: Write the failing test**

Create `lib/product/variants.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import {
  findMatchingVariant,
  getInitialSelections,
  isOptionValueAvailable,
  isProductSoldOut,
  isSelectionComplete,
} from '@/lib/product/variants';
import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

const SIZE_COLOR_OPTIONS: ProductOption[] = [
  { id: 'opt1', name: 'Size', values: ['S', 'M', 'L'] },
  { id: 'opt2', name: 'Color', values: ['Black Forest'] },
];

const SIZE_COLOR_VARIANTS: ProductVariant[] = [
  {
    id: 'v1',
    title: 'S / Black Forest',
    availableForSale: true,
    quantityAvailable: 5,
    price: { amount: '120.00', currencyCode: 'USD' },
    selectedOptions: [
      { name: 'Size', value: 'S' },
      { name: 'Color', value: 'Black Forest' },
    ],
  },
  {
    id: 'v2',
    title: 'M / Black Forest',
    availableForSale: false,
    quantityAvailable: 0,
    price: { amount: '120.00', currencyCode: 'USD' },
    selectedOptions: [
      { name: 'Size', value: 'M' },
      { name: 'Color', value: 'Black Forest' },
    ],
  },
  {
    id: 'v3',
    title: 'L / Black Forest',
    availableForSale: true,
    quantityAvailable: 2,
    price: { amount: '120.00', currencyCode: 'USD' },
    selectedOptions: [
      { name: 'Size', value: 'L' },
      { name: 'Color', value: 'Black Forest' },
    ],
  },
];

describe('getInitialSelections', () => {
  test('auto-selects a single-value option that is not Size', () => {
    expect(getInitialSelections(SIZE_COLOR_OPTIONS)).toEqual({ Color: 'Black Forest' });
  });

  test('never auto-selects Size, even with only one value (PROJECT.md §39)', () => {
    expect(getInitialSelections([{ id: 'opt1', name: 'Size', values: ['M'] }])).toEqual({});
  });

  test('returns an empty object for a product with no options', () => {
    expect(getInitialSelections([])).toEqual({});
  });
});

describe('findMatchingVariant', () => {
  test('returns null for an incomplete selection', () => {
    expect(findMatchingVariant(SIZE_COLOR_VARIANTS, { Color: 'Black Forest' })).toBeNull();
  });

  test('returns the matching variant for a complete selection', () => {
    expect(findMatchingVariant(SIZE_COLOR_VARIANTS, { Size: 'L', Color: 'Black Forest' })?.id).toBe(
      'v3',
    );
  });

  test('returns null when no variant matches the combination', () => {
    expect(findMatchingVariant(SIZE_COLOR_VARIANTS, { Size: 'XL', Color: 'Black Forest' })).toBeNull();
  });

  test('returns the single variant of an optionless product regardless of (empty) selections', () => {
    const variant: ProductVariant = {
      id: 'default',
      title: 'Default Title',
      availableForSale: true,
      quantityAvailable: 10,
      price: { amount: '50.00', currencyCode: 'USD' },
      selectedOptions: [],
    };
    expect(findMatchingVariant([variant], {})?.id).toBe('default');
  });
});

describe('isOptionValueAvailable', () => {
  test('true for a value some available variant has', () => {
    expect(isOptionValueAvailable(SIZE_COLOR_VARIANTS, 'Size', 'S')).toBe(true);
  });

  test('false for a value only an unavailable variant has', () => {
    expect(isOptionValueAvailable(SIZE_COLOR_VARIANTS, 'Size', 'M')).toBe(false);
  });

  test('false for a value no variant has at all', () => {
    expect(isOptionValueAvailable(SIZE_COLOR_VARIANTS, 'Size', 'XL')).toBe(false);
  });
});

describe('isSelectionComplete', () => {
  test('false when an option has no selection yet', () => {
    expect(isSelectionComplete(SIZE_COLOR_OPTIONS, { Color: 'Black Forest' })).toBe(false);
  });

  test('true when every option has a selection', () => {
    expect(isSelectionComplete(SIZE_COLOR_OPTIONS, { Size: 'S', Color: 'Black Forest' })).toBe(true);
  });

  test('true for a product with no options', () => {
    expect(isSelectionComplete([], {})).toBe(true);
  });
});

describe('isProductSoldOut', () => {
  test('false when at least one variant is available', () => {
    expect(isProductSoldOut(SIZE_COLOR_VARIANTS)).toBe(false);
  });

  test('true when every variant is unavailable', () => {
    expect(isProductSoldOut(SIZE_COLOR_VARIANTS.map((v) => ({ ...v, availableForSale: false })))).toBe(
      true,
    );
  });

  test('false for an empty variants array (defensive — Shopify always returns at least one)', () => {
    expect(isProductSoldOut([])).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/product/variants.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/product/variants.ts`:

```typescript
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
export function isSelectionComplete(options: ProductOption[], selections: OptionSelections): boolean {
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/product/variants.ts lib/product/variants.test.ts
git commit -m "Add pure variant-selection logic for the PDP size/color selector"
```

---

### Task 3: Scarcity logic (`lib/product/scarcity.ts`)

**Files:**
- Create: `lib/product/scarcity.ts`
- Create: `lib/product/scarcity.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces: `ScarcityStatus`, `getScarcityStatus`, `getScarcityLabel` — exported. Task 7 depends on these.

- [ ] **Step 1: Write the failing test**

Create `lib/product/scarcity.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { getScarcityLabel, getScarcityStatus } from '@/lib/product/scarcity';

describe('getScarcityStatus', () => {
  test('unavailable variant is always sold-out, regardless of quantity', () => {
    expect(getScarcityStatus(5, false)).toEqual({ level: 'sold-out' });
    expect(getScarcityStatus(null, false)).toEqual({ level: 'sold-out' });
  });

  test('unknown quantity on an available variant renders nothing — never fabricated', () => {
    expect(getScarcityStatus(null, true)).toBeNull();
  });

  test('zero quantity on an otherwise-available variant is sold-out', () => {
    expect(getScarcityStatus(0, true)).toEqual({ level: 'sold-out' });
  });

  test('1 to 3 remaining is the exact-count "final" tier', () => {
    expect(getScarcityStatus(1, true)).toEqual({ level: 'final', count: 1 });
    expect(getScarcityStatus(3, true)).toEqual({ level: 'final', count: 3 });
  });

  test('4 to 10 remaining is "low", with no exact count', () => {
    expect(getScarcityStatus(4, true)).toEqual({ level: 'low' });
    expect(getScarcityStatus(10, true)).toEqual({ level: 'low' });
  });

  test('above 10 remaining renders nothing — not scarce enough to mention', () => {
    expect(getScarcityStatus(11, true)).toBeNull();
    expect(getScarcityStatus(500, true)).toBeNull();
  });
});

describe('getScarcityLabel', () => {
  test('maps each tier to CONTENT.md §8 vocabulary', () => {
    expect(getScarcityLabel({ level: 'sold-out' })).toBe('SOLD OUT');
    expect(getScarcityLabel({ level: 'final', count: 2 })).toBe('2 REMAIN');
    expect(getScarcityLabel({ level: 'low' })).toBe('LOW STOCK');
  });

  test('null status maps to null label', () => {
    expect(getScarcityLabel(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/product/scarcity.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/product/scarcity.ts`:

```typescript
// Honest scarcity display logic — DECISIONS.md D-028. Never fabricates: a
// null quantityAvailable (unconfigured store, or a real store that hasn't
// exposed it) always yields a null status here, never a guessed number.
// Thresholds (<=3 exact count, <=10 "low") are this pass's own reasoned
// interpretation of CONTENT.md §8's example vocabulary (LOW STOCK, "3
// REMAIN", SOLD OUT), not a value supplied by a merchandiser.

export type ScarcityStatus =
  | { level: 'sold-out' }
  | { level: 'final'; count: number }
  | { level: 'low' }
  | null;

const FINAL_THRESHOLD = 3;
const LOW_STOCK_THRESHOLD = 10;

export function getScarcityStatus(
  quantityAvailable: number | null,
  availableForSale: boolean,
): ScarcityStatus {
  if (!availableForSale) return { level: 'sold-out' };
  if (quantityAvailable === null) return null;
  if (quantityAvailable <= 0) return { level: 'sold-out' };
  if (quantityAvailable <= FINAL_THRESHOLD) return { level: 'final', count: quantityAvailable };
  if (quantityAvailable <= LOW_STOCK_THRESHOLD) return { level: 'low' };
  return null;
}

/** Maps a status to CONTENT.md-vocabulary copy, kept separate so the copy itself is independently tested. */
export function getScarcityLabel(status: ScarcityStatus): string | null {
  if (!status) return null;
  switch (status.level) {
    case 'sold-out':
      return 'SOLD OUT';
    case 'final':
      return `${status.count} REMAIN`;
    case 'low':
      return 'LOW STOCK';
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/product/scarcity.ts lib/product/scarcity.test.ts
git commit -m "Add honest, fixture-tested scarcity display logic"
```

---

### Task 4: Recently-viewed storage logic (`lib/product/recently-viewed.ts`)

**Files:**
- Create: `lib/product/recently-viewed.ts`
- Create: `lib/product/recently-viewed.test.ts`

**Interfaces:**
- Consumes: nothing (pure — takes an injected minimal storage interface, not the DOM's global `Storage`, for testability without jsdom).
- Produces: `RecentlyViewedItem`, `RecentlyViewedStorage`, `readRecentlyViewed`, `recordRecentlyViewed` — exported. Task 8 (`RecentlyViewed` component) depends on these.

- [ ] **Step 1: Write the failing test**

Create `lib/product/recently-viewed.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import {
  readRecentlyViewed,
  recordRecentlyViewed,
  type RecentlyViewedItem,
  type RecentlyViewedStorage,
} from '@/lib/product/recently-viewed';

function fakeStorage(initial: Record<string, string> = {}): RecentlyViewedStorage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

const ITEM_A: RecentlyViewedItem = {
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  imageUrl: 'https://cdn.example/hoodie-01.jpg',
  imageAlt: null,
  minPrice: { amount: '180.00', currencyCode: 'USD' },
};

const ITEM_B: RecentlyViewedItem = {
  handle: 'pants-01',
  title: 'Pants 01',
  imageUrl: 'https://cdn.example/pants-01.jpg',
  imageAlt: null,
  minPrice: { amount: '140.00', currencyCode: 'USD' },
};

describe('readRecentlyViewed', () => {
  test('returns an empty array when nothing is stored', () => {
    expect(readRecentlyViewed(fakeStorage())).toEqual([]);
  });

  test('returns an empty array for corrupt JSON, without throwing', () => {
    expect(readRecentlyViewed(fakeStorage({ 'esque:recently-viewed': '{not json' }))).toEqual([]);
  });

  test('returns an empty array for a missing/mismatched schema version', () => {
    const raw = JSON.stringify({ v: 99, items: [ITEM_A] });
    expect(readRecentlyViewed(fakeStorage({ 'esque:recently-viewed': raw }))).toEqual([]);
  });

  test('returns an empty array when a getItem call itself throws', () => {
    const storage: RecentlyViewedStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
    };
    expect(readRecentlyViewed(storage)).toEqual([]);
  });
});

describe('recordRecentlyViewed', () => {
  test('adds the first item', () => {
    const storage = fakeStorage();
    expect(recordRecentlyViewed(storage, ITEM_A)).toEqual([ITEM_A]);
    expect(readRecentlyViewed(storage)).toEqual([ITEM_A]);
  });

  test('moves a re-viewed item to the front rather than duplicating it', () => {
    const storage = fakeStorage();
    recordRecentlyViewed(storage, ITEM_A);
    recordRecentlyViewed(storage, ITEM_B);
    expect(recordRecentlyViewed(storage, ITEM_A)).toEqual([ITEM_A, ITEM_B]);
  });

  test('caps at max, dropping the oldest', () => {
    const storage = fakeStorage();
    recordRecentlyViewed(storage, ITEM_A, 1);
    expect(recordRecentlyViewed(storage, ITEM_B, 1)).toEqual([ITEM_B]);
  });

  test('still returns the correct in-memory list even when setItem throws', () => {
    const storage: RecentlyViewedStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(recordRecentlyViewed(storage, ITEM_A)).toEqual([ITEM_A]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/product/recently-viewed.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/product/recently-viewed.ts`:

```typescript
// Client-only, localStorage-backed "recently viewed" list — no Shopify
// dependency at all (DECISIONS.md D-031). Denormalized snippets are
// stored directly (handle/title/image/price) rather than re-fetching full
// product data at render time. RecentlyViewedStorage is a minimal
// structural type (not DOM lib's full Storage) so this stays trivially
// fakeable in tests without jsdom.

export interface RecentlyViewedItem {
  handle: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  minPrice: { amount: string; currencyCode: string };
}

export interface RecentlyViewedStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'esque:recently-viewed';
const SCHEMA_VERSION = 1;
const DEFAULT_MAX = 8;

interface StoredShape {
  v: number;
  items: RecentlyViewedItem[];
}

function isStoredShape(value: unknown): value is StoredShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { v?: unknown }).v === SCHEMA_VERSION &&
    Array.isArray((value as { items?: unknown }).items)
  );
}

/** Never throws — corrupt data, a wrong schema version, or a blocked store are all treated as "nothing saved yet." */
export function readRecentlyViewed(storage: RecentlyViewedStorage): RecentlyViewedItem[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return isStoredShape(parsed) ? parsed.items : [];
  } catch {
    return [];
  }
}

/**
 * Dedupes by handle (moving a re-viewed item to the front rather than
 * duplicating it), caps at `max`, and persists. A failed write (quota
 * exceeded, private browsing) never throws — the returned in-memory list
 * is still correct for the current render even if it can't be saved for
 * next time.
 */
export function recordRecentlyViewed(
  storage: RecentlyViewedStorage,
  item: RecentlyViewedItem,
  max: number = DEFAULT_MAX,
): RecentlyViewedItem[] {
  const existing = readRecentlyViewed(storage).filter((existing) => existing.handle !== item.handle);
  const next = [item, ...existing].slice(0, max);
  try {
    const shape: StoredShape = { v: SCHEMA_VERSION, items: next };
    storage.setItem(STORAGE_KEY, JSON.stringify(shape));
  } catch {
    // Storage full or unavailable — see doc comment above.
  }
  return next;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all new tests pass.

- [ ] **Step 5: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add lib/product/recently-viewed.ts lib/product/recently-viewed.test.ts
git commit -m "Add versioned, capped localStorage logic for Recently Viewed"
```

---

### Task 5: `ProductGallery` component

**Files:**
- Create: `components/product/ProductGallery.tsx`

**Interfaces:**
- Consumes: `ProductImage` from `lib/shopify/products.ts` (existing).
- Produces: `ProductGallery` — exported. Task 9 depends on it.

No dedicated test file — matches `ProductCard`/`ProductGrid`'s established precedent (Phase 4: no jsdom/RTL, coverage from `pnpm typecheck`/`pnpm build` plus later E2E reachability).

- [ ] **Step 1: Implement**

Create `components/product/ProductGallery.tsx`:

```tsx
import Image from 'next/image';
import type { ProductImage } from '@/lib/shopify/products';

interface ProductGalleryProps {
  images: ProductImage[];
  productTitle: string;
}

// DESIGN_SYSTEM.md §42-44 — the left, ~60% media column: a vertical stack
// of real product images. No zoom/lightbox this pass — see the design
// spec's Non-Goals (not in ROADMAP.md Phase 5's own checklist). The first
// image gets `priority` — it's the PDP's LCP element.
export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full bg-esque-surface" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {images.map((image, index) => (
        <div key={image.url} className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
          <Image
            src={image.url}
            alt={image.altText ?? productTitle}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/product/ProductGallery.tsx
git commit -m "Add ProductGallery component"
```

---

### Task 6: `SizeGuidePanel` component

**Files:**
- Create: `components/product/SizeGuidePanel.tsx`

**Interfaces:**
- Consumes: `Button` (existing).
- Produces: `SizeGuidePanel` — exported. Task 7 depends on it.

- [ ] **Step 1: Implement**

Create `components/product/SizeGuidePanel.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface SizeGuidePanelProps {
  open: boolean;
  onClose: () => void;
}

const PLACEHOLDER_MEASUREMENTS: [string, string, string][] = [
  ['S', '38', '27'],
  ['M', '40', '28'],
  ['L', '42', '29'],
  ['XL', '44', '30'],
];

// DESIGN_SYSTEM.md §46 — side panel (desktop) / bottom sheet (mobile),
// implemented as ONE native <dialog> whose position switches responsively
// via CSS rather than two separate components. See DECISIONS.md D-027 for
// why this uses the native element instead of FullScreenMenu's hand-rolled
// role="dialog" pattern: showModal() gives focus-trapping, Escape-to-close,
// and a backdrop natively — FullScreenMenu's WebKit-specific workarounds
// (explicit tabIndex, manual focus restore, Strict-Mode-safe open-tracking)
// exist because it hand-builds a *different*, bespoke full-screen
// transition; a plain utility panel doesn't need that bespoke mechanism.
//
// Measurements below are placeholder content, clearly labeled as such —
// PROJECT.md §101 lists final sizes/measurements as still-open product
// decisions. The panel mechanism is real; the numbers are illustrative.
export function SizeGuidePanel({ open, onClose }: SizeGuidePanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Size Guide"
      className="fixed inset-x-0 bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-full md:w-full md:max-w-md"
    >
      <div className="flex items-center justify-between pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">Size Guide</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="pb-4 text-utility uppercase tracking-metadata text-esque-text-muted">
        ESQUE PLACEHOLDER — MEASUREMENTS
      </p>
      <table className="w-full text-left text-body">
        <thead>
          <tr className="border-b border-esque-text-muted text-utility uppercase tracking-metadata text-esque-text-secondary">
            <th scope="col" className="py-2">
              Size
            </th>
            <th scope="col" className="py-2">
              Chest (in)
            </th>
            <th scope="col" className="py-2">
              Length (in)
            </th>
          </tr>
        </thead>
        <tbody>
          {PLACEHOLDER_MEASUREMENTS.map(([size, chest, length]) => (
            <tr key={size} className="border-b border-esque-elevated">
              <td className="py-2">{size}</td>
              <td className="py-2">{chest}</td>
              <td className="py-2">{length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </dialog>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/product/SizeGuidePanel.tsx
git commit -m "Add SizeGuidePanel: native dialog, side panel / bottom sheet"
```

---

### Task 7: `ProductPurchasePanel` component

**Files:**
- Create: `components/product/ProductPurchasePanel.tsx`

**Interfaces:**
- Consumes: `lib/product/variants.ts` (Task 2), `lib/product/scarcity.ts` (Task 3), `SizeGuidePanel` (Task 6), `Button`/`Input` (existing), `ProductOption`/`ProductVariant` (Task 1).
- Produces: `ProductPurchasePanel` — exported. Task 9 depends on it.

- [ ] **Step 1: Implement**

Create `components/product/ProductPurchasePanel.tsx`:

```tsx
'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SizeGuidePanel } from '@/components/product/SizeGuidePanel';
import { getScarcityLabel, getScarcityStatus } from '@/lib/product/scarcity';
import {
  findMatchingVariant,
  getInitialSelections,
  isOptionValueAvailable,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';
import type { ProductOption, ProductVariant } from '@/lib/shopify/products';

interface ProductPurchasePanelProps {
  title: string;
  minPrice: { amount: string; currencyCode: string };
  options: ProductOption[];
  variants: ProductVariant[];
  // Server-rendered, static description — passed as children (composition,
  // not a string prop) so it stays zero-JS even though it renders inside
  // this client boundary. See the design spec's Component breakdown.
  children?: ReactNode;
}

function formatPrice(price: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode,
  }).format(Number(price.amount));
}

// DESIGN_SYSTEM.md §42-45 — the sticky right column: name, price (reflects
// the matched variant once fully selected, otherwise the product's
// minPrice), scarcity, size/color selection, quantity, Add to Bag. See
// DECISIONS.md D-027 (native radio groups) and D-029 (Add to Bag is a
// real, disabled-until-valid button whose click handler is a deliberate
// no-op — no cart exists yet — matching Header.tsx's existing
// SEARCH/ACCOUNT/BAG onClick={() => {}} precedent, not a new pattern).
export function ProductPurchasePanel({
  title,
  minPrice,
  options,
  variants,
  children,
}: ProductPurchasePanelProps) {
  const [selections, setSelections] = useState<OptionSelections>(() => getInitialSelections(options));
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const soldOut = isProductSoldOut(variants);
  const matchedVariant = findMatchingVariant(variants, selections);
  const selectionComplete = isSelectionComplete(options, selections);
  const displayPrice = matchedVariant?.price ?? minPrice;
  const scarcityLabel = matchedVariant
    ? getScarcityLabel(getScarcityStatus(matchedVariant.quantityAvailable, matchedVariant.availableForSale))
    : null;
  const canAddToBag = !soldOut && matchedVariant !== null && matchedVariant.availableForSale;

  function handleOptionChange(optionName: string, value: string) {
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  }

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-[88px] lg:self-start">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-heading-1 uppercase tracking-display text-esque-text">{title}</h1>
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

      {!soldOut &&
        options.map((option) => (
          <fieldset key={option.id} className="flex flex-col gap-3">
            <legend className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              {option.name}
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const available = isOptionValueAvailable(variants, option.name, value);
                const inputId = `option-${option.id}-${value}`;
                return (
                  <div key={value}>
                    <input
                      type="radio"
                      id={inputId}
                      name={option.name}
                      value={value}
                      checked={selections[option.name] === value}
                      disabled={!available}
                      onChange={() => handleOptionChange(option.name, value)}
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
            <p className="text-utility text-esque-text-secondary">Select all options to continue.</p>
          )}
        </div>
      )}

      <SizeGuidePanel open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/product/ProductPurchasePanel.tsx
git commit -m "Add ProductPurchasePanel: variant selection, scarcity, stubbed Add to Bag"
```

---

### Task 8: `RecentlyViewed` component

**Files:**
- Create: `components/product/RecentlyViewed.tsx`

**Interfaces:**
- Consumes: `lib/product/recently-viewed.ts` (Task 4).
- Produces: `RecentlyViewed` — exported. Task 9 depends on it.

- [ ] **Step 1: Implement**

Create `components/product/RecentlyViewed.tsx`:

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { recordRecentlyViewed, type RecentlyViewedItem } from '@/lib/product/recently-viewed';

interface RecentlyViewedProps {
  handle: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  priceAmount: string;
  priceCurrency: string;
}

function formatPrice(price: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode,
  }).format(Number(price.amount));
}

// DECISIONS.md D-031 — client-only, localStorage-backed, no Shopify
// dependency. Recording "this product was viewed" is a genuine
// synchronization with an external system (localStorage) — exactly what
// an effect is for, not a click-driven update that belongs in a handler.
// Every prop here is a primitive (not a nested object) specifically so
// this effect's dependency array can be fully exhaustive with no
// suppression — see the design spec.
//
// Renders nothing before the effect runs (server render and the first
// client render both start from an empty list — no hydration mismatch)
// and nothing at all if the list ends up empty (no CONTENT.md copy exists
// for this empty case, so none is invented).
export function RecentlyViewed({
  handle,
  title,
  imageUrl,
  imageAlt,
  priceAmount,
  priceCurrency,
}: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const updated = recordRecentlyViewed(window.localStorage, {
      handle,
      title,
      imageUrl,
      imageAlt,
      minPrice: { amount: priceAmount, currencyCode: priceCurrency },
    });
    setItems(updated.filter((item) => item.handle !== handle));
  }, [handle, title, imageUrl, imageAlt, priceAmount, priceCurrency]);

  if (items.length === 0) return null;

  return (
    <section aria-label="Recently Viewed" className="flex flex-col gap-4">
      <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        Recently Viewed
      </h2>
      <div className="flex gap-4 overflow-x-auto">
        {items.map((item) => (
          <Link
            key={item.handle}
            href={`/products/${item.handle}`}
            className="flex w-40 shrink-0 flex-col gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt ?? item.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              )}
            </div>
            <p className="text-product-name text-esque-text">{item.title}</p>
            <p className="text-utility text-esque-text-secondary">{formatPrice(item.minPrice)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/product/RecentlyViewed.tsx
git commit -m "Add RecentlyViewed component"
```

---

### Task 9: `ProductDetail` component and the `/products/[handle]` route

**Files:**
- Create: `components/product/ProductDetail.tsx`
- Create: `app/(storefront)/products/[handle]/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1, 5, 7, 8; `ProductGrid` (existing, `components/catalog/`); `buildProductSearchQuery` (existing, `lib/catalog/filters.ts`); `getProduct`/`getProducts` (existing).
- Produces: the real PDP route, replacing what was previously a 404 for every `ProductCard` link.

- [ ] **Step 1: Implement `ProductDetail`**

Create `components/product/ProductDetail.tsx`:

```tsx
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import type { ProductDetail as ProductDetailData, ProductListItem } from '@/lib/shopify/products';

interface ProductDetailProps {
  product: ProductDetailData;
  relatedProducts: ProductListItem[];
}

// DESIGN_SYSTEM.md §42-44 — 60/40 desktop layout (gallery ~58% / purchase
// panel ~42% on the existing 12-column grid, per §15's "based on the grid
// internally" allowance), single column below `lg`. See the design spec's
// Layout section for the exact split and sticky-panel reasoning.
export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  return (
    <div className="flex flex-col gap-16 px-4 py-8 md:px-8 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} productTitle={product.title} />
        </div>
        <div className="lg:col-span-5">
          <ProductPurchasePanel
            title={product.title}
            minPrice={product.minPrice}
            options={product.options}
            variants={product.variants}
          >
            {product.description && (
              <p className="text-body text-esque-text-secondary">{product.description}</p>
            )}
          </ProductPurchasePanel>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section aria-label={`More ${product.productType}`} className="flex flex-col gap-6">
          <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
            More {product.productType}
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}

      <RecentlyViewed
        handle={product.handle}
        title={product.title}
        imageUrl={product.images[0]?.url ?? null}
        imageAlt={product.images[0]?.altText ?? null}
        priceAmount={product.minPrice.amount}
        priceCurrency={product.minPrice.currencyCode}
      />
    </div>
  );
}
```

- [ ] **Step 2: Implement the route**

Create `app/(storefront)/products/[handle]/page.tsx`:

```tsx
import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { buildProductSearchQuery } from '@/lib/catalog/filters';
import { getProduct, getProducts } from '@/lib/shopify/products';

// Request-scoped memoization so generateMetadata and the page component
// (both of which need the same product) issue one Shopify call, not two.
const getCachedProduct = cache(getProduct);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getCachedProduct(handle);
  if (!product) notFound();
  return {
    title: `${product.title} — Esque`,
    description: product.description || `Shop ${product.title} from the current Esque collection.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getCachedProduct(handle);
  if (!product) notFound();

  // Genuinely sequential — needs product.productType, so this cannot run
  // in parallel with the product fetch above; not the kind of avoidable
  // waterfall the async-parallel guidance warns against.
  const { products: sameType } = await getProducts({
    query: buildProductSearchQuery({ productTypes: [product.productType] }),
    first: 5,
  });

  return (
    <ProductDetail
      product={product}
      relatedProducts={sameType.filter((item) => item.handle !== product.handle).slice(0, 4)}
    />
  );
}
```

- [ ] **Step 3: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/product/ProductDetail.tsx "app/(storefront)/products/[handle]/page.tsx"
git commit -m "Wire the real /products/[handle] route"
```

---

### Task 10: E2E coverage for the PDP route

**Files:**
- Create: `tests/e2e/pdp.spec.ts`

- [ ] **Step 1: Implement**

Create `tests/e2e/pdp.spec.ts`, mirroring `tests/e2e/catalog.spec.ts`'s exact structure and honest-limitation framing:

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally
// unset in this E2E environment (playwright.config.ts's webServer.env) —
// every request below hits a genuinely unconfigured Shopify client. This
// is the honest limit of what's E2E-verifiable without a real store — see
// the design spec's Testing section: the not-found path, metadata, and
// every interactive behavior (selection, scarcity, related, recently-
// viewed) all require a real product fetch to succeed first, which an
// unconfigured client can never do. Mirrors catalog.spec.ts's identical
// constraint.
test.describe('product route — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/products/any-handle');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e`
Expected: passes (Shopify is unconfigured in this environment, so the error boundary renders as asserted — no red/green cycle here since the behavior already exists via `app/error.tsx`; this test is new coverage of an existing, already-correct boundary, not new application behavior).

- [ ] **Step 3: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add tests/e2e/pdp.spec.ts
git commit -m "Add E2E coverage for the PDP route's honest-failure path"
```

---

### Task 11: Documentation — DECISIONS.md, ROADMAP.md, ARCHITECTURE.md

**Files:**
- Modify: `DECISIONS.md` (append D-027 through D-031)
- Modify: `ROADMAP.md` (Phase 5 checkboxes)
- Modify: `ARCHITECTURE.md` (§3 repo structure — note `components/catalog/`/`components/product/` as what actually exists, replacing the never-adopted `components/commerce/` sketch)

- [ ] **Step 1: DECISIONS.md**

Append five entries (D-027–D-031) per the design spec's "New Architectural Decisions to Record" section — one entry per topic (dialog/radio-group choice; scarcity thresholds; Quick Add scoping; related/complete-the-look/non-goals bundle; recently-viewed storage design), each citing the specific `PROJECT.md`/`DESIGN_SYSTEM.md`/prior-`DECISIONS.md` sections it draws on, matching this file's existing citation style exactly.

- [ ] **Step 2: ROADMAP.md**

Update Phase 5:

```markdown
## Phase 5 — Product Detail Page

- [x] PDP layout (60/40 media/info split)
- [x] Size/color selection, size guide — generic, data-driven selector (native radio groups, D-010 focus rings) against real `product.options`/`variants`; Size Guide is a real native-`<dialog>` panel with clearly-labeled placeholder measurements (final sizes are still an open product decision — see PROJECT.md §101)
- [~] Quick Add (desktop overlay + mobile bottom sheet) — the underlying variant-selection mechanism is built in full (above) and directly reusable; the on-grid entry point itself is deferred — see DECISIONS.md D-029
- [~] Scarcity UI (low stock / final pieces — real inventory only) — real, fixture-tested display-tier logic against Shopify's actual `quantityAvailable`; renders nothing when the count is unknown rather than fabricating one — see DECISIONS.md D-028
- [~] Related products / Complete the Look / Recently viewed — Related Products (mechanically derived, same product type) and Recently Viewed (versioned localStorage) built; Complete the Look deferred (needs real curatorial outfit-pairing data) — see DECISIONS.md D-030
```

- [ ] **Step 3: ARCHITECTURE.md**

In §3's repo structure sketch, replace the `commerce/` line (which the actual codebase never adopted — Phase 4 already put product-card/grid under `catalog/` instead) with what actually exists:

```
│   ├── catalog/                # Category listing: product card, grid, filters
│   ├── product/                # PDP: gallery, purchase panel, size guide, recently viewed
```

Add a one-line note (matching this document's existing footnote style, e.g. the D-008-referencing note already present elsewhere) that `components/commerce/` as originally sketched was never adopted — Phase 4 and Phase 5 grouped by page-type (`catalog/`, `product/`) instead.

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add DECISIONS.md ROADMAP.md ARCHITECTURE.md
git commit -m "Record D-027-D-031; mark Phase 5's completed and narrowed items"
```

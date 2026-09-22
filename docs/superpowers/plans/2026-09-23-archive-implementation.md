# Archive Foundation Implementation Plan

Full design reasoning: `docs/superpowers/specs/2026-09-23-archive-design.md`. Read it first — this plan assumes its decisions.

## Global Constraints

- No real Shopify store exists in this dev/CI environment. `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_API_TOKEN` are unset. Every real-path E2E test for these two new routes will hit the generic error boundary (`SOMETHING WENT WRONG.`) — this is expected and correct, matching `catalog.spec.ts`/`pdp.spec.ts`. Do not try to make it show real content in the committed E2E suite.
- `PREVIEW_DEMO_MODE=1` is the only way to see the populated path locally. It is never set in `playwright.config.ts`/CI — do not add it there.
- Follow existing patterns exactly where one exists (cited per task below). Do not invent a new pattern for a solved problem.
- Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` after every task; fix before moving on.

## Task 1: Extend `getProductsByCollection` with `description`

**Files:** `lib/shopify/queries/products.ts`, `lib/shopify/products.ts`, `lib/shopify/products.test.ts`.

1. In `GET_PRODUCTS_BY_COLLECTION_QUERY` (`lib/shopify/queries/products.ts`), add `description` as a field on the product node (alongside `productType`, before or after `tags` — match existing field ordering style).
2. In `lib/shopify/products.ts`: add `description: string;` to the `ProductSummary` interface. In `getProductsByCollection`'s mapping, add `description: node.description,`.
3. Run `pnpm graphql-codegen`. Confirm it completes without error and `git diff --stat` shows changes only to `lib/shopify/storefront.generated.d.ts`/`lib/shopify/storefront.types.d.ts` (plus the two files you just edited) — no other file should be touched by codegen.
4. Update `lib/shopify/products.test.ts`'s existing `getProductsByCollection` describe block: add `description: 'A description.'` (or similar) to the mocked GraphQL response's node and to the expected `toEqual` result in the "maps a page of products" test. The other three tests in that block (null handle, throws-on-errors, throws-on-unconfigured) need no change.
5. `pnpm typecheck && pnpm test:unit` — confirm this one file's tests pass before moving on.

## Task 2: Demo Mode fixtures for collections

**Files:** `lib/shopify/preview-demo-fixtures.ts`, `lib/shopify/preview-demo-fixtures.test.ts`.

1. Add `import type { CollectionDetail, CollectionSummary } from '@/lib/shopify/collections';` and `import type { ProductSummary } from '@/lib/shopify/products';` (type-only — mirrors this file's existing `import type { ProductDetail, ProductListItem }` pattern; safe despite `lib/shopify/collections.ts` importing values from this file in Task 3, since type-only imports are erased at compile time — this exact circular shape already exists today between this file and `lib/shopify/products.ts`).
2. Extract the existing inline description string in `getPreviewProductDetail` ("Temporary preview placeholder description (free-license stock photography, not final product copy).") into a module-level `const PREVIEW_DESCRIPTION = '...'` and use it at both the existing call site and the new one below (Task 2.4). Small DRY cleanup, not a behavior change.
3. Add:
   ```ts
   export const PREVIEW_COLLECTIONS: CollectionSummary[] = [
     { id: 'preview-collection-current', handle: 'collection-001', title: 'Collection 001', dropStatus: 'active' },
     { id: 'preview-collection-archived', handle: 'collection-000', title: 'Collection 000', dropStatus: 'archived' },
   ];

   const PREVIEW_ARCHIVE_PRODUCTS: ProductSummary[] = [
     {
       id: 'preview-archive-1',
       handle: 'preview-structured-wool-coat',
       title: 'Structured Wool Coat',
       productType: 'Jackets',
       tags: [],
       minPrice: { amount: '312.00', currencyCode: 'USD' },
       description: PREVIEW_DESCRIPTION,
       image: IMG('product-1.jpg', 900, 1125),
     },
     {
       id: 'preview-archive-2',
       handle: 'preview-ribbed-turtleneck',
       title: 'Ribbed Turtleneck',
       productType: 'Sweaters',
       tags: [],
       minPrice: { amount: '118.00', currencyCode: 'USD' },
       description: PREVIEW_DESCRIPTION,
       image: IMG('product-2.jpg', 900, 1125),
     },
   ];
   ```
   Real product types from PROJECT.md §9's taxonomy (Jackets, Sweaters) — not invented categories.
4. Add:
   ```ts
   export function getPreviewCollectionDetail(handle: string): CollectionDetail | null {
     if (handle === 'collection-001') {
       return {
         id: 'preview-collection-current',
         handle: 'collection-001',
         title: 'Collection 001',
         description: 'The current Esque collection — available while it lasts.',
         dropStatus: 'active',
         dropDate: null,
         archivedAt: null,
         products: PREVIEW_PRODUCTS.map((p) => ({ id: p.id, handle: p.handle, title: p.title })),
         hasNextPage: false,
         endCursor: null,
       };
     }
     if (handle === 'collection-000') {
       return {
         id: 'preview-collection-archived',
         handle: 'collection-000',
         title: 'Collection 000',
         description: 'The collection that came before. No longer available.',
         dropStatus: 'archived',
         dropDate: null,
         archivedAt: '2026-06-01T00:00:00Z',
         products: PREVIEW_ARCHIVE_PRODUCTS.map((p) => ({ id: p.id, handle: p.handle, title: p.title })),
         hasNextPage: false,
         endCursor: null,
       };
     }
     return null;
   }

   export function getPreviewProductsByCollection(handle: string): ProductSummary[] | null {
     if (handle === 'collection-001') {
       return PREVIEW_PRODUCTS.map((p) => ({
         id: p.id,
         handle: p.handle,
         title: p.title,
         productType: p.productType,
         tags: p.tags,
         minPrice: p.minPrice,
         description: PREVIEW_DESCRIPTION,
         image: p.images[0] ?? null,
       }));
     }
     if (handle === 'collection-000') return PREVIEW_ARCHIVE_PRODUCTS;
     return null;
   }
   ```
   Doc-comment both new functions the way `getPreviewProductDetail` is already documented (what they're for, null-on-unrecognized mirrors the real not-found contract).
5. Add tests to `lib/shopify/preview-demo-fixtures.test.ts` mirroring its existing style: `getPreviewCollectionDetail` returns the archived detail for `'collection-000'`, the current (non-archived) detail for `'collection-001'`, and `null` for an unrecognized handle; `getPreviewProductsByCollection` returns the two archive fixtures for `'collection-000'`, the mapped launch products for `'collection-001'`, and `null` otherwise. Also assert `PREVIEW_COLLECTIONS` has unique handles and exactly one archived entry (structural invariant, mirroring this file's existing `PREVIEW_PRODUCTS` invariant tests).

## Task 3: Demo Mode wiring in `lib/shopify/collections.ts` and `getProductsByCollection`

**Files:** `lib/shopify/collections.ts`, `lib/shopify/collections.test.ts`, `lib/shopify/products.ts` (the `getProductsByCollection` function only), `lib/shopify/products.test.ts`.

1. In `lib/shopify/collections.ts`, add the Demo Mode import (mirroring `lib/shopify/products.ts`'s exact existing import-and-comment style) and short-circuits as the *first statement* of `getCollection` and `getCollections`:
   ```ts
   if (process.env.PREVIEW_DEMO_MODE === '1') return getPreviewCollectionDetail(handle);
   ```
   ```ts
   if (process.env.PREVIEW_DEMO_MODE === '1') {
     return { collections: PREVIEW_COLLECTIONS.slice(0, first), hasNextPage: false, endCursor: null };
   }
   ```
   Neither branch may call `getStorefrontClient()`.
2. In `lib/shopify/products.ts`'s `getProductsByCollection`, add the equivalent short-circuit as the first statement:
   ```ts
   if (process.env.PREVIEW_DEMO_MODE === '1') {
     const products = getPreviewProductsByCollection(handle);
     if (!products) return null;
     return { products, hasNextPage: false, endCursor: null };
   }
   ```
   (Add `getPreviewProductsByCollection` to this file's existing Demo Mode import line.)
3. Add Demo Mode `describe` blocks to `lib/shopify/collections.test.ts` and to `lib/shopify/products.test.ts`'s `getProductsByCollection` section, mirroring `lib/shopify/products.test.ts`'s existing `describe('getProduct — Demo Mode', ...)`/`describe('getProducts — Demo Mode', ...)` style exactly: set `process.env.PREVIEW_DEMO_MODE = '1'` (and restore it), assert `getStorefrontClient` is never called (spy + call-count check, matching the existing convention), assert correct fixture data is returned for known handles and `null`/empty for unknown ones.
4. `pnpm test:unit` — full suite green before continuing.

## Task 4: `lib/archive/collections.ts` (new)

**Files:** `lib/archive/collections.ts`, `lib/archive/collections.test.ts`.

Implement exactly as specified in the design doc's Architecture section: `isCollectionArchived` (pure, case-insensitive `dropStatus` check OR `archivedAt !== null`), `getArchivedCollections(first = 20)` (filters, does not catch), `getArchivedCollection(handle)` (returns `null` for not-found OR not-archived, does not catch). Doc-comment each function's contract, referencing the design doc's reasoning for why this does NOT swallow errors (contrast with `lib/home/selected-pieces.ts`'s D-033 exception — cite it and explain why the same exception doesn't apply here).

Unit tests (mock `lib/shopify/collections`'s `getCollection`/`getCollections` via `vi.spyOn`, mirroring `lib/home/selected-pieces.test.ts`'s exact mocking style for `lib/shopify/products`):
- `isCollectionArchived`: true for `dropStatus: 'archived'`, true for `dropStatus: 'Archived'` (case-insensitive), true for `archivedAt` set with `dropStatus: null`, false for `dropStatus: 'active'` with `archivedAt: null`, false when both are `null`.
- `getArchivedCollections`: filters a mixed list down to only archived entries; returns `[]` when none are archived; propagates (does not catch) a rejection from `getCollections`.
- `getArchivedCollection`: returns the detail for an archived handle; returns `null` for a handle `getCollection` resolves to `null`; returns `null` for a handle that resolves to a real, non-archived collection; propagates (does not catch) a rejection from `getCollection`.

## Task 5: `components/archive/ArchivedProductTile.tsx` (new)

Implement exactly as specified in the design doc (non-interactive `<article>`, reused `ProductCard` image-container/title classNames, `UNAVAILABLE` paragraph reusing `ProductPurchasePanel`'s exact sold-out-paragraph classNames). Props: `{ product: ProductSummary }`. No `Link`, no `data-cursor`, no click handler of any kind.

## Task 6: `components/archive/ArchivedCollectionView.tsx` (new)

Presentational Server Component. Props: `{ collection: CollectionDetail; products: ProductSummary[] }`.

- A small back-link to `/archive`, styled like `CategoryListing`'s existing "Clear Filters" link (`text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text`), text `ARCHIVE`.
- `<h1>` with `collection.title`, styled like `CategoryListing`'s `<h1>` (`font-display text-display-l uppercase tracking-display text-esque-text`).
- `collection.description`, if non-empty, as a `<p className="max-w-2xl text-body text-esque-text-secondary">`.
- If `products.length === 0`: reuse `CategoryListing`'s exact "no active filters" empty-state markup/copy (`NOTHING HERE YET.`, `font-display text-heading-3 uppercase tracking-display text-esque-text`) — a genuinely unlikely edge case (an archived collection with zero products), handled honestly rather than left to render an empty grid.
- Else: a plain, uniform grid — mirror `WishlistView.tsx`'s exact grid shape (`grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8`, each cell `col-span-2 md:col-span-2 lg:col-span-3`) — deliberately NOT `ProductGrid`'s featured/standard alternation (design doc: this is a historical record, not discovery browsing). Each cell renders `<ArchivedProductTile product={product} />`.

## Task 7: `components/archive/ArchiveIndex.tsx` (new)

Async Server Component (like `CategoryListing`), no props. Fetches `getArchivedCollections()`. Renders:
- `<JsonLd data={buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Archive', path: '/archive' }])} />`
- `<h1>ARCHIVE</h1>` (`font-display text-display-l uppercase tracking-display text-esque-text`, matching `CategoryListing`'s `<h1>` treatment).
- If empty: CONTENT.md §7's exact copy `THE ARCHIVE BEGINS HERE.`, styled like `WishlistView`'s empty state (`font-display text-heading-3 uppercase tracking-display text-esque-text`).
- Else: a plain `<ul>` of `<Link href={`/archive/${c.handle}`}>{c.title}</Link>` per archived collection, in the order `getArchivedCollections` returns them (no re-sort). Each link reasonably prominent (e.g. `font-display text-heading-2 uppercase tracking-display text-esque-text hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text`) — a judgment call, not a quoted spec value; keep it consistent with this codebase's existing type-scale tokens (DESIGN_SYSTEM.md §9), don't invent a new size.

## Task 8: Routes

**`app/(storefront)/archive/page.tsx` (new):**
```tsx
import type { Metadata } from 'next';
import { ArchiveIndex } from '@/components/archive/ArchiveIndex';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Archive — Esque',
  description: 'Past Esque collections.',
  path: '/archive',
});

// See docs/superpowers/specs/2026-09-23-archive-design.md's "Build-time
// safety" section: without this, Next.js would try to statically prerender
// this page at build time (no searchParams/dynamic segment to force
// per-request rendering the way category pages get it for free), which
// would call getArchivedCollections() — and, deliberately, this route does
// NOT swallow its Shopify error the way getSelectedPieces does — during
// `pnpm build` itself. In this dev/CI environment (Shopify unconfigured),
// that throws, which would fail the production build rather than correctly
// deferring the failure to a runtime error boundary. This makes per-request
// rendering explicit, matching category pages' real, already-proven-safe
// behavior.
export const dynamic = 'force-dynamic';

export default function ArchivePage() {
  return <ArchiveIndex />;
}
```

**`app/(storefront)/archive/[handle]/page.tsx` (new)** — mirrors `app/(storefront)/products/[handle]/page.tsx`'s exact shape:
```tsx
import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchivedCollectionView } from '@/components/archive/ArchivedCollectionView';
import { getArchivedCollection } from '@/lib/archive/collections';
import { getProductsByCollection } from '@/lib/shopify/products';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbJsonLd } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';

const getCachedArchivedCollection = cache(getArchivedCollection);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCachedArchivedCollection(handle);
  if (!collection) notFound();
  return buildPageMetadata({
    title: `${collection.title} — Archive — Esque`,
    description: collection.description || `${collection.title}, a past Esque collection.`,
    path: `/archive/${handle}`,
  });
}

export default async function ArchivedCollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const collection = await getCachedArchivedCollection(handle);
  if (!collection) notFound();

  const result = await getProductsByCollection(handle);
  const products = result?.products ?? [];

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Archive', path: '/archive' },
          { name: collection.title, path: `/archive/${handle}` },
        ])}
      />
      <ArchivedCollectionView collection={collection} products={products} />
    </>
  );
}
```
No `dynamic` export needed — a dynamic segment with no `generateStaticParams` is already dynamically rendered by default (confirmed precedent: `/products/[handle]` has none either).

## Task 9: Navigation — Footer

**File:** `components/navigation/Footer.tsx`.

Add `<Link href="/archive" className="inline-block py-2 hover:text-esque-text">Archive</Link>` inside the existing `<nav aria-label="Shopping">`, alongside the Wishlist link. Do not touch the "Legal and support" nav, do not add a new landmark, do not rename the "Shopping" label.

## Task 10: SEO — sitemap

**File:** `app/sitemap.ts`.

Add `'/archive'` to the `paths` array (alongside `'/'`, `...categoryPaths`, `...legalPaths`, `'/contact'`). Do not add `/archive/[handle]` entries — no enumerable real handles exist (same class of limitation as `/products/[handle]`).

## Task 11: `tests/e2e/archive.spec.ts` (new)

Mirror `tests/e2e/catalog.spec.ts`'s/`tests/e2e/pdp.spec.ts`'s exact structure and header comment style (access cookie in `beforeEach`, explanatory comment about the unconfigured-Shopify environment).

```ts
test.describe('archive index — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });

  test('has a real, on-brand <title>, independent of the Shopify call failing', async ({ page }) => {
    await page.goto('/archive');
    await expect(page).toHaveTitle(/archive/i);
  });
});

test.describe('archived collection route — reachable and fails honestly without a configured store', () => {
  test('surfaces the error boundary rather than crashing uncleanly', async ({ page }) => {
    await page.goto('/archive/any-handle');
    await expect(page.getByRole('heading', { name: 'SOMETHING WENT WRONG.' })).toBeVisible();
  });
});

test.describe('sitemap', () => {
  test('sitemap.xml lists /archive', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('/archive');
  });
});
```

## Task 12: `tests/e2e/smoke.spec.ts` (edit)

1. Footer link-enumeration test: add `await expect(footer.getByRole('link', { name: 'Archive' })).toBeVisible();`.
2. The "navigates to a real page, not a 404" `for` loop: add `['Archive', '/archive']` to the array.

## Task 13: ARCHITECTURE.md note

Append a short paragraph to §3's existing running-commentary block, in the same style as the `lib/interactive-model/`/`lib/motion/` divergence notes already there: `lib/archive/`/`components/archive/` is a new top-level domain (Phase 11), following the same one-level-deeper convention `lib/interactive-model/` established — an isolated Shopify dependency (`getArchivedCollections`/`getArchivedCollection`, mirroring `lib/home/selected-pieces.ts`'s shape) plus presentational components, rather than nesting under an existing domain.

## Task 14: Live verification (do this yourself before reporting back)

1. `pnpm build` in this repo's actual environment (Shopify unconfigured, `PREVIEW_DEMO_MODE` unset) — must succeed. This is the load-bearing check for the `force-dynamic` reasoning in Task 8; if the build fails or behaves unexpectedly, stop and re-examine that decision rather than pushing forward.
2. Start `PREVIEW_DEMO_MODE=1 pnpm dev` (or `build && start`) and, using a bot-classified `curl` user agent (matching this codebase's established D-054 technique for bypassing the access gate without a real login flow):
   - `curl` `/archive` — confirm it lists "Collection 000" (or whatever title you used) and does NOT list "Collection 001".
   - `curl` `/archive/collection-000` — confirm both fixture products render with imagery and the literal text `UNAVAILABLE`, and confirm `collection-001`'s (current) products are absent.
   - `curl` `/archive/collection-001` — confirm it renders the branded `THIS PIECE DOESN'T EXIST.` 404 UI (not the archived treatment) — this is the single most important correctness check in this whole feature: a current, purchasable collection must never render with a fabricated `UNAVAILABLE` state.
   - `curl` `/archive/not-a-real-handle` — confirm the same 404 UI.
3. Stop the Demo Mode server. Confirm `.env.local`/`playwright.config.ts`/`.github/workflows/ci.yml` are unmodified by this check (`git status --short`).

## Task 15: Self-check before handing back

- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit` all pass.
- `pnpm exec playwright test` passes (expect the two new `archive.spec.ts` describe blocks and the extended `smoke.spec.ts` assertions to pass; do not expect populated-state coverage — that's Task 14, not committed).
- `pnpm build` succeeds.
- `git status --short` — confirm no stray fixture-probe files, no `.env.local` changes, no unrelated files touched.
- Report back: every file created/changed, the live-verification results from Task 14 (exact commands and what you observed — not just "it worked"), and anything you found that contradicts the design doc's assumptions (in particular: did `force-dynamic` turn out to be necessary, or did you discover the build behaves differently than predicted? Report the actual, measured outcome).

Do not write DECISIONS.md, ROADMAP.md, or commit — the engineering lead handles integration, review, DECISIONS.md, ROADMAP.md, and the commit.

# Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ROADMAP.md Phase 7 (Homepage), narrowed per the design spec: real, finished builds for Scenes 03/05/06 (no creative-asset dependency), a real Shopify-backed mechanism with honest placeholder photography for Scene 04, a real structural placeholder for Scene 02 (Phase 8's feature), and Scene 01 built with real structure around two clearly-labeled placeholder content slots. Scene 07 is omitted. The homepage ships as pure Server Components — its one Shopify dependency (Scene 04) is isolated so a Shopify failure never takes the other six scenes down with it.

**Architecture:** Six new Server Components under `components/home/` (parallel to `components/catalog/`/`components/product/`), assembled by `app/(storefront)/page.tsx`. One new pure module, `lib/home/selected-pieces.ts`, wraps the page's only Shopify call in a try/catch. One small, additive, backward-compatible prop on the existing `ProductCard`. No new client components, no new dependencies.

**Tech Stack:** No new dependencies. Reuses `next/link`, `next/image` (via the existing `ProductCard`), `lib/catalog/taxonomy.ts`'s `getCategoryLabel`, `lib/shopify/products.ts`'s `getProducts`, and the project's established CSS entrance-animation technique (`app/globals.css`).

**Spec:** `docs/superpowers/specs/2026-09-06-homepage-design.md` — read it in full before starting; this plan assumes its Architecture/Non-Goals/New-Decisions sections as given and doesn't re-justify them.

## Global Constraints

- TypeScript strict mode stays on; no `@ts-ignore`/`@ts-nocheck`/`any`.
- pnpm only.
- No jsdom/React Testing Library — the one piece of real logic (`lib/home/selected-pieces.ts`) is a pure-ish async function, unit-tested directly by mocking `getProducts`; every component stays a thin, untested-at-the-unit-level presentational layer, matching every prior phase's precedent.
- No new client components (`'use client'`) — every scene this phase is a Server Component. Do not add motion/parallax/scroll-tracking JS; that's ROADMAP.md Phase 9's.
- Do not modify `lib/catalog/*`, `lib/product/*`, `lib/shopify/*` (other than reading `getProducts`), `components/catalog/ProductGrid.tsx`, `components/catalog/FilterBar.tsx`, `components/product/*`, or any access-gate/PDP/category-page file. This pass only touches `components/catalog/ProductCard.tsx` (one additive prop), adds `components/home/`, `lib/home/`, rewrites `app/(storefront)/page.tsx`, and adds a small CSS block to `app/globals.css`.
- Do not modify `CLAUDE.md` under any circumstance.
- After **every** task: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm build` — fix any failure the task caused before moving on, then commit.
- Record DECISIONS.md D-032/D-033 and update ROADMAP.md Phase 7 exactly as specified in Task 10 — not deferred past it.
- Commit trailer on every commit: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Push to `main` after every commit.

---

### Task 1: Selected Pieces data isolation (`lib/home/selected-pieces.ts`)

**Files:**
- Create: `lib/home/selected-pieces.ts`
- Create: `lib/home/selected-pieces.test.ts`

**Interfaces:**
- Consumes: `getProducts`, `ProductListItem` from `lib/shopify/products.ts` (existing).
- Produces: `getSelectedPieces` — exported. Task 8 (page wiring) depends on it.

- [ ] **Step 1: Write the failing test**

Create `lib/home/selected-pieces.test.ts`:

```typescript
import { describe, expect, test, vi } from 'vitest';
import { getSelectedPieces } from '@/lib/home/selected-pieces';
import * as productsModule from '@/lib/shopify/products';

const FIXTURE_PRODUCT = {
  id: 'gid://shopify/Product/1',
  handle: 'hoodie-01',
  title: 'Hoodie 01',
  productType: 'Hoodies',
  tags: [],
  minPrice: { amount: '180.00', currencyCode: 'USD' },
  availableForSale: true,
  images: [],
};

describe('getSelectedPieces', () => {
  test('returns the products getProducts resolves', async () => {
    vi.spyOn(productsModule, 'getProducts').mockResolvedValue({
      products: [FIXTURE_PRODUCT],
      hasNextPage: false,
      endCursor: null,
    });

    const result = await getSelectedPieces();
    expect(result).toEqual([FIXTURE_PRODUCT]);
  });

  test('requests the given limit as `first`, defaulting to 3', async () => {
    const getProducts = vi
      .spyOn(productsModule, 'getProducts')
      .mockResolvedValue({ products: [], hasNextPage: false, endCursor: null });

    await getSelectedPieces();
    expect(getProducts).toHaveBeenCalledWith({ first: 3 });

    await getSelectedPieces(4);
    expect(getProducts).toHaveBeenCalledWith({ first: 4 });
  });

  test('resolves to an empty list, not a throw, when getProducts rejects', async () => {
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(
      new Error('Shopify Storefront API is not configured.'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getSelectedPieces()).resolves.toEqual([]);
  });

  test('logs the failure so it stays operationally visible', async () => {
    const error = new Error('Throttled by Shopify');
    vi.spyOn(productsModule, 'getProducts').mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await getSelectedPieces();

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Selected Pieces'), error);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/home/selected-pieces.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/home/selected-pieces.ts`:

```typescript
import { getProducts, type ProductListItem } from '@/lib/shopify/products';

const SELECTED_PIECES_COUNT = 3;

/**
 * Fetches products for the homepage's Selected Pieces scene (DESIGN_SYSTEM.md
 * §33). Isolates the homepage's one Shopify dependency: a thrown error
 * (unconfigured store, throttled request, a malformed query — anything
 * getProducts itself correctly throws on rather than swallowing) resolves
 * to an empty list here instead of propagating to app/error.tsx. This is a
 * deliberate, narrow exception to this codebase's usual "never swallow a
 * real Shopify error" rule (see lib/shopify/products.ts, lib/product/*.ts):
 * PROJECT.md §22 frames the homepage as primarily a brand-world experience,
 * not a catalog, and six of its seven scenes have no Shopify dependency at
 * all — a transient Shopify failure must not take Collection Statement,
 * Categories, or Drop Status down with it. See DECISIONS.md D-033. Logs so
 * the failure stays operationally visible even though the page degrades
 * gracefully — no availability filtering: PROJECT.md §40 requires sold-out
 * products to remain visible, not hidden, so a sold-out piece may still be
 * "selected"; ProductCard's existing SOLD OUT badge already handles that.
 */
export async function getSelectedPieces(
  limit = SELECTED_PIECES_COUNT,
): Promise<ProductListItem[]> {
  try {
    const { products } = await getProducts({ first: limit });
    return products;
  } catch (error) {
    console.error('[home] Selected Pieces: Shopify fetch failed, omitting the section.', error);
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
git add lib/home/selected-pieces.ts lib/home/selected-pieces.test.ts
git commit -m "Add Shopify-isolated data fetch for the homepage's Selected Pieces scene"
git push
```

---

### Task 2: `CollectionHero` component (Scene 01)

**Files:**
- Create: `components/home/CollectionHero.tsx`
- Modify: `app/globals.css` (add `.esque-hero-reveal`)

**Interfaces:**
- Consumes: nothing.
- Produces: `CollectionHero` — exported. Task 8 depends on it.

No dedicated test file — matches every presentational component's established precedent (no jsdom/RTL; coverage from `pnpm typecheck`/`pnpm build` plus Task 9's E2E).

- [ ] **Step 1: Add the entrance-fade CSS**

In `app/globals.css`, after the existing `esque-access-error-message` block, add:

```css
/* Homepage Hero entrance — DESIGN_SYSTEM.md §28: a quick, one-time reveal
   on first load (well under the ~900ms total budget), not a multi-second
   splash. A plain fade + slight rise, using the same animation-delay +
   `backwards` fill-mode technique as esque-access-error-message above,
   rather than a JS sequence — this is ordinary page-load polish, not the
   cursor-tracked depth/parallax DECISIONS.md D-032 defers to ROADMAP.md
   Phase 9, so it needs no animation library. Applied only to Hero's
   foreground text group (components/home/CollectionHero.tsx) — the
   background layer and the atmospheric ESQUE heading render at full
   opacity immediately so neither can delay this page's LCP paint.
   Already covered by the sitewide prefers-reduced-motion rule above
   (zeroes animation-duration), no separate handling needed. */
@keyframes esque-hero-reveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.esque-hero-reveal {
  animation: esque-hero-reveal 500ms var(--ease-esque) backwards;
}
```

- [ ] **Step 2: Implement the component**

Create `components/home/CollectionHero.tsx`:

```tsx
import Link from 'next/link';

// DESIGN_SYSTEM.md §27-28, PROJECT.md §23 Scene 01 — full-viewport
// collection hero. Real structure and copy slots; two pieces of content
// are clearly-labeled placeholders per DESIGN_SYSTEM.md §65's convention,
// pending real assets PROJECT.md §101 lists as still open:
//   - collection/campaign imagery — a gradient block stands in for it.
//   - the campaign statement — DESIGN_SYSTEM.md gives no concrete copy for
//     this scene specifically (unlike Scene 03/06), so none is invented.
// Both placeholders are styled exactly like SizeGuidePanel's existing
// "ESQUE PLACEHOLDER — MEASUREMENTS" marker (small, muted, uppercase) —
// deliberately not at display scale, which would read as broken
// production copy rather than an honest, deliberate placeholder.
//
// Cursor-driven depth/parallax between these layers (DESIGN_SYSTEM.md §27,
// INTERACTIONS.md §12) is explicitly owned by ROADMAP.md Phase 9's own
// "Parallax / depth on homepage scenes" line item — not built here. See
// DECISIONS.md D-032.
export function CollectionHero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-esque-black px-4 pb-16 pt-24 md:px-8">
      {/* Placeholder campaign imagery — DESIGN_SYSTEM.md §65. Renders
          immediately (no entrance animation) so it can never delay LCP. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-esque-surface to-esque-black"
      >
        <p className="absolute bottom-4 right-4 text-utility uppercase tracking-metadata text-esque-text-muted">
          ESQUE PLACEHOLDER — CAMPAIGN, HERO
        </p>
      </div>

      {/* Giant atmospheric wordmark — DESIGN_SYSTEM.md §27's "Large ESQUE
          typography may exist partially outside the viewport." Doubles as
          the page's one semantic h1 (a homepage's h1 naming the site
          itself is a common, correct pattern). Low opacity by design —
          WCAG 1.4.3 exempts logo/brand-name text from contrast minimums,
          and the fully-opaque "ESQUE" wordmark already exists in Header on
          every page, including this one; a screen reader announces this
          text normally regardless of its visual opacity. Renders at full
          opacity immediately (no entrance animation) so it can never
          delay LCP. */}
      <h1 className="pointer-events-none absolute -top-[0.05em] -right-[0.05em] select-none font-display text-display-xl leading-none tracking-display text-esque-text/10">
        ESQUE
      </h1>

      <div className="esque-hero-reveal relative flex flex-col gap-3">
        <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
          COLLECTION 001
        </p>
        {/* Campaign statement placeholder — see file header comment. */}
        <p className="text-utility uppercase tracking-metadata text-esque-text-muted">
          ESQUE PLACEHOLDER — CAMPAIGN STATEMENT
        </p>
        {/* DESIGN_SYSTEM.md §27's own literal Scene-01 content list names
            this CTA "ENTER COLLECTION" (no arrow) — distinct from the
            separate "EXPLORE COLLECTION →" phrase (CONTENT.md §10). Links
            to /new: the closest real, working "current collection"
            destination until /collections/[handle] exists (unbuilt per
            ARCHITECTURE.md §3). Hand-styled to match this codebase's
            established "styled Link, not a wrapped Button" pattern for
            navigational CTAs (see FilterBar's Clear Filters, Footer). */}
        <Link
          href="/new"
          className="w-fit text-utility uppercase tracking-nav text-esque-text underline-offset-4 transition-colors duration-200 ease-esque hover:text-esque-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          ENTER COLLECTION
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/home/CollectionHero.tsx app/globals.css
git commit -m "Add CollectionHero component (Scene 01)"
git push
```

---

### Task 3: `InteractiveModelPlaceholder` component (Scene 02)

**Files:**
- Create: `components/home/InteractiveModelPlaceholder.tsx`

No dedicated test file (same precedent as Task 2).

- [ ] **Step 1: Implement**

Create `components/home/InteractiveModelPlaceholder.tsx`:

```tsx
// DESIGN_SYSTEM.md §29-31, PROJECT.md §26-30 — Esque's signature
// Interactive Model. ROADMAP.md Phase 8 owns the real feature in full
// (silhouette hotspots, product info panel, mobile tap behavior, masked-
// luminance highlight motion, Shop the Look) as its own five-stage
// signature feature. This is a clearly-labeled placeholder slot only —
// reserving the scene's place in the homepage's scroll sequence without
// attempting any hotspot/interactivity work here. See DECISIONS.md D-032.
export function InteractiveModelPlaceholder() {
  return (
    <section
      aria-label="Interactive Model"
      className="flex min-h-[80svh] flex-col items-center justify-center gap-4 bg-esque-surface px-4 text-center"
    >
      {/* DESIGN_SYSTEM.md §29's own suggested copy for this scene. */}
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        LOOK 01
      </p>
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

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/home/InteractiveModelPlaceholder.tsx
git commit -m "Add InteractiveModelPlaceholder component (Scene 02)"
git push
```

---

### Task 4: `CollectionStatement` component (Scene 03)

**Files:**
- Create: `components/home/CollectionStatement.tsx`

No dedicated test file (same precedent).

- [ ] **Step 1: Implement**

Create `components/home/CollectionStatement.tsx`:

```tsx
// DESIGN_SYSTEM.md §32 — typography-first editorial statement. Real,
// finished copy: the large statement is DESIGN_SYSTEM.md's own worked
// example for this scene. It is not independently reproduced in
// CONTENT.md's canonical copy list the way Scene 06's Drop Status block
// is — flagged as reasonably real but revisit if official campaign copy
// supersedes it. No imagery this pass: unlike Scenes 01/04, this scene has
// no photography dependency (PROJECT.md §101), so it ships fully resolved
// rather than partially placeholder.
export function CollectionStatement() {
  return (
    <section
      aria-label="Collection Statement"
      className="flex min-h-[60svh] flex-col items-center justify-center gap-6 bg-esque-black px-4 text-center"
    >
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        COLLECTION 001
      </p>
      <h2 className="max-w-4xl font-display text-display-l uppercase leading-none tracking-display text-esque-text">
        NOT MADE TO REMAIN.
      </h2>
    </section>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/home/CollectionStatement.tsx
git commit -m "Add CollectionStatement component (Scene 03)"
git push
```

---

### Task 5: `SelectedPieces` component (Scene 04) and `ProductCard`'s `sizes` override

**Files:**
- Modify: `components/catalog/ProductCard.tsx` (add optional `sizes` prop)
- Create: `components/home/SelectedPieces.tsx`

**Interfaces:**
- Consumes: `ProductListItem` from `lib/shopify/products.ts` (existing), `ProductCard` from `components/catalog/ProductCard.tsx` (existing, extended).
- Produces: `SelectedPieces` — exported. Task 8 depends on it.

No dedicated test file for `SelectedPieces` (same precedent as prior tasks — this component's only real logic, "omit when empty," is a one-line guard clause, not independently complex enough to warrant extraction into a tested pure function the way `getSelectedPieces` was in Task 1).

- [ ] **Step 1: Extend `ProductCard` with an optional `sizes` override**

In `components/catalog/ProductCard.tsx`, update the props interface and the two `<Image>` calls:

```tsx
interface ProductCardProps {
  product: ProductListItem;
  layout: GridItemLayout;
  // Optional override for next/image's `sizes` hint. IMAGE_SIZES[layout]
  // assumes ProductGrid's own periodic column widths; a caller whose card
  // renders at different real widths (e.g. SelectedPieces' curated
  // 2-column composition) passes its own accurate hint here instead of
  // forcing a mismatched fit onto `layout` — which still governs nothing
  // else (SOLD OUT badge, hover crossfade, focus ring are unaffected).
  sizes?: string;
}
```

Change the function signature to destructure `sizes`, and use `sizes ?? IMAGE_SIZES[layout]` for both `<Image>` elements' `sizes` prop:

```tsx
export function ProductCard({ product, layout, sizes }: ProductCardProps) {
  const [primary, secondary] = product.images;
  const sizesAttr = sizes ?? IMAGE_SIZES[layout];

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.altText ?? product.title}
            fill
            sizes={sizesAttr}
            className="object-cover"
          />
        )}
        {secondary && (
          <Image
            src={secondary.url}
            alt=""
            aria-hidden="true"
            fill
            sizes={sizesAttr}
            className="object-cover opacity-0 transition-opacity duration-200 ease-esque group-hover:opacity-100"
          />
        )}
        {!product.availableForSale && (
          <span className="absolute left-3 top-3 bg-esque-black px-2 py-1 text-metadata tracking-metadata text-esque-text">
            SOLD OUT
          </span>
        )}
      </div>
      <p className="text-product-name text-esque-text">{product.title}</p>
    </Link>
  );
}
```

(Everything else in the file — the `IMAGE_SIZES` map, the SOLD OUT badge, the hover crossfade — is unchanged. `ProductGrid.tsx`'s existing call site passes no `sizes`, so its behavior is byte-for-byte unchanged.)

- [ ] **Step 2: Implement `SelectedPieces`**

Create `components/home/SelectedPieces.tsx`:

```tsx
import { ProductCard } from '@/components/catalog/ProductCard';
import type { ProductListItem } from '@/lib/shopify/products';

interface SelectedPiecesProps {
  products: ProductListItem[];
}

// DESIGN_SYSTEM.md §33 — an unconventional, curated composition (one large
// piece + up to two smaller pieces), not the catalog's periodic browsing
// grid (components/catalog/ProductGrid) — a different visual language for
// a different job: a curated homepage moment, not a paginated listing.
//
// Reuses ProductCard as-is: its image+name/no-price/hover-crossfade/
// SOLD-OUT-badge behavior already matches DESIGN_SYSTEM.md §37/§39's
// "Prices hidden until product interaction" exactly, and its graceful
// "no image -> solid surface-color block" fallback already IS this
// scene's honest placeholder-photography treatment (PROJECT.md §101 — no
// real campaign photography exists yet) at zero new code.
//
// Layout: single column below `lg` (every card full width — matching
// ProductDetail's own established "single column below lg" precedent),
// splitting to an 8+4-column composition at `lg` and up. The large card's
// width exactly matches ProductGrid's own "featured" assumption (100vw
// below lg, 67% at lg+), so it needs no sizes override; the smaller cards'
// mobile width (100vw, stacked full-width) does NOT match "standard"'s
// existing 50vw mobile assumption (built for ProductGrid's 2-up mobile
// rhythm), so they pass an accurate override rather than let next/image
// under-request resolution and visibly soften the image.
//
// Renders nothing when there are no products — see DECISIONS.md D-033.
export function SelectedPieces({ products }: SelectedPiecesProps) {
  if (products.length === 0) return null;
  const [large, ...rest] = products;

  return (
    <section aria-label="Selected Pieces" className="flex flex-col gap-6 px-4 py-16 md:px-8">
      <h2 className="font-display text-heading-3 uppercase tracking-display text-esque-text">
        Selected Pieces
      </h2>
      <div className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12 lg:gap-8">
        <div className="col-span-4 md:col-span-8 lg:col-span-8">
          <ProductCard product={large} layout="featured" />
        </div>
        {rest.length > 0 && (
          <div className="col-span-4 flex flex-col gap-6 md:col-span-8 lg:col-span-4 lg:gap-8">
            {rest.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout="standard"
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/catalog/ProductCard.tsx components/home/SelectedPieces.tsx
git commit -m "Add SelectedPieces component (Scene 04) and ProductCard sizes override"
git push
```

---

### Task 6: `CategoryShowcase` component (Scene 05)

**Files:**
- Create: `components/home/CategoryShowcase.tsx`

No dedicated test file (same precedent).

- [ ] **Step 1: Implement**

Create `components/home/CategoryShowcase.tsx`:

```tsx
import Link from 'next/link';
import { getCategoryLabel, type CategorySlug } from '@/lib/catalog/taxonomy';

const CATEGORIES: CategorySlug[] = ['tops', 'bottoms', 'etc'];

// DESIGN_SYSTEM.md §34 — large-typography category navigator. Labels come
// from lib/catalog/taxonomy.ts's getCategoryLabel — the same NAVIGATION-
// derived single source of truth Header/FullScreenMenu/category pages
// already use (D-023), not a fourth parallel label list. Links to the
// real Phase 4 category routes. No imagery-on-hover (DESIGN_SYSTEM.md's
// fuller vision) — no real category photography exists yet (PROJECT.md
// §101); the hover treatment that IS built (a color shift, reusing
// FullScreenMenu's exact hover:text-esque-forest treatment) needs no
// photography and is fully real.
export function CategoryShowcase() {
  return (
    <section
      aria-label="Shop by Category"
      className="flex min-h-[70svh] flex-col items-center justify-center gap-2 bg-esque-black py-16"
    >
      {/* Visually hidden: the giant category words below already
          communicate "shop by category" to sighted users, so a visible
          duplicate heading would only add clutter. Kept for screen-reader
          heading-navigation and a consistent one-h2-per-scene outline —
          matching FullScreenMenu's own precedent of plain, non-heading-
          wrapped links for this exact kind of giant-typography nav. */}
      <h2 className="sr-only">Shop by Category</h2>
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/${category}`}
          className="font-display text-display-l uppercase leading-none tracking-display text-esque-text transition-colors duration-200 ease-esque hover:text-esque-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
        >
          {getCategoryLabel(category)}
        </Link>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/home/CategoryShowcase.tsx
git commit -m "Add CategoryShowcase component (Scene 05)"
git push
```

---

### Task 7: `DropStatus` component (Scene 06)

**Files:**
- Create: `components/home/DropStatus.tsx`

No dedicated test file (same precedent).

- [ ] **Step 1: Implement**

Create `components/home/DropStatus.tsx`:

```tsx
// DESIGN_SYSTEM.md §35, CONTENT.md §8 — real, verbatim copy; zero Shopify
// dependency. The piece count (PROJECT.md §8's committed 6-piece launch
// catalog) is static rather than live-queried from Shopify — with only
// one real collection in the catalog, a live count computed from the
// unscoped root products connection couldn't yet prove itself distinct
// from hardcoding (identical reasoning to DECISIONS.md D-030's PDP
// drop/collection-context deferral). Revisit once a real, collection-
// scoped product count is worth building against a second collection.
export function DropStatus() {
  return (
    <section
      aria-label="Drop Status"
      className="flex min-h-[50svh] flex-col items-center justify-center gap-3 bg-esque-surface text-center"
    >
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        COLLECTION 001
      </p>
      <h2 className="font-display text-heading-1 uppercase tracking-display text-esque-text">
        06 PIECES
      </h2>
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        AVAILABLE UNTIL GONE
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add components/home/DropStatus.tsx
git commit -m "Add DropStatus component (Scene 06)"
git push
```

---

### Task 8: Wire the real homepage (`app/(storefront)/page.tsx`) and retire the placeholder smoke test

**Files:**
- Modify: `app/(storefront)/page.tsx`
- Modify: `tests/e2e/smoke.spec.ts` (remove the now-stale `homepage placeholder` describe block)

- [ ] **Step 1: Implement**

Replace `app/(storefront)/page.tsx` in full:

```tsx
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CollectionHero } from '@/components/home/CollectionHero';
import { CollectionStatement } from '@/components/home/CollectionStatement';
import { DropStatus } from '@/components/home/DropStatus';
import { InteractiveModelPlaceholder } from '@/components/home/InteractiveModelPlaceholder';
import { SelectedPieces } from '@/components/home/SelectedPieces';
import { getSelectedPieces } from '@/lib/home/selected-pieces';

// ROADMAP.md Phase 7 — the real homepage. Scene order matches PROJECT.md
// §23 and DESIGN_SYSTEM.md §58's Mobile Homepage sequence exactly (both
// agree: Hero -> Interactive Model -> Collection Statement -> Selected
// Pieces -> Categories -> Drop Status). Scene 07 (Archive Preview) is
// deliberately omitted — see the design spec's Non-Goals. Selected
// Pieces' fetch is the page's only Shopify dependency, isolated in
// lib/home/selected-pieces.ts (DECISIONS.md D-033) so a Shopify failure
// never affects the other five scenes.
export default async function Home() {
  const selectedPieces = await getSelectedPieces();

  return (
    <>
      <CollectionHero />
      <InteractiveModelPlaceholder />
      <CollectionStatement />
      <SelectedPieces products={selectedPieces} />
      <CategoryShowcase />
      <DropStatus />
    </>
  );
}
```

- [ ] **Step 2: Update the now-stale smoke test**

In `tests/e2e/smoke.spec.ts`, remove the `homepage placeholder` describe block (it asserted on Phase 0's temporary placeholder text, which no longer exists):

```typescript
test.describe('homepage placeholder', () => {
  test('shows the ESQUE wordmark and in-development notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ESQUE' })).toBeVisible();
    await expect(page.getByText('COLLECTION 001 — IN DEVELOPMENT')).toBeVisible();
  });
});
```

Delete it entirely — Task 9's `tests/e2e/homepage.spec.ts` replaces it with real, thorough coverage of the actual homepage (including the same underlying fact, that the page renders a real `<h1>ESQUE</h1>`).

- [ ] **Step 3: Run the existing suite to confirm nothing else broke**

Run: `pnpm test:e2e`
Expected: `smoke.spec.ts`'s remaining describe blocks (`shell`, `design tokens`, `fonts`, `header`, `full-screen menu`, `footer`, `not-found`) all still pass — none of them depended on the placeholder's specific content.

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add "app/(storefront)/page.tsx" tests/e2e/smoke.spec.ts
git commit -m "Wire the real homepage from its six scene components"
git push
```

---

### Task 9: E2E coverage for the real homepage

**Files:**
- Create: `tests/e2e/homepage.spec.ts`

- [ ] **Step 1: Implement**

Create `tests/e2e/homepage.spec.ts`, mirroring `tests/e2e/catalog.spec.ts`/`pdp.spec.ts`'s honest-limitation framing:

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'esque_access', value: '1', url: 'http://localhost:3000' }]);
});

// SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_API_TOKEN are intentionally unset
// in this E2E environment (playwright.config.ts's webServer.env) — Selected
// Pieces' fetch always fails here. This is deliberately the load-bearing
// case for this phase's core new architecture (DECISIONS.md D-033): the
// other five rendered scenes must still render correctly regardless.
test.describe('homepage — renders real scene content even with Shopify unconfigured', () => {
  test('the hero renders its real structure, placeholder labels, and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ESQUE', level: 1 })).toBeVisible();
    await expect(page.getByText('COLLECTION 001').first()).toBeVisible();
    await expect(page.getByText('ESQUE PLACEHOLDER — CAMPAIGN, HERO')).toBeVisible();
    await expect(page.getByText('ESQUE PLACEHOLDER — CAMPAIGN STATEMENT')).toBeVisible();
    const cta = page.getByRole('link', { name: 'ENTER COLLECTION' });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/new$/);
  });

  test('the interactive model placeholder is present and inert', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Interactive Model' });
    await expect(scene).toBeVisible();
    await expect(scene.getByText('LOOK 01')).toBeVisible();
    await expect(scene.getByText('ESQUE PLACEHOLDER — MODEL, FULL BODY')).toBeVisible();
    await expect(scene.getByRole('heading', { name: 'ARRIVING SOON.' })).toBeVisible();
  });

  test('the collection statement renders its real copy', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'NOT MADE TO REMAIN.' })).toBeVisible();
  });

  test('Selected Pieces is entirely absent when Shopify is unconfigured', async ({ page }) => {
    await page.goto('/');
    // Proves the graceful-omission path (DECISIONS.md D-033) — not just
    // "the page didn't crash," but that the specific section is genuinely
    // absent rather than rendered empty or erroring.
    await expect(page.getByRole('heading', { name: 'Selected Pieces' })).toHaveCount(0);
  });

  test('the category showcase links to the real Phase 4 category routes', async ({ page }) => {
    await page.goto('/');
    const scene = page.getByRole('region', { name: 'Shop by Category' });
    await expect(scene.getByRole('link', { name: 'TOPS' })).toHaveAttribute('href', '/tops');
    await expect(scene.getByRole('link', { name: 'BOTTOMS' })).toHaveAttribute('href', '/bottoms');
    await expect(scene.getByRole('link', { name: 'ETC.' })).toHaveAttribute('href', '/etc');

    await scene.getByRole('link', { name: 'TOPS' }).click();
    await expect(page).toHaveURL(/\/tops$/);
  });

  test('drop status renders the real, committed catalog copy', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '06 PIECES' })).toBeVisible();
    await expect(page.getByText('AVAILABLE UNTIL GONE')).toBeVisible();
  });

  test('archive preview (Scene 07) is not rendered this pass', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: /archive/i })).toHaveCount(0);
  });
});

test.describe('homepage — structure and responsiveness', () => {
  test('has exactly one h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('produces no horizontal overflow at a 375px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e`
Expected: all pass. Note the `loads without console errors` test: `getSelectedPieces`'s `console.error` call runs on the **server** (this is a Server Component's own async body), not the browser page — so it does not appear in Playwright's `page.on('console', ...)`/`pageerror` listeners, which only observe the browser context. This test genuinely exercises client-side console cleanliness; it is not expected to (and does not) catch the server-side log Task 1's unit test already covers.

- [ ] **Step 3: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add tests/e2e/homepage.spec.ts
git commit -m "Add E2E coverage for the real homepage"
git push
```

---

### Task 10: Documentation — DECISIONS.md, ROADMAP.md, ARCHITECTURE.md

**Files:**
- Modify: `DECISIONS.md` (append D-032, D-033)
- Modify: `ROADMAP.md` (Phase 7 checkboxes)
- Modify: `ARCHITECTURE.md` (§3 repo structure — add `components/home/`, `lib/home/`)

- [ ] **Step 1: DECISIONS.md**

Append two entries (D-032, D-033) per the design spec's "New Architectural Decisions to Record" section, matching this file's existing citation style exactly.

- [ ] **Step 2: ROADMAP.md**

Update Phase 7 to reflect actual, honest per-scene status (real build vs. real-mechanism-with-placeholder-content vs. placeholder-slot-only vs. omitted), each citing DECISIONS.md D-032/D-033 as appropriate — matching the design spec's Goals/Non-Goals sections.

- [ ] **Step 3: ARCHITECTURE.md**

In §3's repo structure sketch, add `components/home/` and `lib/home/` alongside the existing `catalog/`/`product/` entries, with a short note (matching this document's existing footnote style) describing what each holds.

- [ ] **Step 4: Validate and commit**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build`

```bash
git add DECISIONS.md ROADMAP.md ARCHITECTURE.md
git commit -m "Record D-032-D-033; mark Phase 7's completed and narrowed items"
git push
```

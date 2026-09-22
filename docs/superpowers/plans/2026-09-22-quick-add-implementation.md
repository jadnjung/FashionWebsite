# Quick Add Implementation Plan

Companion design spec: `docs/superpowers/specs/2026-09-22-quick-add-design.md` — read it in full before starting; this plan assumes its reasoning and does not re-justify decisions already made there.

## Global Constraints

- No Shopify store is configured in this environment. Every category/PDP route hits the generic error boundary before a real `ProductCard` renders. This means the new components cannot be exercised through ordinary Playwright navigation — verification of their actual rendered/interactive behavior happens via a **temporary** fixture-probe route (deleted before commit, confirmed via `git status --short`) and a manual `PREVIEW_DEMO_MODE=1` dev-server pass. Do not invent a permanent fixture-route test pattern — this codebase has deliberately never adopted one (see the design spec's Testing section).
- Match existing patterns exactly where one already exists: `SizeGuidePanel.tsx` for the dialog mechanics, `SearchOverlay.tsx` for the fetch/loading/error/retry pattern, `ProductPurchasePanel.tsx`/`InteractiveModelExperience.tsx` for the disabled-until-complete/no-op `ADD TO BAG`/`QUICK ADD` stub.
- Run `PREVIEW_DEMO_MODE=` (explicitly empty) for every formal validation command (`pnpm build`, `pnpm exec playwright test`) regardless of what a local `.env.local` might contain — this repo already has one from prior manual preview use, and D-058 documented exactly this trap (a stale local flag produces a wide, misleading spread of unrelated test failures). Use `PREVIEW_DEMO_MODE=1` only for your own manual/live verification pass.
- Do not touch `ProductGrid.tsx`, `CategoryListing.tsx`, `ProductDetail.tsx`, `SearchOverlay.tsx`, or `SelectedPieces.tsx` — Quick Add is unconditional `ProductCard` behavior (see design spec's New Architectural Decisions #2), so none of `ProductCard`'s callers need a new prop or any change at all.
- One logical commit per CLAUDE.md's git workflow is normally expected, but this is a router/engineering-lead-owned task — the engineering lead (not you) makes the final commit(s) after integration review. Do not run `git commit` yourself; stop after self-check and report back.

## Task 1: Analytics (`lib/analytics/events.ts`)

1. Add `'quick_add_open'` to the `ANALYTICS_EVENT_NAMES` array, in the "Product Behavior" group, immediately before `'quick_add_click'` (chronological: open precedes click).
2. Add its shape to `EventPropertiesMap`, immediately before the existing `quick_add_click` entry:
   ```ts
   // Fires when the on-grid Quick Add trigger (ProductCard) is clicked and
   // the panel begins opening — mirrors the shop_the_look_open/
   // request_access_open "opened a flow" pattern. The Interactive Model's
   // own QUICK ADD button has no separate open step (its panel is already
   // visible once a hotspot is activated), so this event has exactly one
   // real call site today. See DECISIONS.md D-0XX.
   quick_add_open: {
     item_id: string;
     item_name: string;
   };
   ```
   (Leave the existing `quick_add_click` entry's shape untouched — its `region: string` field is already generically typed and does not need a type change to accept a new value.)
3. Update `quick_add_click`'s existing doc comment (just above its `EventPropertiesMap` entry, or add one if none exists at that exact spot) to note it is now fired from two real surfaces: the Interactive Model's own panel (`region` = hotspot region) and the on-grid Quick Add panel (`region: 'product_card'`).
4. Extend `variant_selected`'s `context` union: `'pdp' | 'interactive_model' | 'shop_the_look' | 'quick_add'`. Update its doc comment's "three real, distinct surfaces" wording to "four."
5. **Self-check:** `pnpm typecheck` must still pass (no other file references `EventPropertiesMap`/`AnalyticsEventName` in a way this breaks — it's an additive union change). Add/extend `lib/analytics/events.test.ts` if it asserts the exact contents of `ANALYTICS_EVENT_NAMES` (check first; only touch it if a test would otherwise fail).

## Task 2: Route Handler (`app/api/products/[handle]/route.ts`, new)

Mirror `app/api/search/route.ts` precisely — same structure, same error-handling contract, adapted for a dynamic segment instead of a query param.

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getProduct } from '@/lib/shopify/products';

// This codebase's second Route Handler, mirroring app/api/search/route.ts's
// exact pattern — a live, on-demand, cancelable-via-AbortSignal read
// triggered by opening Quick Add, not a form submission (this project's
// Server Actions handle those). Already excluded from the access gate:
// proxy.ts's matcher excludes /api unconditionally. GET handlers default to
// dynamic rendering since Next 15.0.0-RC — no explicit `export const
// dynamic` needed (confirmed against this project's installed Next 16.3.1
// docs by app/api/search/route.ts's own precedent).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  try {
    const product = await getProduct(handle);
    return NextResponse.json({ product });
  } catch (error) {
    // Logged, never forwarded to the client response — mirrors
    // app/api/search/route.ts's and app/error.tsx's "log the real error,
    // never show it" contract.
    console.error('[api/products]', error);
    return NextResponse.json({ error: 'product_fetch_failed' }, { status: 500 });
  }
}
```

Verify `getProduct`'s exact exported signature/return type in `lib/shopify/products.ts` before writing this (it returns `Promise<ProductDetail | null>` — confirm this hasn't changed) and that `{ params }`'s shape matches the `Promise<{ handle: string }>` convention already used by `app/(storefront)/products/[handle]/page.tsx`.

### `app/api/products/[handle]/route.test.ts` (new)

Mirror `app/api/search/route.test.ts`'s structure exactly (same `vi.mock`, same `NextRequest` construction helper). Cases:

1. A found product: mock `getProduct` to resolve a fake `ProductDetail`; assert `response.status === 200` and the body is `{ product: <that fake> }`; assert `getProduct` was called with the handle taken from the URL path (not a query param).
2. A not-found product: mock `getProduct` to resolve `null`; assert `response.status === 200` and the body is `{ product: null }`.
3. `getProduct` rejecting: mock it to reject with an `Error` containing some internal detail (mirror search's test's exact phrasing, e.g. `'Shopify Storefront API is not configured'`); assert `response.status === 500`, body is exactly `{ error: 'product_fetch_failed' }`, the internal detail string is **not** present anywhere in the serialized body, and `console.error` was called (spy + restore, exactly like search's test).

Constructing the request: Next's `NextRequest` doesn't automatically parse `[handle]` from the URL the way the App Router itself does at runtime — that binding happens via the second `context.params` argument Next's router passes, not by parsing the request URL yourself. Call `GET` directly with a plain `NextRequest` for the URL and a second argument shaped `{ params: Promise.resolve({ handle: 'some-handle' }) }`, matching how the route itself destructures it. Confirm this compiles and runs correctly — this is the first route handler test in this codebase with a dynamic segment, so there's no exact precedent to copy for the second argument; get it right by reading Next's own type for a Route Handler's second parameter rather than guessing.

## Task 3: `components/product/QuickAddPanel.tsx` (new)

The dialog itself. Full behavior spec is in the design doc's Architecture/States/Accessibility sections — implement precisely, do not improvise a different state shape or copy.

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VariantPicker } from '@/components/product/VariantPicker';
import { trackEvent } from '@/lib/analytics/gtag';
import {
  findMatchingVariant,
  getInitialSelections,
  isProductSoldOut,
  isSelectionComplete,
  type OptionSelections,
} from '@/lib/product/variants';
import type { ProductDetail } from '@/lib/shopify/products';

interface QuickAddPanelProps {
  handle: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'loaded'; product: ProductDetail };

export function QuickAddPanel({ handle, title, open, onClose }: QuickAddPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });
  const [selections, setSelections] = useState<OptionSelections>({});
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setFetchState({ status: 'loading' });
    fetch(`/api/products/${handle}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('quick add fetch failed');
        return res.json() as Promise<{ product: ProductDetail | null }>;
      })
      .then(({ product }) => {
        if (!product) {
          setFetchState({ status: 'not-found' });
          return;
        }
        setSelections(getInitialSelections(product.options));
        setFetchState({ status: 'loaded', product });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFetchState({ status: 'error' });
      });

    return () => controller.abort();
  }, [open, handle, retryToken]);

  function handleOptionChange(optionName: string, value: string) {
    // Product Behavior: "variant selection" (PROJECT.md §82) — the shared
    // VariantPicker's fourth real call site (DECISIONS.md D-055/D-0XX).
    trackEvent('variant_selected', {
      item_id: handle,
      option_name: optionName,
      option_value: value,
      context: 'quick_add',
    });
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  }

  const loaded = fetchState.status === 'loaded' ? fetchState : null;
  const soldOut = loaded ? isProductSoldOut(loaded.product.variants) : false;
  const matchedVariant = loaded ? findMatchingVariant(loaded.product.variants, selections) : null;
  const selectionComplete = loaded
    ? isSelectionComplete(loaded.product.options, selections)
    : false;
  const canAddToBag = !soldOut && matchedVariant !== null && matchedVariant.availableForSale;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Quick Add — ${title}`}
      className="fixed inset-x-0 bottom-0 m-0 max-h-[85vh] w-full max-w-full overflow-y-auto border-0 bg-esque-surface p-6 text-esque-text backdrop:bg-esque-black/70 md:inset-0 md:m-auto md:h-fit md:w-full md:max-w-sm"
    >
      <div className="flex items-center justify-between pb-6">
        <h2 className="font-display text-heading-3 uppercase tracking-display">{title}</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {fetchState.status === 'loading' && (
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 animate-pulse bg-esque-elevated" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-14 animate-pulse bg-esque-elevated" />
              ))}
            </div>
          </div>
        )}

        {fetchState.status === 'error' && (
          <div className="flex flex-col items-start gap-4">
            <p className="font-display text-heading-3 uppercase text-esque-text">
              SOMETHING WENT WRONG.
            </p>
            <Button variant="secondary" onClick={() => setRetryToken((t) => t + 1)}>
              Retry
            </Button>
          </div>
        )}

        {fetchState.status === 'not-found' && (
          <p className="font-display text-heading-3 uppercase text-esque-text">
            THIS PIECE DOESN&apos;T EXIST.
          </p>
        )}

        {loaded &&
          (soldOut ? (
            <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
              NO LONGER AVAILABLE.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <VariantPicker
                namePrefix={`quickadd-${handle}`}
                options={loaded.product.options}
                variants={loaded.product.variants}
                selections={selections}
                onChange={handleOptionChange}
              />
              <Button
                type="button"
                variant="primary"
                disabled={!canAddToBag}
                onClick={() => {
                  // No cart exists yet (D-016/D-029) — real, disabled-gated
                  // click; the bag mutation itself is a deliberate no-op,
                  // matching ProductPurchasePanel/ActiveGarmentPanel exactly.
                  if (!matchedVariant) return;
                  trackEvent('quick_add_click', {
                    currency: matchedVariant.price.currencyCode,
                    value: Number(matchedVariant.price.amount),
                    items: [
                      {
                        item_id: loaded.product.handle,
                        item_name: loaded.product.title,
                        item_category: loaded.product.productType,
                        item_variant: matchedVariant.id,
                        price: Number(matchedVariant.price.amount),
                      },
                    ],
                    region: 'product_card',
                  });
                }}
              >
                ADD TO BAG
              </Button>
              {!selectionComplete && (
                <p className="text-utility text-esque-text-secondary">
                  Select all options to continue.
                </p>
              )}
            </div>
          ))}
      </div>
    </dialog>
  );
}
```

Notes for the implementer:
- Do not add a `useEffect` that resets `fetchState`/`selections` on close — deriving from `open` (the fetch effect's own early `return` when `!open`) plus a fresh fetch on every reopen is sufficient, matching the reasoning already laid out in the design spec. Adding an extra reset effect risks the exact `react-hooks/set-state-in-effect` shape D-031 already flagged elsewhere in this codebase — don't introduce a second instance of it.
- Verify `ProductDetail`'s exact field names (`options`, `variants`, `productType`, `handle`, `title`) against the current `lib/shopify/products.ts` before writing this — the sketch above is illustrative, not necessarily character-for-character final.
- Double-check the `md:` centering CSS actually renders correctly (centered, capped at `max-w-sm`, not full-bleed, not off-screen) via the live verification pass (Task 6) — do not assume the CSS reasoning in the design spec is pixel-correct without looking at it rendered.

## Task 4: `components/catalog/QuickAddTrigger.tsx` (new)

```tsx
'use client';

import { useState } from 'react';
import { QuickAddPanel } from '@/components/product/QuickAddPanel';
import { trackEvent } from '@/lib/analytics/gtag';

interface QuickAddTriggerProps {
  handle: string;
  title: string;
}

// The on-grid Quick Add entry point (DESIGN_SYSTEM.md §40-41, DECISIONS.md
// D-0XX resolving D-029). A sibling of ProductCard's own <Link>, never
// nested inside it — see ProductCard.tsx's own comment for why.
export function QuickAddTrigger({ handle, title }: QuickAddTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          trackEvent('quick_add_open', { item_id: handle, item_name: title });
          setOpen(true);
        }}
        className="w-fit text-left text-utility uppercase tracking-metadata text-esque-text-secondary underline-offset-4 transition-opacity duration-200 ease-esque hover:text-esque-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100"
      >
        QUICK ADD
      </button>
      <QuickAddPanel handle={handle} title={title} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

## Task 5: `components/catalog/ProductCard.tsx` (edit)

Read the current file fully before editing (already read once during design — re-read to confirm no drift). The change is structural but small:

1. Import `QuickAddTrigger` from `@/components/catalog/QuickAddTrigger`.
2. Change the outer return from a single `<Link className="group flex flex-col gap-3 ...">...</Link>` to:
   ```tsx
   return (
     <div className="group flex flex-col gap-3">
       <Link
         href={`/products/${product.handle}`}
         data-cursor="VIEW"
         className="flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esque-text"
       >
         {enableSharedTransition ? (
           <ViewTransition name={getProductViewTransitionName(product.handle)} share="morph" default="none">
             {imageContainer}
           </ViewTransition>
         ) : (
           imageContainer
         )}
         <p className="text-product-name text-esque-text">{product.title}</p>
       </Link>
       <QuickAddTrigger handle={product.handle} title={product.title} />
     </div>
   );
   ```
   i.e.: move `group` off the `<Link>` onto a new wrapping `<div>`; the `<Link>` keeps its own `flex flex-col gap-3` (for internal image/title layout) and its own focus ring; add `<QuickAddTrigger>` as the wrapper's second child, after the `<Link>` closes.
3. Do not touch `imageContainer`'s own definition, the `IMAGE_SIZES` map, the `ViewTransition` wrapping, or any prop (`layout`, `sizes`, `enableSharedTransition`, `priority`) — all unchanged.
4. Update the file's own header comment block if it currently says something like "Quick Add (§40) is out of scope this pass" — that line is now false; correct or remove it rather than leaving stale documentation.
5. **Self-check this task specifically:** confirm `ProductCard` remains a Server Component (no `'use client'` added to it) — only `QuickAddTrigger`/`QuickAddPanel` are client components. Confirm no nested interactive element exists (a `<button>` inside an `<a>`, or vice versa) anywhere in the new markup.

## Task 6: Live verification

1. **Temporary fixture probe** (mirroring this codebase's established, repeated technique — see any of D-026/D-034/D-045/D-048/D-049/D-053/D-055/D-056/D-058 for the exact shape): a throwaway route under `app/(storefront)/probe-quick-add-temp/page.tsx` rendering a handful of hand-built `ProductListItem` fixtures through the real, unmodified `ProductGrid`/`ProductCard`. Use it (via a real launched browser, not just the test runner, for faster iteration) to confirm:
   - Mobile viewport (e.g. 390px): `QUICK ADD` is visible without any hover/focus.
   - Desktop viewport (e.g. 1280px): `QUICK ADD` is invisible at rest, appears on mouse hover over the card, appears on keyboard Tab into the button itself (not before), disappears when the mouse/focus leaves.
   - Clicking/activating it opens the dialog; on desktop it renders as a small, centered, capped-width box (not full-bleed, not off-screen, not overlapping content awkwardly); on a narrow viewport it renders as a bottom sheet.
   - The dialog shows a loading skeleton briefly, then either the real variant picker + `ADD TO BAG`, or (for a fixture with no available variants) `NO LONGER AVAILABLE.`, or (for a handle the fixture set doesn't recognize — simulate by pointing one trigger at a nonexistent handle) `THIS PIECE DOESN'T EXIST.`.
   - Escape closes it; focus returns to the trigger button that opened it (verify — do not assume this "for free" claim without checking).
   - Tab cannot leave the dialog while it's open (native focus trap).
   - Selecting a size/color updates the picker's visual state and does not throw; `ADD TO BAG` is disabled until every option has a selection, and disabled for a genuinely sold-out fixture.
   - No console errors/warnings at any point in the above.
   - Delete this route before finishing (`git status --short` must not show it).
2. **Demo Mode pass:** run `PREVIEW_DEMO_MODE=1 pnpm dev` locally (do not commit any `.env.local` change), navigate to `/new` (or another category route), confirm real fixture products render with a working `QUICK ADD` trigger end-to-end against the real `/api/products/[handle]` route (not the probe) — including the one-real-variant caveat noted in the design spec (only `Size: M` + `Color: Black` is addable; every other combination correctly shows disabled). Confirm the homepage's Selected Pieces section (also `ProductCard`-based) also gets a working trigger, consistent with the "unconditional" scope decision.
3. Report exactly what was checked and what (if anything) needed fixing before moving on — do not simply assert "looks correct."

## Task 7: Self-check before handing back

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck` all pass.
- `pnpm test:unit` passes, including the new route handler test and any analytics test additions.
- `PREVIEW_DEMO_MODE= pnpm exec playwright test` (explicitly empty, overriding any local `.env.local`) passes with no new failures beyond this codebase's already-characterized, pre-existing load-sensitive flakes (D-046/D-047/D-050/D-056/D-058's running list) — if a new, unfamiliar failure appears, do not dismiss it as "probably flaky"; investigate first.
- `PREVIEW_DEMO_MODE= pnpm build` succeeds; confirm the new `/api/products/[handle]` route appears in the build's route table as dynamic (`ƒ`), matching `/api/search`'s own classification.
- Confirm no probe/temporary files remain (`git status --short`).
- Report back: exact files created/changed, the live-verification findings from Task 6 (specific, not "looks good"), and any deviation from this plan with reasoning.

Do not commit. Hand back to the engineering lead for integration review.

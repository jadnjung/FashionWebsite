# Esque — Archive Foundation

## Context

ROADMAP.md Phase 11: "Archive foundation (Collection 001 only for now; structure ready for future drops)". PROJECT.md §41 defines the feature; CONTENT.md §7 already carries the empty-state copy (`THE ARCHIVE BEGINS HERE.`); DESIGN_SYSTEM.md §36 explicitly excludes the homepage teaser (Scene 07) from this pass. `lib/shopify/collections.ts` (`getCollection`/`getCollections`) has existed since Phase 2 with **zero consumers anywhere in the app** — this is their first real caller.

Today, conceptually, exactly one collection exists (Collection 001, current). Nothing is archived. The feature must be real — a working route and mechanism against real Shopify calls — while being honest that it renders empty today.

## Goals

1. `/archive` — lists archived collections, or the honest empty state.
2. `/archive/[handle]` — one archived collection's products, imagery/description retained, purchase controls replaced with `UNAVAILABLE`.
3. Decide and implement precisely how `UNAVAILABLE` differs from the existing `SOLD OUT`/`NO LONGER AVAILABLE.` treatment.
4. Decide navigation discoverability.
5. SEO: index both routes; sitemap the index.
6. Demo Mode: add fixture coverage so the populated state is genuinely previewable.

## Explicit Non-Goals (deferred, or out of scope, with reasons)

- **Homepage Scene 07 (Archive Preview).** DESIGN_SYSTEM.md §36 explicitly allows this to stay hidden until a real past collection exists. Not built.
- **PDP collection-context awareness.** `/products/[handle]`/`getProduct` stay completely unmodified — no collection-membership query is added to the live PDP. Mirrors D-030's exact reasoning for deferring "drop/collection context" on the PDP: with only one real collection in the catalog, a collection-scoped code path added to the live PDP could not be proven to be anything other than hardcoded. The archived-product view is instead fully self-contained on `/archive/[handle]` (its own imagery/title/description, sourced from `getProductsByCollection`), never routing through or modifying the live PDP.
- **A nested per-archived-product route** (e.g. `/archive/[handle]/[productHandle]`). Rejected: PROJECT.md §41's retained list (imagery, description, campaign context, specifications) is fully satisfiable with data `/archive/[handle]` already shows inline — this codebase has no "specifications" content anywhere yet, not even on the live PDP (D-030), so a nested route would only re-present the same three fields (image, title, description) a second time with zero new capability. Smallest-architecture violation for no benefit.
- **A collection hero/campaign image.** `GET_COLLECTION_QUERY` is not extended with an `image` field. The only spec reference to a collection-level campaign image is Scene 07 (excluded above). The collection's title + description already satisfy "campaign context" with data this codebase can already access.
- **Collection filter / `/collections/[handle]`.** Still unbuilt (ARCHITECTURE.md §3), not part of this task.
- **Archive-specific analytics events.** Considered (PROJECT.md §82 names "archive interaction," previously flagged unattached by D-055) and deliberately not wired this pass — see Analytics section below.
- **Pagination on the archive index.** `getCollections(first: 20)` is generous for any realistic near-term collection count; no "load more" UI.

## Architecture

### Determining archived vs. current

`CollectionSummary`/`CollectionDetail` (`lib/shopify/collections.ts`) already expose `dropStatus: string | null` and `archivedAt: string | null` (the `custom.drop_status`/`custom.archived_at` metafields, per ARCHITECTURE.md §5). Neither is typed as an enum — the real store's exact string values are unverified, matching D-023's own caveat for `productType` strings.

`lib/archive/collections.ts` adds:

```ts
export function isCollectionArchived(
  collection: Pick<CollectionSummary, 'dropStatus' | 'archivedAt'>,
): boolean {
  return collection.dropStatus?.toLowerCase() === 'archived' || collection.archivedAt !== null;
}
```

Either signal alone is sufficient (an `OR`, not an `AND`) — deliberately defensive: `drop_status` is the named, primary status field; `archived_at` is corroborating date evidence. A real merchandiser who sets one without the other (forgets to flip the status flag, or vice versa) is still detected correctly. This is a pure function, unit-tested directly.

### `lib/archive/collections.ts` — the Archive domain's isolated Shopify dependency

Mirrors `lib/home/selected-pieces.ts`'s and `lib/interactive-model/look.ts`'s established shape (ARCHITECTURE.md §3): a small domain module wrapping the raw `lib/shopify/*` fetch with this domain's own business logic.

```ts
export async function getArchivedCollections(first = 20): Promise<CollectionSummary[]> {
  const { collections } = await getCollections(first);
  return collections.filter(isCollectionArchived);
}

export async function getArchivedCollection(handle: string): Promise<CollectionDetail | null> {
  const collection = await getCollection(handle);
  if (!collection || !isCollectionArchived(collection)) return null;
  return collection;
}
```

**Deliberately does NOT swallow a thrown error** (unlike `getSelectedPieces`'s D-033 exception). D-033's exception is justified specifically because six of the homepage's seven scenes have no Shopify dependency at all, so one failing curated section shouldn't take the rest of the page down. `/archive` has no such other content — the commerce data (which collections are archived) *is* the page's entire reason for existing, exactly like category pages and the PDP. A thrown error (unconfigured store, throttled request) correctly propagates to `app/error.tsx`, matching `catalog.spec.ts`/`pdp.spec.ts`'s already-established pattern for every other Shopify-dependent route in this dev/CI environment (no real store configured here, so every route below hits the generic error boundary in the actual E2E environment — expected and consistent, not a defect).

**An existing-but-not-archived handle (e.g. the real current collection) resolves identically to a nonexistent handle** — both `null`. This is a deliberate correctness decision, not an oversight: without it, `/archive/collection-001` (the current, purchasable collection) could render with a fabricated `UNAVAILABLE` treatment for a collection that is, in fact, fully purchasable via `/products/[handle]` today — an actively dishonest, harmful inconsistency. Treating "exists but isn't archived" the same as "doesn't exist" mirrors D-026's honest not-found handling rather than inventing a third response type.

### Route shape

- `/archive` — index. Static metadata (title/description independent of collection count, matching `/new`'s pattern). **`export const dynamic = 'force-dynamic'`** — see "Build-time safety" below for why this is required, not optional.
- `/archive/[handle]` — one archived collection. Dynamic segment, no `generateStaticParams` (matches `/products/[handle]`'s precedent — collection handles aren't enumerable without a real store). `generateMetadata` uses the same `cache()`-wrapped dedup pattern as the PDP (`app/(storefront)/products/[handle]/page.tsx`) so `generateMetadata` and the page component issue one Shopify call, not two.

Component split mirrors this codebase's two existing conventions: `ArchiveIndex` (async Server Component, fetches + renders — like `CategoryListing`) for the index; `page.tsx` fetches + `notFound()`s, `ArchivedCollectionView` renders (like the PDP's `page.tsx`/`ProductDetail` split) for the detail route, since the detail route additionally needs the fetched title for `generateMetadata`.

### Build-time safety — why `/archive` needs `force-dynamic`

Category pages (`/tops`, etc.) never risk a build-time Shopify call: reading `searchParams` automatically forces per-request (dynamic) rendering in the App Router, so their `getProducts()` call only ever executes at request time, where a thrown error correctly reaches `app/error.tsx`. `/archive` reads no `searchParams` and has no dynamic segment — without an explicit opt-out, Next.js would treat it as eligible for **static generation**, meaning `getArchivedCollections()` (which, per the decision above, does *not* swallow its error) would execute **at `pnpm build` time**. In this dev/CI environment (Shopify unconfigured), that throws — which would fail the production build itself, not just render an error page at runtime.

`export const dynamic = 'force-dynamic'` on `app/(storefront)/archive/page.tsx` makes this explicit and safe: `getArchivedCollections()` only ever runs per-request, exactly matching category pages' real, already-proven-safe behavior, via a standard, documented Next.js mechanism rather than an accidental static/dynamic outcome. `/archive/[handle]` needs no equivalent — a dynamic route segment with no `generateStaticParams` is already dynamically rendered by default (confirmed precedent: `/products/[handle]` has no such export and is dynamic).

This must be verified empirically (`pnpm build`, both with and without the export, if time permits) rather than assumed — see the implementation plan's verification step.

### The `UNAVAILABLE` divergence — precisely where and why

**Decision: archived-collection purchase-control state is a property of the collection's archived status, never of the product's own inventory.** Every product listed on `/archive/[handle]` shows `UNAVAILABLE` unconditionally — regardless of `availableForSale`/`quantityAvailable` (which this view doesn't even fetch). This is the concrete divergence from the live PDP:

- **Live PDP (`ProductPurchasePanel`)**: purchasability is inventory-driven. `SOLD OUT`/`NO LONGER AVAILABLE.` answers "can I buy this *right now*" — a real-time, per-variant question that can change (restocking, a new drop).
- **Archived collection (`/archive/[handle]`)**: purchasability is answered by one categorical fact — "has this drop closed" — which is entirely determined by the *collection's* `dropStatus`/`archivedAt`, never by remaining stock. A hypothetical archived product that still had inventory left when its drop ended is still `UNAVAILABLE`: the drop is what closed, not the item that ran out. This also means the archived view needs no scarcity/variant data at all, simplifying it structurally, not just cosmetically.

**Visual treatment reuses the existing "no purchase is possible here" pattern precisely, not the SOLD OUT badge.** `ProductPurchasePanel`'s sold-out branch already renders a plain status paragraph (`NO LONGER AVAILABLE.`, `text-utility uppercase tracking-metadata text-esque-text-secondary`) in the exact position/role a purchase control would occupy — this is the closer, more literal match to PROJECT.md §41's "purchasing controls are replaced with: UNAVAILABLE" than `ProductCard`'s image-corner `SOLD OUT` badge (a supplementary status indicator shown *alongside* otherwise-normal, if inactive, purchase controls elsewhere on the page — not a replacement for them). `ArchivedProductTile` therefore renders the identical classNames with the text `UNAVAILABLE` in place of a purchase control — same visual weight and pattern, different word, driven by a different (collection-level, not inventory-level) fact. `ProductCard` itself is untouched; its `SOLD OUT` badge remains exactly what it already is, for the current-catalog case it already correctly serves.

### `ArchivedProductTile` — a new, explicit variant component, not a boolean flag on `ProductCard`

Considered reusing `ProductCard` with an `archived` boolean prop. Rejected per the `vercel-composition-patterns` explicit-variants guidance: an archived tile differs from `ProductCard` in two real dimensions, not one — (a) the label (`UNAVAILABLE` vs `SOLD OUT`, and in a different position/role, per above) and (b) the link target: `ProductCard` always links to `/products/[handle]` (the live, purchasable PDP), which would be actively misleading for an archived product (implying it can be bought). `ArchivedProductTile` is **not interactive at all** — no `<Link>`, no `data-cursor` — since there is no honest destination to send it to (see Non-Goals). A boolean flag bolted onto `ProductCard` to suppress its own `<Link>` and swap one label is exactly the "boolean prop customizing behavior" pattern that guidance warns against; a small, purpose-built, non-interactive presentational component is more honest about what it is.

Visually it reuses `ProductCard`'s established image-container treatment (`aspect-[4/5]`, `bg-esque-surface` fallback, `object-cover`) and title typography (`text-product-name text-esque-text`) — literal, deliberate duplication of a few className strings for visual consistency, not a shared abstraction neither component actually needs.

```tsx
// components/archive/ArchivedProductTile.tsx
interface ArchivedProductTileProps { product: ProductSummary }

export function ArchivedProductTile({ product }: ArchivedProductTileProps) {
  return (
    <article className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-esque-surface">
        {product.image && (
          <Image src={product.image.url} alt={product.image.altText ?? product.title} fill
            sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        )}
      </div>
      <p className="text-product-name text-esque-text">{product.title}</p>
      {product.description && (
        <p className="text-body text-esque-text-secondary">{product.description}</p>
      )}
      <p className="text-utility uppercase tracking-metadata text-esque-text-secondary">
        UNAVAILABLE
      </p>
    </article>
  );
}
```

### Product data — extending `ProductSummary`/`getProductsByCollection` with `description`

`getProductsByCollection` (`lib/shopify/products.ts`) already returns `id, handle, title, productType, tags, minPrice, image` — real imagery, satisfying the most visually important item on PROJECT.md §41's retained list at zero cost. It has **zero existing consumers**, so extending it is low-risk. Add `description: string` to `ProductSummary` and to `GET_PRODUCTS_BY_COLLECTION_QUERY`'s field selection (a one-line, additive GraphQL change) to satisfy "retains... description" literally, without an N+1 per-product fetch. Requires `pnpm graphql-codegen` (verified working in this environment — network access to `shopify.dev`'s public schema proxy confirmed, and a no-op re-run against the unmodified query reproduces the committed generated files byte-for-byte) and updating `getProductsByCollection`'s existing unit tests for the new field (a real, expected side effect of extending a tested shape — not a defect to route around).

### `/archive/[handle]`'s data flow

```
page.tsx:
  const collection = await getCachedArchivedCollection(handle);   // cache()-wrapped, generateMetadata + page share it
  if (!collection) notFound();
  const { products } = await getProductsByCollection(handle) ?? { products: [] };
  <ArchivedCollectionView collection={collection} products={products} />
```

`getProductsByCollection` and `getCollection` are independent, both keyed only by `handle` — no sequential dependency requiring `await` before the next `await` starts. Since `getCachedArchivedCollection` must resolve first anyway to decide `notFound()`, and `getProductsByCollection`'s own null case (`{ products: [] }`) only matters once we know the collection is real and archived, this stays sequential by necessity (not the avoidable waterfall the async-parallel guidance warns against — the second fetch's necessity is gated on the first fetch's result, mirroring the PDP's own "genuinely sequential" precedent for its own second fetch).

## Navigation / discoverability

**Decision: a real Footer link, in the existing `aria-label="Shopping"` nav group (alongside Wishlist) — not the Header/`FullScreenMenu`.**

- PROJECT.md §11 explicitly separates "Archive" from "Primary navigation" (New/Tops/Bottoms/Etc./Collections/About), filing it under "Additional future navigation" alongside Lookbook/Private/VIP, and notes "Archive may initially live under Collections before eventually becoming a first-class destination." `/collections` doesn't exist to nest it under, but the *sequencing* intent — not primary nav real estate yet — is explicit product guidance, not a gap to fill in. Adding it to `NAVIGATION`/`FullScreenMenu` would contradict that.
- Footer is this project's established mechanism for real, standalone routes without primary-nav real estate (`/contact`, `/legal/*` — D-054; `/wishlist` — D-061). CONTENT.md §7's dedicated empty-state copy for this exact page ("Archive before additional drops") signals the empty state is an intended thing for a real visitor to see (the same way `/wishlist`'s `NOTHING SAVED YET.` is shown to every new visitor, not hidden until populated) — not a dead end to keep undiscoverable. PROJECT.md §89 explicitly groups Bag/Wishlist/Archive as one list of "opportunities for subtle brand expression," treating all three with the same honesty standard.
- Grouped under the existing "Shopping" nav (not a new third landmark, and not folded into "Legal and support," which would misrepresent that nav's accessible name exactly as D-061 already reasoned for Wishlist): both Wishlist and Archive are real, non-primary-nav, storefront-browsing destinations. This is a judgment call, recorded honestly — a future redesign could split it out if "Shopping" ever feels like a mismatch once Archive has real content.

## SEO

**Both `/archive` and `/archive/[handle]` are indexed** (no `robots: {index: false}` override) — unlike `/wishlist`. Per D-005's crawlability principle, `/wishlist` is noindexed because its content is personal, `localStorage`-derived, with nothing universal to rank for. `/archive` is the opposite: PROJECT.md §90's own Initial Sitemap lists "Archive" as a permanent top-level entry (unlike Wishlist, which §90 nests under the still-unbuilt Account and which D-061 chose to noindex anyway for the reason above). Even the empty state is genuine, static-per-collection-state content, identical for every visitor — once populated, individual past collections are legitimate, rankable content (e.g. "Esque Collection 001").

`/archive` is added to `app/sitemap.ts` as a static path. `/archive/[handle]` entries are **not** — mirroring `/products/[handle]`'s already-established, honestly-documented limitation: enumerating real archived-collection handles needs a real store with real archived collections, neither of which exists. Once real archived collections exist, they're discoverable the same way PDPs are today: crawled via the real links `/archive`'s own index page renders.

Both pages get `BreadcrumbList` JSON-LD (Home → Archive[, → Collection Title]), matching `CategoryListing`'s precedent. No `Product` JSON-LD on `/archive/[handle]` — it's a listing page, not a canonical single-product page, exactly like category pages (which also only carry `BreadcrumbList`, not per-grid-item `Product` schema).

## Demo Mode

`getCollections`/`getCollection`/`getProductsByCollection` have **zero** existing Demo Mode coverage (confirmed by inspection — only `getProduct`/`getProducts`/`searchProducts` branch on `PREVIEW_DEMO_MODE`). Since this task is these functions' first real consumer, and since every recent feature (Search D-058, Quick Add D-060, Wishlist D-061) shipped Demo Mode coverage in the same pass rather than as a deferred follow-on, this pass adds it too — proportionate, consistent with established practice, and necessary for genuinely verifying the populated (non-empty) path at all in this no-real-store environment.

`preview-demo-fixtures.ts` gains:
- `PREVIEW_COLLECTIONS`: two `CollectionSummary` fixtures — `collection-001` (current, `dropStatus: 'active'`) and `collection-000` (archived, `dropStatus: 'archived'`).
- `getPreviewCollectionDetail(handle)`: full `CollectionDetail` for each of the above (null otherwise) — proving both branches: the archived one populates `/archive`/`/archive/[handle]`, and requesting `collection-001` via the archive path must still resolve to `null` (exercising the "exists but not archived → not-found" branch for real, not just by inspection).
- Two new fixture products (reusing existing `product-1.jpg`/`product-2.jpg` stock photos under new demo titles/types — these are explicitly generic, licensed placeholder photos with no claimed 1:1 product identity, so reusing a file under a different demo title is consistent with their existing "temporary preview placeholder" framing) plus a shared `getPreviewProductsByCollection(handle)` used by `getProductsByCollection`'s new Demo Mode branch.

Demo Mode short-circuits are added to `lib/shopify/collections.ts`'s `getCollection`/`getCollections` and `lib/shopify/products.ts`'s `getProductsByCollection` (mirroring `getProduct`/`getProducts`'s existing first-statement-check shape exactly) — **not** inside `lib/archive/collections.ts`. This keeps the Demo Mode boundary at the one consistent layer (`lib/shopify/*.ts`) it has always lived at; `lib/archive/collections.ts` calls `getCollections`/`getCollection` normally and inherits Demo Mode transparently, exactly like `getSelectedPieces`/`getInteractiveModelLook` already do for products.

## Analytics — deliberately not wired this pass

PROJECT.md §82 names "archive interaction" (Interactive Experience) and "collection interactions"; D-055 previously flagged both as unattached because `/archive` didn't exist. Considered here and deliberately still not wired: `/archive`/`/archive/[handle]` have no discrete interactive mechanism this pass (no hotspot, no toggle, no panel — just plain server-rendered links, exactly like `CategoryListing`, which also fires zero bespoke "category viewed" event and relies on GA4's automatic `page_view`). Adding a client-only wrapper solely to fire a mount-time event would introduce a new client-JS boundary on an otherwise fully static, SEO-critical pair of routes for a signal GA4's own automatic page-view tracking already substantially covers — the same call D-058 made for not wiring a bespoke event onto the zero-JS `FilterBar`. Deferred to whenever Archive gains a genuine discrete interaction (e.g. Scene 07's `ENTER ARCHIVE` CTA, or a future `NOTIFY IF RETURNED`), matching PROJECT.md §41's own "Future possibility" framing for that feature.

## Testing

- **Unit** (`lib/archive/collections.test.ts`): `isCollectionArchived` (archived via status, via archivedAt, via both, neither); `getArchivedCollections` (filters correctly, propagates a thrown error — does NOT swallow); `getArchivedCollection` (archived → returned, nonexistent → null, exists-but-current → null, propagates a thrown error).
- **Unit** (`lib/shopify/collections.test.ts`, `lib/shopify/products.test.ts`, `lib/shopify/preview-demo-fixtures.test.ts`): Demo Mode branches, mirroring this codebase's existing Demo Mode test blocks exactly; `getProductsByCollection`'s existing tests updated for the new `description` field.
- **E2E** (`tests/e2e/archive.spec.ts`, new): both routes reach the generic error boundary in this unconfigured-Shopify environment (mirrors `catalog.spec.ts`/`pdp.spec.ts` exactly — the honest limit of what's E2E-verifiable without a real store); static/dynamic `<title>` independent of the Shopify call failing; `/sitemap.xml` lists `/archive`.
- **E2E** (`tests/e2e/smoke.spec.ts`, edit): Footer's link-enumeration test and "navigates to a real page, not a 404" loop both extended with Archive.
- **Manual/live verification** (not committed, matching D-057/D-058/D-060's established technique — `playwright.config.ts` has one shared `webServer` with a fixed env block, so the Demo-Mode-ON path cannot be a permanent, committed Playwright test): a live `PREVIEW_DEMO_MODE=1` dev-server pass confirming the populated `/archive` list, a real `/archive/collection-000` view with two real (fixture) products each showing `UNAVAILABLE`, and `/archive/collection-001` (current, not archived) correctly 404ing. Also confirm `pnpm build` succeeds in the real (Shopify-unconfigured) environment with `/archive`'s `force-dynamic` export in place.

## New Architectural Decisions to Record

- Archived-vs-current detection (`dropStatus === 'archived' OR archivedAt !== null`) and why it's defensive/OR, not AND.
- `/archive`'s error-propagation choice vs. `getSelectedPieces`'s D-033 exception, and why they differ.
- `/archive`'s `force-dynamic` requirement and the build-time-safety reasoning behind it.
- The `UNAVAILABLE`-vs-`SOLD OUT` architectural distinction (collection-level vs. inventory-level) and which existing visual pattern it reuses.
- `ArchivedProductTile` as an explicit variant component, not a `ProductCard` boolean flag.
- Navigation placement (Footer/"Shopping", not Header/MENU) and SEO indexability, with reasoning.
- Demo Mode extension scope and placement.
- Deliberately-scoped-out items: PDP collection-context, nested per-product route, collection hero image, archive-specific analytics, `/archive/[handle]` sitemap entries.

## Explicitly Open / Out of Scope for This Spec

- Whether a real store's `drop_status` values will exactly equal `'active'`/`'archived'` (same class of caveat as D-023's `productType` strings) — unverifiable without one.
- Sort order of multiple archived collections on `/archive` (this pass renders `getCollections`'s own API order; no client-side re-sort is added — nothing to prove a chosen order against with a zero-length real list).
- `NOTIFY IF RETURNED` (PROJECT.md §41's own named "Future possibility").

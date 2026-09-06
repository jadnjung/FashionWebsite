# Esque — Homepage

Status: Design spec, written for implementation planning.
Scope: ROADMAP.md Phase 7 (Homepage), narrowed per-scene — real, finished builds for the three scenes with no creative-asset dependency (03, 05, 06), a real Shopify-backed mechanism with honest placeholder photography for Selected Pieces (04), a real structural placeholder for the Interactive Model (02, Phase 8's own feature), and the Collection Hero (01) built with real structure around two clearly-labeled placeholder content slots. Archive Preview (07) is omitted this pass.

## Context

Phases 0-6 are complete and on `main`: design tokens, the storefront shell (Header/FullScreenMenu/Footer), the Shopify Storefront API client, seven catalog routes, a real PDP, and the access gate. `app/(storefront)/page.tsx` is still Phase 0's placeholder (`<h1>ESQUE</h1>` + "COLLECTION 001 — IN DEVELOPMENT"). This phase replaces it with the real, seven-scene homepage PROJECT.md §23 and DESIGN_SYSTEM.md §27-36/§58 describe — six of the seven scenes; see Non-Goals for the seventh.

This phase's blocker shape is different from Phase 4/5's. Phase 4/5 were narrowed because Shopify data didn't exist to verify commerce mechanisms against. Here, the mechanisms are almost entirely buildable — most scenes are typography/layout/navigation with no commerce dependency at all — but PROJECT.md §101 explicitly lists photography style, model casting, campaign direction, and Collection 001's final name/launch date as still-open **creative** decisions. Two scenes (01 Hero, 04 Selected Pieces) are the ones that actually need photography; the other five don't. This spec follows the project's established convention for that situation (D-012's placeholder-nav precedent, DESIGN_SYSTEM.md §65's explicit placeholder-labeling convention, D-027/D-030's "mechanism real, content honestly illustrative" pattern) rather than either inventing unapproved brand content or leaving buildable scenes unbuilt.

Source of truth: PROJECT.md §22-30 (homepage philosophy, structure, interactive model, mobile), §61-66 (photography placeholders, motion philosophy/rule), §101 (open creative decisions); DESIGN_SYSTEM.md §27-36 (the seven scenes), §58-59 (mobile homepage, mobile motion), §61-65 (performance budget, reduced motion, placeholder-asset convention); ROADMAP.md Phase 7 (this phase), Phase 8 (Interactive Model owns Scene 02 in full), Phase 9 (Advanced Motion owns "Parallax / depth on homepage scenes" — see Non-Goals); CONTENT.md §1-2, §8, §10-11 (voice, case, scarcity/drop copy, CTA vocabulary, naming); DECISIONS.md D-006/D-013 (layered motion stack, cheapest-tier precedent), D-012 (placeholder-data precedent), D-023 (single-source-of-truth taxonomy), D-024/D-025/D-028/D-030 (this project's established narrowing discipline for missing data/assets).

## Goals

ROADMAP.md Phase 7's seven scenes, built to the depth each one's real blockers allow:

- **Scene 01 — Collection Hero**: full real structure (100svh section, COLLECTION 001 identifier, ENTER COLLECTION CTA to `/new`, atmospheric ESQUE typography as the page's h1). Two content slots — the campaign image and the campaign statement — are clearly-labeled placeholders, since PROJECT.md §101 lists campaign direction as an open decision and DESIGN_SYSTEM.md gives no concrete copy for this scene (unlike 03/06).
- **Scene 02 — Interactive Model**: a real, static, clearly-labeled placeholder/coming-soon slot only. ROADMAP.md Phase 8 owns the real feature (hotspots, product panel, mobile tap behavior, motion, Shop the Look) as its own multi-stage signature feature; nothing interactive is attempted here.
- **Scene 03 — Collection Statement**: full real build. Typography-only, no photography dependency, real copy (DESIGN_SYSTEM.md §32's own worked example — the only concrete copy the spec gives for this scene).
- **Scene 04 — Selected Pieces**: a real, Shopify-backed mechanism (up to three real products via a new, page-isolated `getSelectedPieces`, reusing the already-tested `getProducts` and the existing `ProductCard`). Real photography is whatever Shopify eventually has — none yet, so `ProductCard`'s existing graceful "no image → solid surface-color block" behavior is this scene's honest placeholder treatment, at zero new code.
- **Scene 05 — Categories**: full real build. Three large category links (TOPS/BOTTOMS/ETC.) sourced from the existing taxonomy, navigating to the real Phase 4 category routes.
- **Scene 06 — Drop Status**: full real build. Real copy verbatim from DESIGN_SYSTEM.md §35/CONTENT.md §8, zero Shopify dependency (see Non-Goals for why the piece count is static, not live-queried).
- **Scene 07 — Archive Preview**: omitted this pass (see Non-Goals).

End state: a real, server-rendered, zero-client-JS homepage (Selected Pieces' data fetch is the only Shopify dependency, isolated so it can never take down the other six scenes) that honestly represents what does and doesn't exist yet, ready for Phase 8 to fill in Scene 02 and Phase 9 to add cursor/depth motion on top.

## Explicit Non-Goals (deferred)

- **Scene 02's real interactive-model mechanism** (hotspots, highlighting, product panel, Shop the Look). ROADMAP.md Phase 8 names this as its own five-stage signature feature. Attempting even a partial version here risks contradicting Phase 8's own, more considered design. This pass builds only a static placeholder slot.
- **Scene 07, Archive Preview, entirely.** ROADMAP.md's own Phase 7 line for this scene already says "minimal/hidden until Collection 002 exists," and DESIGN_SYSTEM.md §36 explicitly permits "minimal or hidden" at launch. There is no past collection to preview — Collection 001 is the only one, nothing is archived — and CONTENT.md §7's own copy for this exact situation (`THE ARCHIVE BEGINS HERE.`) has nowhere real to link to yet: `/archive` doesn't exist until ROADMAP.md Phase 11 ("Archive foundation"). DESIGN_SYSTEM.md §58's own Mobile Homepage sequence independently corroborates this — it lists six scenes and Archive Preview is not one of them. Given that, this pass omits Scene 07 outright rather than building a text-only teaser with no working destination, on both mobile and desktop, for consistency.
- **Cursor-driven depth/parallax on any scene** (DESIGN_SYSTEM.md §27's Hero mouse-parallax, and any other scene's depth treatment). ROADMAP.md Phase 9 explicitly and separately owns "Parallax / depth on homepage scenes" as its own line item, grouped with custom cursor and shared-element transitions — a sitewide, coordinated pass, not a per-scene add-on. Building one scene's parallax now would risk conflicting with Phase 9's eventual coordinated design and duplicates work it already owns. This mirrors DESIGN_SYSTEM.md §80's "build functionality before spectacular animation" staging applied at the phase level, not just the component level. Scene 01 does get a plain, one-time CSS entrance fade (see Architecture) — that is ordinary page-load polish, not the cursor-tracked depth effect Phase 9 owns.
- **A live-computed piece count for Scene 06.** PROJECT.md §23 calls this scene "current availability," which invites a live query, but no query exists yet that scopes products to a specific Collection (D-030 already established this gap for the PDP), and with only one real collection in the catalog, a "live" count computed from the unscoped root `products` connection could not yet prove itself different from a hardcoded number — the identical reasoning D-030 already used to defer PDP drop/collection context. This pass uses the static, already-committed figure from PROJECT.md §8 (Collection 001 launches with six pieces) instead.
- **Category imagery-on-hover for Scene 05.** DESIGN_SYSTEM.md's fuller vision has hovering a category reveal editorial imagery; no real category photography exists (PROJECT.md §101). The hover treatment that is built (a color shift, reusing `FullScreenMenu`'s exact `hover:text-esque-forest` treatment) needs no photography and is fully real.
- **Any new client-side JavaScript.** Every scene this pass is presentational, data-driven, or link-driven — none needs interactivity beyond what a plain `<Link>` and CSS `:hover`/`:focus-visible` already provide. The homepage ships as pure Server Components (the same zero-JS bar `ProductCard`/`ProductGrid` already hit in Phase 4).
- **A scroll-reactive transparent-over-hero header.** DESIGN_SYSTEM.md §24 describes the header as "transparent over hero when readable; solid/dark after necessary scroll state" — real, but filed under Main Navigation (Phase 3's shell domain, already marked done without this behavior), not the Scene 01-07 homepage spec this phase covers. It would add new scroll-tracking client JS to `Header`/`ShellClient`, a shared component every route uses, for a cross-cutting nav enhancement rather than homepage content — a better fit for Phase 9's scroll/motion work than a side effect of building scenes. `Header`'s current solid `bg-esque-black` already reads correctly over Hero's own near-black background; nothing is functionally broken by deferring the transparency polish.
- **Live-store verification of anything.** Identical constraint to every prior phase: Scene 04's mechanism is built and unit-tested against a fixture-shaped mock of `getProducts`; whether real photography or a real product mix reads well in that composition is not verifiable without a store.

## New Architectural Decisions to Record

- **D-032**: Records the per-scene scope table above as a durable decision — which scenes ship fully real (03, 05, 06), which ship a real mechanism around clearly-labeled placeholder content (01, 04), which ship a placeholder slot only (02, Phase 8's), and which are omitted outright (07) — plus the explicit deferral of all cursor/depth motion to ROADMAP.md Phase 9 and the non-live Scene 06 piece count.
- **D-033**: The homepage's one Shopify dependency (Selected Pieces) is isolated at the `lib/home/` layer — a thrown error is caught, logged, and resolved to an empty list — so a Shopify failure never takes down the six scenes that don't need Shopify at all. This is a deliberate, narrowly-scoped exception to this codebase's otherwise-consistent "never swallow a real Shopify error" rule, justified specifically by the homepage's brand-first, multi-scene nature (PROJECT.md §22) — not a precedent for category/PDP pages, whose entire reason for existing is the commerce data itself.

## Architecture

### Route and data flow

```
app/(storefront)/page.tsx  (Server Component, async)
  │
  ├─► getSelectedPieces(3)          [lib/home/selected-pieces.ts]
  │     └─ try { getProducts({ first: 3 }) } catch { log; return [] }
  │        — the page's only await; every other scene is static markup
  │
  └─► <CollectionHero />
      <InteractiveModelPlaceholder />
      <CollectionStatement />
      <SelectedPieces products={selectedPieces} />
      <CategoryShowcase />
      <DropStatus />
```

Scene order matches PROJECT.md §23 and DESIGN_SYSTEM.md §58's Mobile Homepage sequence exactly (both agree on Hero → Interactive Model → Collection Statement → Selected Pieces → Categories → Drop Status) — no divergent mobile/desktop ordering is needed; each scene handles its own responsive composition internally.

### Component breakdown — `components/home/` (new directory, parallel to `components/catalog/`/`components/product/`)

All six are Server Components; none needs `'use client'`.

- **`CollectionHero.tsx`** — Scene 01. `min-h-[100svh]` section. Renders, in order: a placeholder campaign-image layer (`bg-linear-to-b from-esque-surface to-esque-black`, per Tailwind v4's renamed gradient utility — verified against current docs before use, not assumed from v3 memory) with a small `ESQUE PLACEHOLDER — CAMPAIGN, HERO` label styled exactly like `SizeGuidePanel`'s existing `ESQUE PLACEHOLDER — MEASUREMENTS` marker (`text-utility uppercase tracking-metadata text-esque-text-muted`) per DESIGN_SYSTEM.md §65's convention; an absolutely-positioned, low-opacity (`text-esque-text/10`) giant `<h1>ESQUE</h1>` bleeding off one corner (`text-display-xl`, `pointer-events-none`, `select-none`) — doubles as the page's one semantic h1 (a common, correct pattern: a homepage's h1 names the site itself) and needs no contrast exception beyond what WCAG 1.4.3 already grants logo/brand-name text; `COLLECTION 001` (real, CONTENT.md §11-sanctioned); a campaign-statement placeholder using that same small, muted marker style — deliberately *not* sized as the real statement eventually will be, since placeholder text rendered at display scale would read as broken production copy rather than an honest, deliberate placeholder; and an `ENTER COLLECTION` link (DESIGN_SYSTEM.md §27's own literal Scene-01 content list — not the separate, arrow-suffixed `EXPLORE COLLECTION →` phrase) to `/new`, the closest real, working "current collection" destination until `/collections/[handle]` exists. A one-time CSS entrance fade on the foreground text group only (reusing the existing `esque-access-error-message`-style `animation-delay`/`backwards` fill-mode technique already in `app/globals.css`, automatically covered by the sitewide `prefers-reduced-motion` rule) is in scope; the background layer and the atmospheric h1 render at full opacity immediately, un-animated, so neither can delay this page's LCP paint. Cursor parallax is not in scope (Non-Goals).
- **`InteractiveModelPlaceholder.tsx`** — Scene 02. Static section: `LOOK 01` (DESIGN_SYSTEM.md §29's own suggested copy), a placeholder image block labeled `ESQUE PLACEHOLDER — MODEL, FULL BODY` (§65's own literal example), and an `ARRIVING SOON.` heading in the established terse-statement voice (CONTENT.md §1's short, period-terminated pattern). No hover state, no hotspots.
- **`CollectionStatement.tsx`** — Scene 03. Typography-only, no imagery (no photography dependency, so nothing is left placeholder): `COLLECTION 001` (small, supporting) and `NOT MADE TO REMAIN.` (`text-display-l`, the h2 — DESIGN_SYSTEM.md §32's own worked example; not independently reproduced in CONTENT.md's canonical copy list the way Scene 06's block is, so flagged here as reasonably real but revisit if official campaign copy supersedes it).
- **`SelectedPieces.tsx`** — Scene 04. Receives `products: ProductListItem[]` from the page. Returns `null` when empty (D-033). Otherwise renders a curated asymmetric composition — one large piece + up to two smaller pieces stacked beside it — reusing `ProductCard` as-is (`layout="featured"` for the large piece; `layout="standard"` plus a new optional `sizes` override for the smaller pieces, see below). Single column below `lg` (every card full width), splitting to an 8+4-column composition at `lg` and up, matching `ProductGrid`'s own periodic 8/4 column math (so `ProductCard`'s existing `featured` sizing hint is already dimensionally correct for the large piece with no changes).
- **`CategoryShowcase.tsx`** — Scene 05. Three large `text-display-l` links (TOPS/BOTTOMS/ETC.), labels from `getCategoryLabel` (`lib/catalog/taxonomy.ts` — the same NAVIGATION-derived source of truth Header/FullScreenMenu/category pages already use, not a fourth parallel list), hrefs to the real `/tops`, `/bottoms`, `/etc` routes. Hover reuses `FullScreenMenu`'s exact `hover:text-esque-forest` treatment. A visually-hidden (`sr-only`) `<h2>Shop by Category</h2>` gives the section a heading for screen-reader heading-navigation without visually duplicating what the giant category words already communicate to sighted users.
- **`DropStatus.tsx`** — Scene 06. Three real lines verbatim from DESIGN_SYSTEM.md §35/CONTENT.md §8: `COLLECTION 001`, `06 PIECES` (the h2 — visually dominant, matching Scene 03's "largest line is the heading" pattern), `AVAILABLE UNTIL GONE`. Zero Shopify dependency (see Non-Goals).

### `lib/home/selected-pieces.ts` (new directory, parallel to `lib/catalog/`/`lib/product/`)

```typescript
import { getProducts, type ProductListItem } from '@/lib/shopify/products';

const SELECTED_PIECES_COUNT = 3;

// Isolates the homepage's one Shopify dependency (D-033): a thrown error
// (unconfigured store, throttled request, malformed query — anything
// getProducts itself correctly throws on rather than swallowing) resolves
// to an empty list here instead of propagating to app/error.tsx. This is a
// deliberate, narrow exception to this codebase's usual "never swallow a
// real Shopify error" rule — justified because PROJECT.md §22 frames the
// homepage as primarily a brand-world experience, not a catalog, and six
// of its seven scenes have no Shopify dependency at all. Logs so the
// failure stays operationally visible even though the page degrades
// gracefully.
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

No availability filtering — PROJECT.md §40 requires sold-out products to remain visible, not hidden, so a sold-out piece may still be "selected"; `ProductCard`'s existing SOLD OUT badge already handles that correctly.

### `ProductCard.tsx` — one small, additive extension

Adds an optional `sizes?: string` prop that overrides the existing `IMAGE_SIZES[layout]` default when provided. `ProductGrid`'s existing usage is untouched (no `sizes` passed, same default behavior). `SelectedPieces`'s smaller cards pass `sizes="(min-width: 1024px) 33vw, 100vw"` — `IMAGE_SIZES.standard`'s existing desktop branch (`33vw`) is already correct for their `lg:col-span-4` width, but its mobile branch (`50vw`, correct for `ProductGrid`'s 2-up mobile rhythm) would under-request resolution for `SelectedPieces`'s single-column-below-`lg` composition, visibly softening the image. This is a small, backward-compatible correctness fix, not a new pattern — `layout` still governs nothing else on the component (hover crossfade, SOLD OUT badge, focus ring are unaffected).

### Accessibility

Heading structure: exactly one `<h1>` (Hero's atmospheric ESQUE), one `<h2>` per rendered scene thereafter (Interactive Model placeholder, Collection Statement, Selected Pieces when non-empty, Categories [`sr-only`], Drop Status) — never skipped, never a competing heading level. Every scene is a landmark `<section>` with either a visible heading or an `aria-label` (matching the existing `aria-label` + visible-`<h2>` redundancy already established by `ProductDetail`'s related-products section and `RecentlyViewed`). All interactive elements (the three category links, the Hero CTA, product-card links) are real `<Link>`s with the project's standard `focus-visible:outline-esque-text` ring (D-010) — no custom widgets, no keyboard code to write. The Hero's low-opacity giant wordmark needs no contrast exception beyond WCAG 1.4.3's existing carve-out for logo/brand-name text (it's real, always-present text content regardless of visual opacity — a screen reader announces it normally). Reduced motion: the only motion this pass ships (Hero's one-time entrance fade) reuses the existing sitewide `@media (prefers-reduced-motion: reduce)` rule in `app/globals.css`, which already zeroes all animation durations — no bespoke handling needed, unlike a JS-driven effect would require.

### Responsive behavior

Per DESIGN_SYSTEM.md §60 ("do not simply scale desktop compositions down"): Hero's campaign-statement placeholder text steps down a size at `md`; Selected Pieces collapses its asymmetric split to a single stacked column below `lg` (not just visually smaller — a genuinely different composition, matching `ProductDetail`'s own established "single column below `lg`" precedent); Categories' and Drop Status' type already clamps or is a fixed size proven safe at this text length elsewhere in the codebase (`text-heading-1` is already used unhedged for arbitrary-length product titles in `ProductPurchasePanel`). No scene depends on hover for anything essential — every hover treatment (Category color shift, ProductCard's crossfade) has a fully-functional non-hover default.

## Error, Not-Found, and Empty States

- **Shopify unconfigured/unreachable** (Selected Pieces only): caught in `getSelectedPieces`, logged, resolved to `[]`. `SelectedPieces` renders `null` — the section is entirely absent, not an empty-grid or an error message. The other six scenes render unconditionally regardless of Shopify's state — this is the core behavior this phase's testing must prove.
- **Selected Pieces returns fewer than 3 real products** (1 or 2): renders gracefully — the "smaller pieces" column is omitted entirely when there's nothing to put in it (`rest.length > 0` guard), never a broken partial layout.
- **Scene 07**: not an error state — a deliberate omission (Non-Goals), matching ROADMAP.md's own "minimal/hidden" allowance and CONTENT.md §7's existing `THE ARCHIVE BEGINS HERE.` copy, which has nowhere real to link yet.

## Testing

No live store exists — identical constraint to every prior phase:

- **Unit (Vitest), fixture-driven**: `lib/home/selected-pieces.ts` — mocks `@/lib/shopify/products`' `getProducts` (matching `lib/shopify/products.test.ts`'s own `vi.spyOn` pattern, one layer up from mocking the Storefront client directly): a successful response returns the products; a thrown error (both a generic Shopify error and the client's "not configured" error, mirroring the two failure shapes `products.test.ts` already covers) resolves to `[]` rather than propagating, and logs via `console.error` (asserted with a mocked spy) so the failure stays operationally visible.
- **E2E (Playwright)**, everything genuinely reachable without a store:
  - The homepage renders all six real scenes' content successfully with Shopify unconfigured — the load-bearing proof that Scene 04's isolated failure doesn't take the other five scenes (or the shell) down with it. This is the one thing this phase most needs to prove and the one thing a live-store test could not prove any more convincingly than an unconfigured one does.
  - Selected Pieces' section is genuinely absent (its heading is not present) when Shopify is unconfigured — proving the graceful-omission path, not just "the page didn't crash."
  - Each scene's real content/links are present and correctly wired: Hero's `ENTER COLLECTION` link navigates to `/new`; Category links navigate to `/tops`, `/bottoms`, `/etc`; placeholder labels (`ESQUE PLACEHOLDER — …`) are genuinely visible, not just present in a code comment.
  - Exactly one `<h1>` on the page; a 375px viewport produces no horizontal overflow (mirroring the existing Header mobile-overflow regression test's technique).
  - Not reachable this pass without a store: whether real product data/photography composes well in Selected Pieces' layout, and Scene 06's piece count ever diverging from its static value.
  - `components/home/*` get no dedicated component test file, matching every prior phase's precedent (no jsdom/RTL in this project) — coverage comes from `pnpm typecheck`/`pnpm build` plus the E2E tests above.
- `tests/e2e/smoke.spec.ts`'s existing `homepage placeholder` describe block (asserting the old `COLLECTION 001 — IN DEVELOPMENT` placeholder text) is replaced by the above — a legitimate update to a test whose entire subject is the temporary placeholder this phase deliberately replaces, not a weakening of coverage (the new suite asserts the same underlying fact, that the page renders real branded content, plus substantially more).

## Explicitly Open / Out of Scope for This Spec

- **The homepage's rendering strategy is Next.js's own default (fully static at build time), not ISR.** `/` reads no `searchParams`/cookies/dynamic segment, so with nothing forcing dynamism, Next.js prerenders it once at build time — confirmed in `pnpm build`'s route listing (`○ (Static)`). Selected Pieces' fetch therefore only re-runs on a new build/deploy, not per-request; ARCHITECTURE.md §4 calls for "ISR/or on-demand revalidation for product/collection data" generally, and no page in this codebase implements that yet (category pages/PDP get freshness for free, as a side effect of reading `searchParams` or an uncached dynamic segment, not from a deliberate revalidation strategy). Adding `export const revalidate = N` would be a one-line, well-established fix, but choosing a defensible `N` is a product question (how often would a real curated selection actually change?) with nothing in PROJECT.md/DESIGN_SYSTEM.md to ground it — the same class of "don't guess past real uncertainty" this project already applies elsewhere (D-016/D-025). Deferred rather than guessed; revisit once a real store exists to inform a real interval, or fold into ROADMAP.md Phase 12's performance pass.
- Whether "ENTER COLLECTION" should eventually point at a real `/collections/[handle]` route instead of `/new` — revisit once that route exists (unbuilt per ARCHITECTURE.md §3, tracked by a later phase).
- Whether DESIGN_SYSTEM.md §32's "NOT MADE TO REMAIN." is meant as final campaign copy or only a style example — flagged in Architecture; not resolvable without the project owner's input, and cheap to change later regardless.
- Scene 02's real mechanism, Scene 07 entirely, and all cursor/depth motion — see Non-Goals; each belongs to a later, already-named ROADMAP phase.
- Whether Selected Pieces' curated composition still reads well once real photography and a larger real catalog exist — unverifiable without both.

# Esque — Architecture

Status: V1 baseline
Companion docs: [PROJECT.md](./PROJECT.md) (what to build) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (how it should look/move) · [DECISIONS.md](./DECISIONS.md) (why) · [ROADMAP.md](./ROADMAP.md) (when)

This document defines the technical architecture for the Esque storefront. It exists so that implementation choices stay consistent across sessions and agents — see [DECISIONS.md](./DECISIONS.md) for the reasoning behind the choices made here.

## 1. Core Split: Commerce vs Presentation

Per [PROJECT.md §95](./PROJECT.md#95-technical-north-star):

- **Shopify** owns commerce integrity — products, variants, pricing, inventory, orders, discounts, customer records, payments, checkout, fulfillment, refunds.
- **The custom Next.js frontend** owns the digital fashion experience — design, animation, navigation, page transitions, product discovery, the interactive model, collection experiences, typography, the access gate, and frontend search.

Nothing in the presentation layer should be able to corrupt commerce state. All writes to cart/checkout go through Shopify's Storefront API and Shopify Checkout — the frontend never re-implements payments, inventory decrementing, or order logic itself.

## 2. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Commerce backend | Shopify (Basic plan) | Products, variants, inventory, collections, customers, orders, discounts, payments, checkout |
| Storefront framework | Next.js (App Router), TypeScript | Chosen over Shopify Hydrogen/Remix to avoid over-coupling to Shopify's opinionated stack per [PROJECT.md §51](./PROJECT.md#51-frontend-architecture); talks to Shopify directly via the Storefront API |
| Data fetching | Shopify Storefront API (GraphQL) | Product/collection/cart reads, cart mutations |
| Checkout | Shopify Checkout | Hosted checkout, no custom payment handling |
| Styling | CSS with design tokens (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)) + Tailwind or CSS Modules (TBD at scaffold time) | Token-driven to keep color/spacing/type consistent across experimental layouts |
| Motion | Native CSS transitions/transforms + View Transitions + Motion (Framer Motion) for component/layout motion; GSAP only for complex sequences; Three.js only for isolated high-impact features | Per [DESIGN_SYSTEM.md §62](./DESIGN_SYSTEM.md#62-recommended-frontend-motion-stack) — do not stack multiple animation systems for the same job |
| Hosting/deploy | Vercel | Edge rendering, image optimization, preview deployments |
| Email | Klaviyo (free tier at launch) | Access password email, welcome, collection announcements, abandoned cart, back-in-stock |
| Analytics | Shopify Analytics + Google Analytics 4 + Google Search Console | Add Meta/TikTok pixels, Clarity, etc. only when a real marketing need exists |
| Testing | Playwright (already scaffolded) for E2E; add unit/component tests as the codebase grows | `pnpm test:e2e` is already wired up |
| Package manager | pnpm | Already the project's lockfile; do not introduce a second package manager |
| Node version | 22 (per `.nvmrc`) | |

## 3. Repository Structure (target, once scaffolded)

```
/
├── app/                      # Next.js App Router
│   ├── (access)/              # Access gate — outside the main shell
│   ├── (storefront)/
│   │   ├── page.tsx           # Home
│   │   ├── new/
│   │   ├── tops/[category]/
│   │   ├── bottoms/[category]/
│   │   ├── etc/[category]/
│   │   ├── collections/[handle]/
│   │   ├── archive/
│   │   ├── products/[handle]/
│   │   ├── search/
│   │   ├── bag/
│   │   ├── account/
│   │   ├── about/
│   │   ├── contact/
│   │   └── legal/
│   │       ├── privacy/
│   │       ├── terms/
│   │       ├── shipping/
│   │       ├── returns/
│   │       ├── refunds/
│   │       └── accessibility/
│   └── api/                   # Route handlers (Klaviyo webhook proxy, etc.)
├── components/
│   ├── ui/                    # Buttons, inputs, primitives from DESIGN_SYSTEM.md
│   ├── catalog/                # Category listing: product card, grid, filter bar
│   ├── product/                 # PDP: gallery, purchase panel, size guide, recently viewed
│   ├── home/                    # Homepage editorial scenes (Scene 01-06; Scene 07 omitted, see DECISIONS.md D-032)
│   ├── interactive-model/      # Signature hotspot feature — hotspots, product info panel, Shop the Look (ROADMAP Phase 8; Stage 4-5 motion/refinement deferred, see DECISIONS.md D-034)
│   ├── legal/                    # Shared draft-notice/section markup for the six /legal/* pages and /contact — see DECISIONS.md D-054
│   └── navigation/              # Header, full-screen menu, cursor
├── lib/
│   ├── shopify/                # Storefront API client, GraphQL queries/mutations, types
│   ├── catalog/                 # Pure logic for category listing: taxonomy, filters, grid layout
│   ├── product/                  # Pure logic for the PDP: variant matching, scarcity, recently viewed
│   ├── home/                    # Homepage's one Shopify dependency (Selected Pieces), isolated — see DECISIONS.md D-033
│   ├── interactive-model/      # The Interactive Model's Shopify dependency (getInteractiveModelLook) plus pure Shop the Look validity logic, isolated the same way — see DECISIONS.md D-034
│   ├── motion/                 # Shared, DOM-injectable capability checks (reduced motion, fine-pointer-and-hover, low-performance heuristic) for the custom cursor and homepage parallax — see DECISIONS.md D-040/D-041
│   ├── legal/                     # LEGAL_PAGES — single source of truth for the six /legal/* routes, read by Footer.tsx and app/sitemap.ts — see DECISIONS.md D-054
│   ├── klaviyo/                # Email list + password delivery
│   ├── access/                 # Access gate cookie/session logic
│   └── analytics/              # GA4 + Shopify Analytics event helpers
├── content/                    # Static/editorial copy not owned by Shopify (if needed)
├── styles/                     # Design tokens (colors, type scale, spacing) from DESIGN_SYSTEM.md
├── tests/                      # Playwright specs
├── PROJECT.md
├── DESIGN_SYSTEM.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── ROADMAP.md
└── CLAUDE.md
```

This was a target sketch for when scaffolding began (see [ROADMAP.md](./ROADMAP.md) Phase 0); most of it is now built. One deliberate divergence: `components/commerce/` as originally sketched here was never adopted. Phase 4 (Catalog), Phase 5 (PDP), and Phase 7 (Homepage) instead grouped commerce/page UI by page-type — `components/catalog/` (category listing: product card, grid, filter bar), `components/product/` (PDP: gallery, purchase panel, size guide, recently viewed), and `components/home/` (homepage editorial scenes) — with a parallel `lib/catalog/`/`lib/product/`/`lib/home/` split for the pure logic underneath each. `lib/home/` is intentionally small: the homepage's five other scenes are static markup with no data dependency at all (see DECISIONS.md D-032/D-033). `components/interactive-model/`/`lib/interactive-model/` (ROADMAP.md Phase 8) followed the same pattern one level later — a top-level domain rather than nested under `home/`, since PROJECT.md §26 places this feature on both the homepage and future collection pages. `bag/`, `account/`, `about/`, `archive/`, and `collections/[handle]/` remain unbuilt, tracked by their respective later ROADMAP.md phases. `search/` as a page route was never built and is not planned to be — DECISIONS.md D-058 resolved ROADMAP.md Phase 4's Search item as a full-screen overlay (`components/navigation/SearchOverlay.tsx`, mounted in the shell, triggered from Header) rather than a dedicated route, matching DESIGN_SYSTEM.md §50's own framing (there is no "results page" concept anywhere in the search spec, only the overlay). `app/api/` — sketched above as generic "Route handlers (Klaviyo webhook proxy, etc.)" — got its first real occupant the same pass, `app/api/search/route.ts`, not Klaviyo (Klaviyo's own integration went through a Server Action instead, `app/(access)/access/actions.ts`, per D-020/D-022 — this sketch's original guess about which integration would need a Route Handler first didn't hold, which is fine; the directory's purpose was correct even though the specific tenant wasn't). `lib/analytics/` (ROADMAP.md Phase 12, "Analytics wired") is now built — `events.ts` (the documented, closed event taxonomy and validated dispatch) and `gtag.ts` (the thin, browser-only GA4 adapter, `trackEvent`) — and is what the Interactive Model's own hotspot/Shop-the-Look events (deliberately deferred at Phase 8, per the sentence this replaces) now hook into, alongside the PDP, catalog navigation, and Access Gate. See DECISIONS.md D-055. `lib/motion/` (ROADMAP.md Phase 9) was not part of the original sketch — it holds small, DOM-API-injectable capability checks (mirroring `lib/product/recently-viewed.ts`'s injected-interface pattern for testability in this project's jsdom-less vitest environment) shared by two concurrent Phase 9 consumers (the custom cursor, homepage Hero parallax), extracted as its own domain rather than duplicated or nested under either consumer.

`contact/` and `legal/` (ROADMAP.md Phase 12) are now built, with one deliberate divergence from this sketch: `legal/[slug]/` (a single dynamic route) was not adopted, in favor of six separate static routes (`legal/privacy/`, `legal/terms/`, `legal/shipping/`, `legal/returns/`, `legal/refunds/`, `legal/accessibility/`), each a plain, fully static page with no per-request data dependency. A dynamic segment earns its cost when the set of values is data-driven or open-ended (product handles); six hand-authored, permanently-fixed policy documents are the opposite case, and match this codebase's own existing precedent of one route folder per real page for a small fixed set (`/new`, `/tops`, `/bottoms`, `/etc`, sharing logic through `CategoryListing` rather than a dynamic catch-all). It also sidesteps DECISIONS.md D-026/D-052's documented `notFound()`-on-a-dynamic-route limitation (an invalid `[slug]` would return HTTP 200 + `noindex` instead of a hard 404) for no reason — an unmatched static path already returns a genuine 404. See DECISIONS.md D-054.

`wishlist/` (ROADMAP.md Phase 10's anonymous-local half) is now built, with one deliberate divergence from PROJECT.md §90's sitemap sketch, which nests Wishlist under `Account`: since `account/` itself remains unbuilt (no real Shopify customer accounts exist yet) and this pass builds only the anonymous, `localStorage`-backed half of the feature, `/wishlist` is its own standalone top-level route rather than a sub-page of a section that doesn't exist — matching this codebase's own established route-per-real-feature pattern (`/contact`, `/legal/*`) rather than fabricating an `/account` shell just to nest one real page under it. It is noindexed (`robots: {index: false, follow: false}`, the same shape `/access` already uses) and reachable only via a new Footer nav group, not a persistent Header slot — DESIGN_SYSTEM.md §24's header structure is an exact, quoted five-slot list with no wishlist entry named. `components/product/use-wishlist.ts` (a shared `useSyncExternalStore` hook, needed because `WishlistToggle` and the `/wishlist` page are two concurrent consumers, unlike `RecentlyViewed.tsx`'s single-consumer embedded wiring) is the one new file that doesn't fit `lib/product/`'s "pure logic" scope and lives under `components/product/` instead, for the same reason `RecentlyViewed.tsx`'s own `useSyncExternalStore` wiring already does. See DECISIONS.md D-061.

## 4. Rendering Strategy

- **Product/collection pages**: Server-rendered (RSC) for SEO and fast first paint, with client components for interactive pieces (quick add, interactive model, cursor).
- **Homepage editorial scenes**: Server-rendered shell, client-hydrated for scroll/cursor-driven motion.
- **Cart/bag**: Client state synced with Shopify's Storefront API cart object; cart ID persisted in a cookie.
- **Access gate**: See §6 below — must not block crawlers from indexed commerce routes.
- Use ISR/ or on-demand revalidation for product/collection data so Shopify content edits (via CMS/metafields) show up without a full redeploy.

## 5. Data Model Mapping

Per [PROJECT.md §10](./PROJECT.md#10-collections-vs-categories), **Category** and **Collection** are separate concepts and must map to distinct Shopify structures:

- **Collection** (Collection 001, Collection 002, …) → a Shopify **Collection**, tagged/dated for drop status (active/archived) via metafields (`drop_status`, `drop_date`, `archived_at`). The Storefront API queries (`lib/shopify/queries/collections.ts`) read these three keys under the `"custom"` metafield namespace — when the real store is provisioned, its metafield definitions must use that same namespace, or all three will silently resolve to `null` (not an error), indistinguishable from a collection that simply hasn't set drop status yet.
- **Category** (Tops → Hoodies) → Shopify **product type** + **tags**, or a second collection dimension used purely for taxonomy, not commerce grouping.
- Products carry both: their category taxonomy and their collection membership, queried independently.

Custom editorial content that doesn't fit Shopify's native product/collection fields (campaign statements, interactive-model hotspot coordinates, homepage scene copy) should use **Shopify metaobjects/metafields** first, per [PROJECT.md §81](./PROJECT.md#81-cms-requirements). Only introduce a separate CMS if that becomes insufficient.

## 6. Access Gate Architecture

Per [PROJECT.md §80](./PROJECT.md#80-important-access-gate-seo-rule) and [DESIGN_SYSTEM.md §67](./DESIGN_SYSTEM.md#67-seo--access-gate), the access gate is a **visitor experience**, not a server-level wall:

- Product/collection routes remain server-rendered and crawlable (`robots` allowed, sitemap included, structured data present) regardless of access-cookie state.
- The access gate is enforced at the **UI layer** for human visitors without a valid access cookie (redirect-to-gate on client navigation, or a lightweight middleware check that still allows bots/crawlers through based on user-agent + still serves full HTML either way).
- Access cookie: general access, ~30 days, `httpOnly`, `secure`, `sameSite=lax`. Drop-specific/VIP access stored as a separate cookie/claim so tiers don't collide.
- Password validation happens server-side (Route Handler or Server Action) — never compare passwords client-side only.

## 7. Environment Variables (draft — fill in once the Shopify store exists)

```
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_API_TOKEN=
SHOPIFY_STOREFRONT_API_VERSION=
KLAVIYO_PRIVATE_API_KEY=
KLAVIYO_LIST_ID=
ESQUE_ACCESS_PASSWORD=          # or fetched from a Shopify metafield so it's editable without redeploy
ESQUE_EARLY_ACCESS_PASSWORD=
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=   # Search Console verification meta tag content — not a secret
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPPORT_EMAIL=       # shown on /contact; not a secret. See DECISIONS.md D-054.
PREVIEW_DEMO_MODE=               # opt-in Demo Mode, off by default everywhere. See DECISIONS.md D-057.
```

No secrets are committed. `.env.local` is gitignored; production secrets live in Vercel's environment variable settings.

`PREVIEW_DEMO_MODE` is not a commerce/integration credential like the rest of this list — it's a local build-time toggle (`lib/shopify/products.ts`, `next.config.ts`) that substitutes real Shopify data with typed, licensed stock-photo fixtures (`lib/shopify/preview-demo-fixtures.ts`) for stakeholder-preview convenience. See [DECISIONS.md D-057](./DECISIONS.md) for the full architectural boundary — it's a narrow, additive, opt-in exception, not a change to §6's access-gate architecture or to how the real Shopify data path in §5 behaves when the flag is unset (always true in CI and any deployment unless someone deliberately sets it).

## 8. Third-Party Integrations

- **Klaviyo**: triggered from a Route Handler on Request Access submission and on successful order webhook (via Shopify) for abandoned cart / back-in-stock flows.
- **GA4 / Search Console**: GA4 loaded via `@next/third-parties`'s `GoogleAnalytics` component (root `app/layout.tsx`, every route including `/access`), gated on `NEXT_PUBLIC_GA4_MEASUREMENT_ID` and using that component's own default `next/script` `afterInteractive` strategy — no script at all renders when unconfigured. `trackEvent` (`lib/analytics/gtag.ts`) is the one function UI code calls to record a real, taxonomy-validated event (`lib/analytics/events.ts`); see DECISIONS.md D-055 for the full taxonomy and design. Search Console verification is a `<meta name="google-site-verification">` tag via Next's `Metadata.verification.google` field, gated on `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — the DNS/HTML-file alternatives remain valid, equally supported ops choices that need no code either way.
- **Shopify webhooks**: order creation, inventory updates — used to keep any cached product/inventory state fresh if caching is introduced later.

## 9. Performance Baseline

Per [PROJECT.md §76](./PROJECT.md#76-performance-requirements) and [DESIGN_SYSTEM.md §61](./DESIGN_SYSTEM.md#61-performance-budget-philosophy):

- Next.js `<Image>` for all product/editorial imagery (responsive sizes, modern formats, lazy loading below the fold).
- Route-level code splitting is automatic with the App Router; keep heavy motion/WebGL code in dynamically-imported client components so it never blocks initial paint.
- No animation library is loaded on routes that don't use it.

## 10. Open Architecture Decisions

These remain open until resolved (see [PROJECT.md §101](./PROJECT.md#101-items-still-intentionally-open)):

- Exact CSS approach (Tailwind vs CSS Modules vs vanilla-extract) — pick at scaffold time, whichever is fastest to keep consistent with the token system.
- Whether cart state uses Shopify's Cart API directly or a thin wrapper/store (Zustand/Context) around it.
- Whether the interactive-model hotspot coordinates are authored as SVG masks checked into the repo per product, or stored as metafield JSON per product (affects whether non-engineers can adjust hotspots without a deploy).
</content>

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
│   │   └── legal/[slug]/
│   └── api/                   # Route handlers (Klaviyo webhook proxy, etc.)
├── components/
│   ├── ui/                    # Buttons, inputs, primitives from DESIGN_SYSTEM.md
│   ├── commerce/               # Product card, quick add, bag line item, size selector
│   ├── interactive-model/      # Signature hotspot component
│   └── navigation/              # Header, full-screen menu, cursor
├── lib/
│   ├── shopify/                # Storefront API client, GraphQL queries/mutations, types
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

This structure is a target for when scaffolding begins (see [ROADMAP.md](./ROADMAP.md) Phase 0) — it is not yet built.

## 4. Rendering Strategy

- **Product/collection pages**: Server-rendered (RSC) for SEO and fast first paint, with client components for interactive pieces (quick add, interactive model, cursor).
- **Homepage editorial scenes**: Server-rendered shell, client-hydrated for scroll/cursor-driven motion.
- **Cart/bag**: Client state synced with Shopify's Storefront API cart object; cart ID persisted in a cookie.
- **Access gate**: See §6 below — must not block crawlers from indexed commerce routes.
- Use ISR/ or on-demand revalidation for product/collection data so Shopify content edits (via CMS/metafields) show up without a full redeploy.

## 5. Data Model Mapping

Per [PROJECT.md §10](./PROJECT.md#10-collections-vs-categories), **Category** and **Collection** are separate concepts and must map to distinct Shopify structures:

- **Collection** (Collection 001, Collection 002, …) → a Shopify **Collection**, tagged/dated for drop status (active/archived) via metafields (`drop_status`, `drop_date`, `archived_at`).
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
NEXT_PUBLIC_SITE_URL=
```

No secrets are committed. `.env.local` is gitignored; production secrets live in Vercel's environment variable settings.

## 8. Third-Party Integrations

- **Klaviyo**: triggered from a Route Handler on Request Access submission and on successful order webhook (via Shopify) for abandoned cart / back-in-stock flows.
- **GA4 / Search Console**: GA4 loaded via a minimal, deferred script; Search Console verified via DNS or HTML file, no script needed.
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

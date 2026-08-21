# Esque — Roadmap

Tracks Collection 001 / V1 build order, near-term follow-ups (V1.1), and deferred ideas (V2+). See [PROJECT.md §91–92](./PROJECT.md#91-v1) for the full required/deferred feature lists and [DESIGN_SYSTEM.md §79–80](./DESIGN_SYSTEM.md#79-build-order) for the build-order rationale (functionality before spectacular animation).

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

## Phase 0 — Project Foundation

- [ ] Create Shopify development store — blocked on the project owner's Shopify account setup; not an implementation task
- [x] Scaffold Next.js (App Router, TypeScript) app on pnpm
- [ ] Connect Vercel project + preview deployments — blocked on the project owner's Vercel account setup; not an implementation task
- [x] Set up environment variable scaffolding (see [ARCHITECTURE.md §7](./ARCHITECTURE.md#7-environment-variables-draft--fill-in-once-the-shopify-store-exists))
- [x] Wire up CI (lint, typecheck, Playwright) — plus format:check and build; no deploy step yet (no Vercel project)

## Phase 1 — Design System / Tokens

- [x] Implement color tokens ([DESIGN_SYSTEM.md §4](./DESIGN_SYSTEM.md#4-core-color-system))
- [x] Implement type scale + two-typeface system ([DESIGN_SYSTEM.md §6–9](./DESIGN_SYSTEM.md#6-typography-system))
- [~] Implement spacing scale + responsive grid ([DESIGN_SYSTEM.md §13–15](./DESIGN_SYSTEM.md#13-spacing-system)) — spacing scale implemented (Tailwind `--spacing` base unit reproduces the 4/8/12/16/24/32/48/64/96/128 scale); the 12/8/4-column responsive grid remains conceptual/undocumented-in-code until Phase 4/5's catalog and PDP layouts give it real content to implement and validate against
- [~] Build base components: buttons, inputs, form fields — Button implemented (primary/secondary/editorial variants); Input and other form fields deliberately deferred (YAGNI — no real consumer exists until Phase 4/6/10's search, request-access, and account forms)

## Phase 2 — Commerce Foundation

- [x] Shopify Storefront API client + typed GraphQL queries
- [x] Product/collection data fetching
- [ ] Cart (Storefront API cart object, persisted cart ID) — deferred pending a real Shopify store; see DECISIONS.md D-016
- [ ] Shopify Checkout handoff — deferred pending a real Shopify store; see DECISIONS.md D-016

## Phase 3 — Core Storefront Shell

- [x] Global layout, header (`ESQUE MENU SEARCH ACCOUNT BAG`) — including a mobile-responsive utility nav (icon-compressed SEARCH/ACCOUNT below `md`, see DECISIONS.md D-014)
- [x] Full-screen experimental menu — focus trap, Escape-to-close, closes on navigation, reduced-motion support
- [x] Footer
- [x] Base page transitions — the full-screen menu's open/close is the one transition that exists in this pass (the homepage placeholder is still a single route); cross-page shared-element transitions are deferred to whichever later phase first introduces a second route (see DECISIONS.md D-013)

## Phase 4 — Catalog

- [ ] New / Tops / Bottoms / Etc. category pages
- [ ] Search (predictive, full-screen overlay)
- [ ] Filters (category, size, color, availability, collection, price, sort)
- [ ] Product grid (unconventional layout per [DESIGN_SYSTEM.md §37–38](./DESIGN_SYSTEM.md#37-collection-page))

## Phase 5 — Product Detail Page

- [ ] PDP layout (60/40 media/info split)
- [ ] Size/color selection, size guide
- [ ] Quick Add (desktop overlay + mobile bottom sheet)
- [ ] Scarcity UI (low stock / final pieces — real inventory only)
- [ ] Related products / Complete the Look / Recently viewed

## Phase 6 — Access Gate

- [ ] Password entry UI + branded incorrect-password microcopy
- [ ] Access cookie (~30 day persistence), separate VIP/early-access claim
- [ ] Request Access form → Klaviyo list + password email
- [ ] Confirm SEO rule: product/collection routes stay crawlable regardless of access state ([DECISIONS.md D-005](./DECISIONS.md#d-005--access-gate-is-a-ui-layer-experience-not-an-seo-wall))

## Phase 7 — Homepage

- [ ] Scene 01: Collection Hero
- [ ] Scene 02: Interactive Model (see Phase 8)
- [ ] Scene 03: Collection Statement
- [ ] Scene 04: Selected Pieces
- [ ] Scene 05: Categories
- [ ] Scene 06: Drop Status
- [ ] Scene 07: Archive Preview (minimal/hidden until Collection 002 exists)

## Phase 8 — Interactive Model (signature feature)

- [ ] Stage 1: hotspots work (silhouette-based hit regions, not rectangles)
- [ ] Stage 2: product info panel works (name, category, price, colors, sizes, View/Quick Add)
- [ ] Stage 3: responsive/mobile tap behavior works
- [ ] Stage 4: motion added (masked luminance highlight, not glow)
- [ ] Stage 5: visual refinement
- [ ] Shop the Look panel + multi-item add flow

## Phase 9 — Advanced Motion

- [ ] Custom cursor (desktop only, with accessibility fallback)
- [ ] Shared-element product transitions (grid → PDP, interactive model → PDP)
- [ ] Parallax / depth on homepage scenes
- [ ] Reduced-motion audit across all of the above

## Phase 10 — Account

- [ ] Guest checkout confirmed working end-to-end
- [ ] Account: profile, orders, addresses
- [ ] Wishlist (anonymous local + merge on login)

## Phase 11 — Archive & Sold-Out States

- [ ] Sold-out product treatment (SOLD OUT / ARCHIVED, page stays accessible)
- [ ] Archive foundation (Collection 001 only for now; structure ready for future drops)
- [ ] Upcoming-drop system (countdown/silhouette treatment) — foundation only, no real V2 drop yet

## Phase 12 — Launch Validation

- [ ] Accessibility pass (WCAG 2.2 AA, keyboard, screen reader, reduced motion)
- [ ] SEO pass (metadata, structured data, sitemap, Open Graph, canonical URLs)
- [ ] Performance pass (Core Web Vitals, image loading, bundle size)
- [ ] Legal pages (Privacy, Terms, Shipping, Returns, Refunds)
- [ ] Analytics wired (GA4, Search Console, Shopify Analytics, access funnel events)
- [ ] Cross-device QA (mobile/tablet/laptop/desktop)

---

## V1.1 (post-launch follow-ups)

- Inventory reservation during checkout, if Collection 001 demand makes it necessary ([PROJECT.md §49](./PROJECT.md#49-inventory-reservation))
- Back-in-stock notifications (`NOTIFY IF RETURNED`)
- Klaviyo upgrade off free tier if subscriber base outgrows it
- Error monitoring / frontend error reporting once real customer traffic exists
- Behavioral analytics (Clarity or equivalent) if navigation confusion needs investigating

## V2+ (intentionally deferred — do not build yet)

Per [PROJECT.md §92](./PROJECT.md#92-deferred-v2):

- Full VIP membership / Esque Private / invitation codes / loyalty tiers
- Extensive Lookbook, expanded About editorial
- Mobile application
- Advanced 3D garments, 360° product photography, NFC garments
- Digital authentication / resale verification
- Member events, advanced outfit builder
- International shipping

## Open Product Decisions (not engineering blockers, but needed before launch)

Per [PROJECT.md §101](./PROJECT.md#101-items-still-intentionally-open) — track and resolve before Collection 001 goes live:

- Final logo, tagline, fonts, exact forest green value
- Product names, prices, sizes, colors, materials, fit descriptions, inventory quantities
- Photography style, model casting, image ratios, campaign direction
- Shipping carrier, price, free-shipping threshold, fulfillment provider, packaging, return window
- Collection 001 name, launch date/time, drop frequency, early-access duration
</content>

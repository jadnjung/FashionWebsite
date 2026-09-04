# Esque — Decisions

An ADR-style record of durable technical/product decisions and why they were made. See [PROJECT.md §77](./PROJECT.md) for the recommended format. Append new decisions at the bottom; don't rewrite history — if a decision is reversed, record the reversal as a new entry and note which prior entry it supersedes.

---

## D-001 — Use Shopify as the commerce backend

**Decision:** Shopify (Basic plan) handles products, variants, pricing, inventory, collections, customer records, orders, discounts, payment processing, checkout, and fulfillment data. The custom frontend never re-implements any of this.

**Reason:** Reliable inventory, checkout, payments, order management, and product operations without forcing the team to build or maintain that infrastructure. See [PROJECT.md §50–53](./PROJECT.md#50-commerce-platform-recommendation).

**Alternatives considered:** Stripe-only — rejected because it would require building product management, inventory, order management, discounts, customer commerce history, fulfillment, returns, merchandising, and commerce analytics from scratch. Unnecessary engineering work for V1.

---

## D-002 — Headless Next.js frontend instead of Shopify Hydrogen/Remix

**Decision:** The storefront is a standalone Next.js (App Router, TypeScript) application talking to Shopify via the Storefront API, rather than using Shopify's Hydrogen/Remix framework.

**Reason:** Hydrogen provides built-in commerce primitives but couples the project to Remix conventions and Shopify's own hosting (Oxygen). [PROJECT.md §51](./PROJECT.md#51-frontend-architecture) explicitly cautions against coupling Esque "so tightly to experimental framework features that upgrading becomes difficult." Next.js gives more control over the experimental animation/interaction system (custom cursor, shared-element transitions, the interactive model) and has a larger ecosystem for that kind of work. Confirmed with the project owner 2026-08-17.

---

## D-003 — Hosting on Vercel

**Decision:** Deploy the Next.js storefront to Vercel.

**Reason:** Best-in-class Next.js support (edge rendering, image optimization, preview deployments per PR). Follows naturally from D-002 — Shopify Oxygen is only relevant if using Hydrogen. Confirmed with the project owner 2026-08-17.

---

## D-004 — pnpm as the package manager

**Decision:** Use pnpm exclusively; do not introduce npm or yarn lockfiles.

**Reason:** `pnpm-lock.yaml` already exists in the repository. Per global engineering guidelines, don't introduce a second package manager without cause.

---

## D-005 — Access gate is a UI-layer experience, not an SEO wall

**Decision:** The password gate blocks human navigation in the UI but does not prevent product/collection routes from being server-rendered, indexed, and crawled.

**Reason:** [PROJECT.md §80](./PROJECT.md#80-important-access-gate-seo-rule) is explicit: "The password experience must not prevent search engines from discovering the product catalog... The gate should therefore function primarily as a visitor experience rather than a server-level wall." Blocking crawlers at the server/middleware level would kill organic search visibility for the entire catalog, which conflicts with the SEO requirements in [PROJECT.md §79](./PROJECT.md#79-seo).

---

## D-006 — Layered motion stack, not one animation library for everything

**Decision:** Use native CSS transitions/transforms as the default, View Transitions where the browser supports them, a Framer-Motion-style library for component/layout motion, GSAP only for complex sequences that justify it, and Three.js/WebGL only for isolated high-impact features once real assets exist to justify them.

**Reason:** [DESIGN_SYSTEM.md §62](./DESIGN_SYSTEM.md#62-recommended-frontend-motion-stack) explicitly warns against using three animation systems to solve the same problem — each library adds bundle weight, and Esque's performance priority order ([PROJECT.md §75](./PROJECT.md#75-performance)) puts usability and perceived speed above animation sophistication.

---

## D-007 — Collections and Categories are modeled as separate dimensions

**Decision:** A product's Collection (which drop it belongs to, e.g. "Collection 001") and its Category (what it is, e.g. "Tops / Hoodies") are stored and queried independently — Collection via a Shopify Collection + drop-status metafields, Category via product type/tags.

**Reason:** [PROJECT.md §10](./PROJECT.md#10-collections-vs-categories) requires these to "remain separate" as a hard product rule; conflating them would make it impossible to browse "all Hoodies across every collection" or "everything in Collection 001 regardless of category" independently.

---

## D-008 — Documentation lives at the repository root, not under `/docs`

**Decision:** `PROJECT.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and `ROADMAP.md` live at the repository root alongside `CLAUDE.md`, rather than under a `/docs` directory as suggested in [PROJECT.md §100](./PROJECT.md#100-recommended-product-documentation) and [DESIGN_SYSTEM.md §71](./DESIGN_SYSTEM.md#71-repository-documentation-structure).

**Reason:** The repository already had these five files scaffolded at the root before this documentation pass began. Matching the existing scaffolding avoids an unnecessary file-move churn commit. Revisit if the project later wants the `/docs` structure — it's a pure relocation, not a rewrite.

**Reaffirmed 2026-08-17:** a later prompt referenced `docs/PRODUCT.md`-style paths; project owner confirmed keeping this repo's existing root-level layout rather than moving to match. No change to the decision itself.

---

## D-009 — Tailwind CSS as the styling approach, configured via CSS `@theme`

**Decision:** Use Tailwind CSS v4 for all styling. Design tokens (colors, type scale, spacing, letter-spacing, easing) are declared in a single `@theme` block in `app/globals.css`, not a separate `tailwind.config.ts`.

**Reason:** Resolves the open item in [ARCHITECTURE.md §10](./ARCHITECTURE.md#10-open-architecture-decisions). Tailwind v4's current convention is CSS-first configuration — there is no JS/TS config file for basic theming as there was in v3. `DESIGN_SYSTEM.md`'s token system (exact hex values, a `clamp()`-based type scale, a fixed spacing scale, a named easing curve) maps directly onto `@theme` custom properties. Verified against current Tailwind docs before implementation (the original design spec assumed a `tailwind.config.ts` file, which is no longer how the library works).

---

## D-010 — Placeholder data over a mock Shopify client for pre-commerce UI work

**Decision:** Where the storefront shell needs data that will eventually come from Shopify (navigation categories), use a small, clearly-commented, typed placeholder data file (`lib/navigation-data.ts`) rather than building a mock Shopify Storefront API client.

**Reason:** No Shopify store exists yet, so there's nothing to validate a client interface against — building one now risks guessing wrong about the real API's shape and having to redo it in [ROADMAP.md Phase 2](./ROADMAP.md#phase-2--commerce-foundation). YAGNI per [CLAUDE.md](./CLAUDE.md)'s "do not introduce unnecessary abstractions."

---

## D-011 — View Transitions API (native) as the starting motion implementation

**Decision:** Use CSS transitions and the native View Transitions API for motion in the storefront shell (menu open/close) before introducing a JS animation library.

**Reason:** Per [DESIGN_SYSTEM.md §62](./DESIGN_SYSTEM.md#62-recommended-frontend-motion-stack)'s layered stack, use the cheapest tier that satisfies the need. The shell's only transition this pass (the full-screen menu) doesn't require spring physics, gesture-driven animation, or orchestrated sequences — a CSS `transition` on `opacity`/`transform` is sufficient and adds zero bundle weight. Cross-page shared-element transitions (which would more plausibly need Motion/Framer Motion) are deferred until a second real page exists to transition to.

---

## D-012 — Dev-only preview route for testing UI primitives built ahead of a real consumer

**Decision:** When a `components/ui/` primitive is built before any real page consumes it, render it on a dedicated, unlinked, `noindex`ed route (`app/dev/ui/page.tsx`) so Playwright has a real page to test against, instead of shipping it with no automated test or adding a component-testing tool. First applied to `Grid` and `Input` ([ROADMAP.md Phase 1](./ROADMAP.md#phase-1--design-system--tokens)), both built ahead of a real consumer at the project owner's explicit request.

**Reason:** [Task 7 of the foundation/shell plan](./docs/superpowers/plans/2026-08-17-storefront-foundation-shell.md) established this project's testing convention as exercising components for real through their actual consumer (`Button` shipped with no isolated test, then was covered by `Header`'s own test once `Header` consumed it) rather than isolated unit/component tests. That convention assumed a real consumer would arrive soon; this repo also has no component-test runner (Vitest/Jest + Testing Library) — only Playwright E2E, which needs a real rendered page to drive. A dev-only preview route keeps the "exercise it for real" spirit of the existing convention intact without adding new test tooling. `/dev/ui` is marked `robots: { index: false, follow: false }`, is not linked from any navigation, and is named to make its non-production purpose unmistakable — it must never become a real destination. Once a real page consumes a primitive, prefer testing it there instead (`Button`'s actual outcome), and revisit whether the route still has anything left to cover.

**Alternatives considered:** No automated test, typecheck-only — rejected as weaker coverage than this project's stated bar for accessibility-sensitive, keyboard/focus/responsive-heavy components (CLAUDE.md, PROJECT.md §78). Adding `@playwright/experimental-ct-react` or a Vitest+Testing-Library setup for true isolated component tests — rejected as disproportionate for two small components: a new test runner/dependency to close a temporary gap, contrary to [CLAUDE.md](./CLAUDE.md)'s "don't add dependencies merely for convenience."
</content>

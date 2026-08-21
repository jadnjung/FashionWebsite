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

## D-009 — Disable Next.js automatic "agent rules" file generation (`agentRules: false`)

**Decision:** Set `agentRules: false` in `next.config.ts`.

**Reason:** Next.js 16.3+ auto-generates/appends a managed block to `CLAUDE.md` and `AGENTS.md` on every `next dev` run — including the dev server Playwright's `webServer` boots for every E2E test run, which is nearly every task in this build. The appended block itself contains text directed at AI agents instructing them to commit it. This project treats `CLAUDE.md` as never to be modified except by explicit human instruction; this auto-generation behavior was observed live twice in one build session (once during an early implementer dispatch, again during Task 3's Playwright setup) before being closed off here — each time correctly caught and reverted before commit, never landed in history, but a structural risk that would otherwise have recurred on every remaining task. `agentRules: false` is Next.js's own documented opt-out, not a workaround — confirmed against current official docs ([`vercel/next.js`, `docs/01-app/02-guides/ai-agents.mdx`](https://nextjs.org/docs/app/guides/ai-agents)) via Context7 before applying, and verified empirically afterward: with the flag set, a live `next dev` server leaves both `CLAUDE.md` and `AGENTS.md` untouched (`git status` clean, `git diff -- CLAUDE.md` empty, `AGENTS.md` not created).

---

## D-010 — Focus-ring color is `--color-esque-text`, not `--color-esque-forest`

**Decision:** Every focus-visible outline in this project — the global CSS safety net in `app/globals.css`, and every component-level focus ring, including Button (Task 7) — uses `--color-esque-text` (`#F3F1EA`), never `--color-esque-forest` (`#1F3D2B`) or `--color-esque-forest-highlight` (`#335B41`).

**Reason:** [DESIGN_SYSTEM.md §22](./DESIGN_SYSTEM.md#22-custom-cursor) and [PROJECT.md §78](./PROJECT.md#78-accessibility) require visible focus states meeting WCAG 2.2 AA. Computed contrast (WCAG 2.1 relative-luminance formula, verified independently, not just asserted): forest vs. `--color-esque-black` ≈1.71:1, forest vs. `--color-esque-surface` ≈1.65:1, forest-highlight vs. black ≈2.63:1 — all fail WCAG 1.4.11's 3:1 minimum for non-text/focus indicators. `--color-esque-text` reaches ≈18:1 against both backgrounds, comfortably passing, and keeps focus rings within the palette's 80%-monochrome identity ([DESIGN_SYSTEM.md §5](./DESIGN_SYSTEM.md#5-color-usage-rule)) rather than introducing a new color. This does not change the palette itself — forest remains correct for its other documented uses (selection states, active states, rare emphasis); the fix is scoped to focus-ring visibility specifically. Discovered during Task 5's task review: the plan's own text specified forest for this purpose (inherited from the original design spec, not an implementer error), and the same defect appeared again in Task 7's planned Button component text — both corrected under this ruling before either landed.

---

## D-011 — Tailwind CSS as the styling approach, configured via CSS `@theme`

**Decision:** Use Tailwind CSS v4 for all styling. Design tokens (colors, type scale, spacing, letter-spacing, easing) are declared in a single `@theme` block in `app/globals.css`, not a separate `tailwind.config.ts`.

**Reason:** Resolves the open item in [ARCHITECTURE.md §10](./ARCHITECTURE.md#10-open-architecture-decisions). Tailwind v4's current convention is CSS-first configuration — there is no JS/TS config file for basic theming as there was in v3. `DESIGN_SYSTEM.md`'s token system (exact hex values, a `clamp()`-based type scale, a fixed spacing scale, a named easing curve) maps directly onto `@theme` custom properties. Verified against current Tailwind docs before implementation (the original design spec assumed a `tailwind.config.ts` file, which is no longer how the library works).

---

## D-012 — Placeholder data over a mock Shopify client for pre-commerce UI work

**Decision:** Where the storefront shell needs data that will eventually come from Shopify (navigation categories), use a small, clearly-commented, typed placeholder data file (`lib/navigation-data.ts`) rather than building a mock Shopify Storefront API client.

**Reason:** No Shopify store exists yet, so there's nothing to validate a client interface against — building one now risks guessing wrong about the real API's shape and having to redo it in [ROADMAP.md Phase 2](./ROADMAP.md#phase-2--commerce-foundation). YAGNI per [CLAUDE.md](./CLAUDE.md)'s "do not introduce unnecessary abstractions."

---

## D-013 — CSS transitions as the starting motion implementation; View Transitions API deferred

**Decision:** Use plain CSS transitions (opacity/visibility) for motion in the storefront shell (menu open/close) before introducing the native View Transitions API or a JS animation library.

**Reason:** Per [DESIGN_SYSTEM.md §62](./DESIGN_SYSTEM.md#62-recommended-frontend-motion-stack)'s layered stack, use the cheapest tier that satisfies the need. The shell's only transition this pass (the full-screen menu) doesn't require spring physics, gesture-driven animation, or orchestrated sequences — a CSS `transition` on `opacity`/`visibility` is sufficient and adds zero bundle weight. The native View Transitions API (`document.startViewTransition`, `view-transition-name`) is not used yet — its value is in animating *between* two rendered views (e.g. a cross-page navigation), and this shell pass only has one real route to transition within. Deferred until a second real page exists to transition to; cross-page shared-element transitions (which would more plausibly need Motion/Framer Motion, or the View Transitions API directly) are deferred for the same reason.

---

## D-014 — Header utility-nav mobile treatment: icon + visually-hidden text below `md`

**Decision:** Below Tailwind's `md` breakpoint, Header's SEARCH and ACCOUNT utility-nav controls compress from full-text buttons to icon-only presentation (small hand-authored inline SVGs, `aria-hidden`), with the original text preserved as a visually-hidden (`sr-only`) sibling so each control's accessible name is unchanged. MENU and BAG (0) remain full-text at every viewport size.

**Reason:** DESIGN_SYSTEM.md §24's utility-nav specification (`ESQUE MENU SEARCH ACCOUNT BAG (0)`) is explicitly scoped "Desktop" — no mobile treatment was specified, and the as-built Header (Task 8) had none: four full-text buttons in a single non-wrapping row overflowed a 375px viewport (measured 537px scrollWidth), a defect against CLAUDE.md's Fashion Website Priorities, which rank mobile responsiveness above accessibility, performance, reliability, SEO, and security. PROJECT.md §73 requires Bag to "remain immediately accessible" on mobile and establishes MENU's full-screen menu as the primary mobile navigation mechanism — both stay full-text accordingly. SEARCH and ACCOUNT are the two controls without real behavior yet (ROADMAP.md Phase 4/10) and are lower-priority at narrow widths, so they compress. Hand-authored inline SVGs were used rather than adding an icon-library dependency — no icon library exists anywhere else in this codebase, and CLAUDE.md's "avoid unnecessary dependencies" guidance applies; two small icons don't justify a new dependency. Discovered and fixed as an unplanned follow-up task after Task 8's original approval — see the SDD ledger's Ruling 8 for the full discovery/diagnosis trail.

---

## D-015 — `@shopify/storefront-api-client` + `@shopify/api-codegen-preset` for Storefront API integration

**Decision:** Use `@shopify/storefront-api-client` as the Storefront API client and `@shopify/api-codegen-preset` (with `@graphql-codegen/cli`) to generate TypeScript types from `#graphql`-tagged query documents.

**Reason:** `ARCHITECTURE.md` §2 already ruled out the full Hydrogen framework ("to avoid over-coupling to Shopify's opinionated stack") but left the specific lightweight alternative unnamed. `@shopify/storefront-api-client` is Shopify's own official, framework-agnostic client built for exactly this case — confirmed via Shopify's current documentation, not assumed. Types are generated against Shopify's real Storefront API schema via a public proxy endpoint (`shopify.dev/storefront-graphql-direct-proxy`) that requires no store credentials, so full type safety is achievable before a real store exists — verified directly rather than assumed possible.

---

## D-016 — Phase 2 narrowed to client + product/collection reads; cart and checkout deferred

**Decision:** This pass of ROADMAP.md Phase 2 implements only the Shopify Storefront API client and typed product/collection read queries. Cart (Storefront API cart object) and Shopify Checkout handoff are deferred to a follow-up phase.

**Reason:** No Shopify store exists yet, so nothing built here can be tested against live data. Read-only product/collection queries can be fully type-verified against Shopify's real, live schema even without a store. Cart mutations and the checkout handoff (which fundamentally means redirecting to a real Shopify-issued checkout URL) cannot be meaningfully verified at all without hitting a live store. The previous phase's final whole-branch review found its two worst defects specifically in code paths that had never been exercised end-to-end (an untested CI pipeline, an unmeasured viewport) — deferring the hardest-to-verify commerce code avoids repeating that pattern on checkout, where the cost of an undiscovered defect is highest.

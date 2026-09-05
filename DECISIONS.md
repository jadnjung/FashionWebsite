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

---

## D-017 — Commit generated Shopify codegen types (`storefront.generated.d.ts`, `storefront.types.d.ts`); keep the schema cache ignored

**Decision:** `lib/shopify/storefront.generated.d.ts` and `lib/shopify/storefront.types.d.ts` — the two files `pnpm graphql-codegen` produces that TypeScript actually consumes (module augmentation that makes `client.request()` type-safe with no explicit generics) — are now committed to the repository instead of gitignored. `lib/shopify/storefront-*.schema.json` (the codegen-internal schema cache, ~800KB) stays gitignored: it's an intermediate artifact the TypeScript compiler never reads, so committing it has no build-time benefit. No live `pnpm graphql-codegen` step is added to CI.

**Reason:** These two files were originally gitignored under the rationale that they get "the same treatment as `next-env.d.ts`." That analogy doesn't hold: `next-env.d.ts` is regenerated automatically as a side effect of `next dev`/`next build` themselves, so a fresh checkout always has a current copy before TypeScript needs it. `storefront.generated.d.ts`/`storefront.types.d.ts` require a separate, explicit `pnpm graphql-codegen` invocation that nothing in the standard `pnpm install` → `pnpm typecheck`/`pnpm build` pipeline triggers — and `.github/workflows/ci.yml` never ran it either. Verified directly, twice: once pre-fix (5 `TS7031` implicit-`any` errors across `collections.ts`/`products.ts`, exit code 2) and again after this fix wave's other changes landed in those same two files — with both generated files removed and `tsconfig.tsbuildinfo` deleted (to defeat the incremental cache), `pnpm typecheck` still fails the same way (5 `TS7031` errors, exit code 2); restoring the files and clearing the cache again yields a clean pass. Every fresh checkout (CI, Vercel, a new clone) was actually broken, not just theoretically at risk.

Committing ~500KB of deterministic, schema-derived generated code is a better tradeoff than the alternative (adding a live `pnpm graphql-codegen` step to CI/build): that would introduce a network dependency on `shopify.dev`'s public schema proxy at build time, so a transient network failure or upstream outage would break every build, including production deploys — the opposite of what a fix here should do. Keeping builds hermetic (no network calls required to typecheck or build) is worth the generated-file diff noise on regeneration.

Regenerating and re-committing these two files when a query document under `lib/shopify/queries/` changes, or the pinned Storefront API version (`.graphqlrc.ts`, `lib/shopify/client.ts`'s `DEFAULT_API_VERSION`) bumps, is routine maintenance (documented in README.md's Setup section) — it does not need a new DECISIONS.md entry each time. A periodic/manual "codegen drift check" (confirming the committed files still match what `pnpm graphql-codegen` would currently produce) was considered as an optional CI gate; not implemented here, and noted only as a possible future manual/periodic check rather than a build-blocking one, since a drift gate re-run on every CI build would reintroduce the same live network dependency this decision exists to avoid.

---

## D-018 — Next.js Proxy (not Middleware) for access-gate enforcement

**Decision:** Gate enforcement lives in `proxy.ts` at the repo root, exporting a named `proxy(request: NextRequest)` function, running on the Node.js runtime.

**Reason:** Next.js renamed Middleware to Proxy as of the version this project pins (16.3.1) — confirmed against current Next.js docs, not assumed from training data, which still overwhelmingly reflects the deprecated `middleware.ts`/`export function middleware()` convention. Next.js ships a codemod (`npx @next/codemod@canary middleware-to-proxy .`) for projects migrating off the old convention; this project adopts the current one directly since it never had a `middleware.ts` to migrate from.

---

## D-019 — `isbot` for crawler detection

**Decision:** Use the `isbot` package (`isBot(userAgentString): boolean`) in `proxy.ts` to let crawlers bypass the access gate unconditionally, rather than a hand-maintained user-agent pattern list.

**Reason:** ARCHITECTURE.md §6 and DECISIONS.md D-005 require the gate to never block crawlers, regardless of cookie state — this is what keeps product/collection routes indexable once they exist (ROADMAP.md Phase 4/5). SEO correctness depends on this list staying current as crawlers change their user-agent strings over time; `isbot` is small, actively maintained (millions of weekly downloads), and purpose-built for exactly this, which a one-off in-house regex would not keep pace with as reliably.

---

## D-020 — Klaviyo integration via direct REST calls, not the official Node SDK

**Decision:** `lib/klaviyo/client.ts` calls Klaviyo's REST API directly via `fetch` (`POST /api/profile-subscription-bulk-create-jobs/`), rather than adding `@klaviyo/klaviyo-api-node` or an equivalent SDK dependency.

**Reason:** Mirrors the same reasoning already applied to Shopify's lightweight client choice (D-015): this integration needs exactly one endpoint (subscribing a profile to a list with marketing consent), and a single documented REST call doesn't justify a heavier dependency. Verified against Klaviyo's current docs directly — including resolving a real discrepancy mid-implementation between an older, now-superseded flat `subscriptions.email.marketing_newsletter: boolean` shape that some cached references still show, and the current `subscriptions.email.marketing.consent: "SUBSCRIBED"` shape (confirmed across four independent current examples, including Klaviyo's own changelog documenting the shape change). This pass covers only the list-subscription mechanism; the transactional "here's your access password" email (CONTENT.md §4's access-email structure) is not built — like Shopify's store, it needs the project owner's own Klaviyo account and a real email template/flow to exist first, mirroring D-016's reasoning for why cart/checkout were deferred pending a real Shopify store. `first_name` is collected and validated server-side but not forwarded to Klaviyo: the Subscribe Profiles endpoint's documented profile attributes cover identification and consent only, not name — attaching a name would need a separate profile-update call once a real account justifies adding one.

The dated `revision` header (`2026-07-15`) was verified against Klaviyo's current documentation at implementation time and independently re-verified during review, along with the endpoint's trailing slash and the `subscriptions.email.marketing.consent: "SUBSCRIBED"` body shape — an older, now-superseded flat `marketing_newsletter` boolean shape still appears in parts of Klaviyo's own docs corpus and was deliberately avoided. Bump the revision alongside checking Klaviyo's changelog for breaking changes.

---

## D-021 — Access-gate and Request-Access error copy renders in `--color-esque-text`, not `--color-esque-error`

**Decision:** The access gate's incorrect-password microcopy and the Request Access form's validation errors render in `--color-esque-text`, not `--color-esque-error`. This does not change the palette; `--color-esque-error` remains defined and correct for its other documented uses.

**Reason:** `--color-esque-error` (`#A74338`) measures **3.40:1** against `--color-esque-black` (`#050505`) — computed with the WCAG 2.1 relative-luminance formula, not asserted — which is below WCAG 2.2 AA's 4.5:1 minimum for normal-size text (these are 13px `text-utility` strings). DESIGN_SYSTEM.md's own Error entry independently points the same way: the color "should be used extremely sparingly. Where possible, errors should rely on typography and motion rather than bright red UI" — which is exactly what the gate's shift-and-letter-spacing-split treatment already provides, so nothing is lost by dropping the red. Note explicitly that this is a *different* WCAG criterion from D-010's: D-010 concerned non-text/focus-indicator contrast (1.4.11, 3:1 minimum), this concerns text contrast (1.4.3, 4.5:1 minimum) — which is why it warrants its own entry rather than an amendment to D-010.

---

## D-022 — AccessForm submits via `useActionState` + uncontrolled input, not a controlled input with a manual handler

**Decision:** `app/(access)/access/AccessForm.tsx` submits via `useActionState` bound to a Server Action through `<form action={formAction}>`, with uncontrolled inputs — matching `RequestAccessForm.tsx` — rather than a React-controlled input driving a manual `onSubmit` handler. The submitted password travels DOM → native `FormData` → `validatePassword`; no React state mediates it. `validatePassword`'s signature is correspondingly `(prevState, formData)`.

**Reason:** The controlled-input pattern (originally specified in this feature's implementation plan) carried a real, user-facing defect. If a keystroke's `input` event fired before React attached its `onChange` listener — observed reproducibly on mobile Safari, and plausible via password-manager autofill on any browser — the DOM held the correctly-typed password while component state stayed `''`, so `validatePassword('')` ran and a *correct* password was rejected with the same branded microcopy a genuine mistake produces. That is a silent lockout on the site's front door, for exactly the early-access audience the gate exists to admit, and Phase 6's entrance motion had just widened the window by adding ~119KB of JS to that route. Reading the value from the form's own `FormData` eliminates the race structurally rather than timing around it, and a Server Action `action` is progressively enhanced by React 19, so a first submission works even before hydration. It also removes two competing patterns for one responsibility in the same directory, which CLAUDE.md prohibits. Record that the fix is pinned by a test that assigns the input's value natively (dispatching no event at all) and asserts access is still granted — a test that fails against the controlled implementation — plus 60/60 passing runs of the formerly-flaky tests at `--repeat-each=20` with no retry wrapper. Note that the incorrect-password microcopy rotation now derives during render from the action result's identity (React's documented "adjust state during render" pattern) rather than from a handler mutation, since `useActionState`'s state is server-returned and has nowhere to track which line was shown last.

**Caveat:** the progressive-enhancement claim above ("a first submission works even before hydration") holds fully for the *correct*-password path, since that redirect is server-side. It does not hold for the *wrong*-password path: `AccessForm.tsx` derives the branded message from `state !== priorState`, and on a server render `priorState` initializes to `state` itself — so a submission that's rejected before hydration has attached re-renders the form with no branded microcopy shown. The action still correctly rejects the password either way; only the branded-message UI is hydration-dependent.

---

## D-023 — Category pages query Shopify's root `products` connection filtered by product type, not a Collection

**Decision:** Category/subcategory listing pages (`/new`, `/tops`, `/tops/[subcategory]`, etc.) query Shopify's root `products(query, sortKey, reverse, first, after)` connection, with `query` built from `product_type:"..."` search-syntax clauses — never `collection(handle).products`. The category→product-type mapping (`lib/catalog/taxonomy.ts`) is derived directly from `lib/navigation-data.ts`'s existing `NAVIGATION` structure, not a second, parallel taxonomy table.

**Reason:** `ARCHITECTURE.md` §5 and `DECISIONS.md` D-007 require Category and Collection to remain independent dimensions — querying a Collection for a category page would conflate them. The root `products` connection's search-syntax filtering (`field:value`, comparisons, `AND`/`OR`, parentheses) was verified directly against Shopify's current Storefront API docs before implementation, not assumed from memory. Deriving the taxonomy from `NAVIGATION` (already the source Header/FullScreenMenu render from) avoids a second mapping that could silently drift from it.

**Caveat:** this assumes the real Shopify store's `productType` field values will exactly equal `NAVIGATION`'s subcategory labels (`"Hoodies"`, `"T-Shirts"`, …) once a store exists — unverifiable without one. If a real merchandiser uses different strings, the affected category page returns zero results rather than erroring. Mirrors the existing, still-open metafield-namespace caveat in `ARCHITECTURE.md` §5; both should be confirmed together when a real store is provisioned.

**Also recorded here:** Shopify's root `ProductSortKeys` enum has no merchant-curated ordering (`MANUAL`/`COLLECTION_DEFAULT` exist only on `ProductCollectionSortKeys`, which is collection-scoped). "Featured" — `PROJECT.md` §34's default sort option — therefore maps to the root connection's own default ordering rather than true curation. All four of `PROJECT.md` §34's sort options (Featured, Newest, Price Low→High, Price High→Low) are still implemented and selectable, honoring the product spec's exact vocabulary even though "Featured" doesn't yet do more than the API default.

**Implementation note:** the generated `ProductSortKeys` (`lib/shopify/storefront.types.d.ts`) is a real TypeScript string enum, not a string-literal union, and — unlike the other generated types this codebase already consumes — it's only ever `import type`-able here (there is no corresponding runtime `.js` for its enum members to be referenced as values from, confirmed by inspecting the generated file directly, which itself only ever imports it via `import type`). `lib/shopify/products.ts`'s `getProducts()` therefore accepts a plain `'CREATED_AT' | 'PRICE'` literal type on its public options (keeping `lib/catalog/filters.ts` independent of any Shopify-generated type) and casts narrowly at the single point that value crosses into the GraphQL variable, rather than loosening the function's public type or casting more broadly.

---

## D-024 — Phase 4 filters narrowed to Sort, Availability, and Price range; Size, Color, and Collection deferred

**Decision:** This pass builds Sort (all four `PROJECT.md` §34 options), Availability (in-stock toggle), and Price range (min/max) as zero-JavaScript, URL-driven filters — plain `<Link>`s for Sort, one native GET `<form>` for Availability/Price. Size, Color, and Collection filters are not built. `DESIGN_SYSTEM.md` §51's mobile bottom-sheet filter treatment is also not built this pass.

**Reason:** Size/Color have no real taxonomy yet — `PROJECT.md` §101 still lists product sizes/colors as an open decision, the same category of gap `DECISIONS.md` D-012 already named for navigation data before real Shopify data existed. Building a filter against a guessed size/color enum risks the exact wrong-guess problem D-012 avoided. Collection has only one real member in the current catalog (Collection 001) — a Collection filter has no second collection to prove it actually excludes anything, and intersecting a category's product-type query with a specific collection is a different, untested query shape (`collection(handle).products` vs. root `products(query:)`) not needed by anything else this pass. The mobile bottom-sheet treatment's value is hiding a *large* control set from a small screen; three simple controls (a handful of links, one checkbox, two number fields) don't yet justify that complexity or its JS cost — natural to add once Size/Color/Collection expand the control set later.

**Also recorded here:** Filters were deliberately implemented with zero client components — Sort as plain `<Link>`s (each preserving other active params via `buildFilterHref`), Availability/Price as one native GET `<form>` with no `onChange`/`onSubmit` handler. This works with JavaScript disabled, needs no new client-side bundle weight, and reuses the existing `Button`/`Input` components rather than introducing new form primitives. The availability checkbox tints its checked state via Tailwind's `accent-color` utility (`accent-esque-forest`) rather than a custom-built widget — a sparing, genuine use of the forest accent for a real selection state per `DESIGN_SYSTEM.md` §5, on a native control whose own contrast/rendering is otherwise governed by the browser, not hand-drawn CSS (unlike D-010's focus-ring case, where the author was fully responsible for the visual). Worth a second look once a real UI/accessibility review pass exists to check rendered contrast across engines.

---

## D-025 — Predictive full-screen search (ROADMAP.md Phase 4) deferred in full

**Decision:** No search functionality — predictive or otherwise — is built this pass. Header's `SEARCH` control remains the no-op it already was.

**Reason:** Unlike a category grid, whose correctness is fully specified by "does it show the right products for this category" (verifiable with a handful of fixtures, exactly as `getProducts` is tested), predictive search's entire value proposition — relevance/ranking quality against a real catalog, `PROJECT.md` §33's "feels instantaneous" — is fundamentally about live-store interaction. A fixture-driven unit test of "does our result-grouping function group a mocked response correctly" would test our own formatting code, not whether Shopify's `predictiveSearch` (confirmed via its current docs to be a real, separate root query from `products(query:)`, with its own `limitScope`/`unavailableProducts` tuning surface) actually behaves usefully against Esque's real, currently nonexistent catalog — which is the actual point of the feature. This mirrors D-016's reasoning for deferring cart/checkout: the mechanism could be wired and type-verified without a store, but its behavior cannot be meaningfully verified without one.

---

## D-026 — Unknown-subcategory 404s return HTTP 200 + `noindex`, not a hard 404; not resolved this pass

**Decision:** `/tops/[subcategory]`, `/bottoms/[subcategory]`, and `/etc/[subcategory]` correctly render the branded `THIS PIECE DOESN'T EXIST.` UI for an unrecognized subcategory slug (verified via Playwright and manual production testing), and Next.js correctly injects a `noindex` meta tag on that response (verified in the rendered HTML) — but the HTTP response status is `200`, not `404`. This is recorded as a known, investigated, but unresolved limitation, deferred to ROADMAP.md Phase 12's SEO pass rather than fixed here.

**Investigation:** Discovered during this phase's final validation pass via a manual `next start` (production build) `curl` check — Playwright's E2E suite runs against `next dev` and only asserts rendered content/headings, never the raw HTTP status code, so it could not have caught this. Root-caused directly against Next.js's current documentation (`docs/01-app/03-api-reference/04-functions/not-found.mdx`, `docs/01-app/02-guides/streaming.mdx`): "a `not-found` boundary... will return a `200` HTTP status code for streamed responses, and `404` for non-streamed responses," and calling `notFound()` "after streaming has started... returns a 200 status code instead of a 404. To return a real 404 status, the resource must be checked before the response begins streaming." Three independent, evidence-based fix attempts were made and empirically disproven, each verified with a real `next start` + `curl` round-trip (not just re-reading the docs and assuming):
1. **Moving the `notFound()` check earlier** — synchronously in each `[subcategory]/page.tsx`, before rendering `<CategoryListing>` at all (still landed in this pass — see the code comments in those files — because it independently avoids an unnecessary Shopify call for a request already known to be invalid, which is worth keeping regardless). Confirmed via server logs that this successfully prevents the Shopify call, but the response status was still `200`.
2. **A segment-local `not-found.tsx`** under `app/(storefront)/tops/[subcategory]/`, on the theory that the distance to the nearest not-found boundary (this app only had a root-level one) was forcing an early flush. Still `200`.
3. **`generateStaticParams()` + `dynamicParams = false`**, enumerating the known-valid subcategory slugs so an unrecognized one would fail to match the route at all (the same bucket a truly unmatched URL like `/this-route-does-not-exist` already falls into, which *does* correctly return a hard `404` — confirmed directly). Build succeeded without attempting a build-time Shopify call (an important safety check, since that would have broken `pnpm build`), and the known-valid subcategories still rendered correctly, but an unrecognized slug still returned `200`.

A fourth, isolated reproduction — a single-line, `force-dynamic` page at the app root (`app/test-notfound-probe/`, no route group, no shell, no ancestor Client Component, calling `notFound()` as its only statement) — **also** returned `200`. This rules out this project's specific shell architecture (`(storefront)/layout.tsx` wrapping every page in the Client Component `ShellClient`) as the cause: the behavior reproduces in the barest possible case, so it appears to be this Next.js version's general treatment of `notFound()` in a dynamically-rendered (non-statically-prerenderable) route, not something specific to Esque's code. All temporary probe files were removed; nothing from the investigation itself is committed.

**Reason for deferring rather than continuing to iterate:** The practical SEO risk is meaningfully mitigated already — Next.js's own `noindex` tag is confirmed present and active, which is the framework's documented, intentional safety net for exactly this case, so a mistyped subcategory URL will not get indexed even without a hard 404. A fully correct fix likely requires either a deeper investigation than a reasonable stopping point within a catalog-focused pass allows (e.g., checking Next.js's issue tracker for this exact version/Turbopack combination, or testing configuration combinations beyond the three above), or a decision to serve these seven routes differently (e.g., fully static generation for the known-valid subcategories with `notFound()` reserved only for a route that genuinely doesn't exist in the file system — which would need its own careful design, not a bolt-on). ROADMAP.md Phase 12 ("SEO pass... crawlability") already owns exactly this class of problem holistically and is the right place to resolve it properly, rather than a partial fix here that might need to be redone.

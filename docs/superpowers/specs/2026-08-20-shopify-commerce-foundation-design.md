# Esque — Shopify Commerce Foundation (Data Layer)

Status: Design approved by project owner 2026-08-20. Pending spec review before implementation planning.
Scope: ROADMAP.md Phase 2 (Commerce Foundation) — narrowed to the client and product/collection read layer only (see Explicit Non-Goals).

## Context

The storefront-foundation-shell build (ROADMAP Phase 0/1/3) is complete: Next.js App Router scaffold, design tokens, and the navigation shell (Header, FullScreenMenu, Footer) all exist and are validated. `lib/navigation-data.ts` currently holds hard-coded placeholder navigation data, explicitly commented as temporary pending Shopify collection/category data.

No Shopify store exists yet (confirmed with the project owner). This is a hard constraint on this pass: nothing built here can be tested against live data or live credentials. The design accounts for this rather than working around it.

Source of truth for the architectural decisions this spec builds on: `ARCHITECTURE.md` §1 (Shopify owns commerce integrity), §5 (Collection vs. Category data-model mapping), §7 (env var names, already scaffolded as empty placeholders in Phase 0). This spec does not revisit those decisions — only implements them.

## Goals

- **ROADMAP.md Phase 2, narrowed**: "Shopify Storefront API client + typed GraphQL queries" and "Product/collection data fetching" — the two Phase 2 checklist items this pass covers.
- Real, officially-typed GraphQL queries and mutations, generated against Shopify's actual Storefront API schema (verified reachable at `shopify.dev/storefront-graphql-direct-proxy` without store credentials), not hand-maintained types that could drift from the real schema.
- A client and fetch-function layer that Phase 4 (Catalog) and Phase 5 (PDP) can consume once they're built, with a clear, simple failure mode if used before a store is configured.

End state: `lib/shopify/` exists with a working client, typed product and collection queries, and fetch functions, verified via successful codegen against the real schema and unit tests against fixture data — with no live store to test end-to-end against yet.

## Explicit Non-Goals (deferred)

- **Cart** (Storefront API cart object, persisted cart ID) — deferred to a follow-up phase once a real store exists. Cart mutations can't be meaningfully verified without hitting a live store, and this project's most recent whole-branch review found its worst defects specifically in code that had never been exercised end-to-end (an untested CI pipeline, an unmeasured viewport). Deferring avoids repeating that pattern on commerce-critical code.
- **Checkout handoff** — deferred for the same reason; the entire mechanism (redirect to a real Shopify-issued checkout URL) is close to unverifiable without a live store.
- **Wiring this data layer into any existing UI.** `lib/navigation-data.ts`'s placeholder data stays as-is. Swapping it for real Shopify collection data needs a live store to confirm the swap actually works — attempting it now would trade a known-good placeholder for an unverifiable live query.
- **Any new pages, routes, or UI components.** Phase 4 (Catalog: category pages, search, filters, grid) and Phase 5 (PDP) own the UI layer that will eventually consume this data. This pass is the data layer underneath them, not yet connected.
- **Generic metaobject/metafield fetching.** Only the specific collection metafields needed for drop status (`drop_status`, `drop_date`, `archived_at`, per `ARCHITECTURE.md` §5) are covered. A general-purpose metaobject system isn't needed by any consumer yet.
- **Live-store integration testing.** Not possible without credentials. Covered instead by schema-valid codegen + fixture-based unit tests (see Testing below).

## Architecture

Per `ARCHITECTURE.md` §3's target structure, `lib/shopify/` is already the named location. This pass populates it:

```
lib/
  shopify/
    client.ts              — configured Storefront API client instance
    queries/
      products.ts          — product query documents (#graphql-tagged)
      collections.ts        — collection query documents (#graphql-tagged)
    products.ts             — typed fetch functions built on client + queries/products.ts
    collections.ts          — typed fetch functions built on client + queries/collections.ts
    types.generated.ts      — codegen output (gitignored, regenerated on demand — not hand-maintained, same treatment as next-env.d.ts)
  navigation-data.ts         — UNCHANGED this pass (see Non-Goals)
codegen.ts                   — graphql-codegen config at repo root, alongside next.config.ts
```

**Client library**: `@shopify/storefront-api-client` — Shopify's own lightweight, framework-agnostic client for the Storefront API, distinct from the full Hydrogen framework `ARCHITECTURE.md` §2 already ruled out ("to avoid over-coupling to Shopify's opinionated stack"). Verified current via Shopify's own docs (`createStorefrontApiClient` from `@shopify/storefront-api-client`, current API version referenced as `2026-07` in Shopify's own examples at the time of this spec).

**Type generation**: `@shopify/api-codegen-preset` (via `shopifyApiProject`/`ApiType.Storefront`) plus `@graphql-codegen/cli`, generating types from query/mutation documents written with a `#graphql` tag, checked against Shopify's real schema at `https://shopify.dev/storefront-graphql-direct-proxy` — a public endpoint, confirmed to require no store credentials or authentication. This is Shopify's own current, official tooling for this exact use case, not a hand-rolled or third-party alternative.

**API version**: `2026-07`, confirmed as the version used in Shopify's own current documentation examples at spec-writing time (2026-08-20). Shopify Storefront API versions are quarterly-released with a support lifecycle; before implementation starts, confirm `2026-07` is still supported (Shopify typically supports a version for ~12 months from release) rather than assuming this spec's snapshot is still accurate — bump to whatever is current if not, as a normal maintenance step, not a re-litigation of this decision.

**Client configuration**: `client.ts` reads `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_API_TOKEN` (already scaffolded as empty placeholders in `.env.local.example` from Phase 0). If either is unset, `client.ts` does not throw at import time (module-level throws break builds/tests that don't need Shopify at all) — instead, the fetch functions in `products.ts`/`collections.ts` check configuration before calling the client and throw a clear, descriptive error at call time (see Error Handling).

## Data Flow / Query Design

Per `ARCHITECTURE.md` §5's existing data-model mapping:

- **Collections** (`getCollection(handle)`, `getCollections()`) query Shopify Collections, including the `drop_status`, `drop_date`, `archived_at` metafields via the Storefront API's metafield query capability (metafields must be explicitly requested per-key in the Storefront API; this pass requests exactly those three, not a generic metafield-fetching mechanism).
- **Products** (`getProduct(handle)`, `getProductsByCollection(handle, ...)`) query Shopify Products — core commerce fields (title, handle, description, price range, images, variants, availability) needed by a future PDP/catalog consumer, using product type and tags for category taxonomy per `ARCHITECTURE.md` §5, not a separate collection dimension.
- Both list-fetching functions (`getCollections()`, `getProductsByCollection()`) accept Shopify's standard cursor pagination parameters (`first`, `after`) — the Storefront API is inherently cursor-paginated; omitting this would mean Phase 4 could only ever fetch one fixed batch, which isn't a reasonable simplification of how the API actually works.

## Error Handling

When called without `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_API_TOKEN` configured, every exported fetch function throws a plain `Error` with a clear message (e.g., `"Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN."`) before attempting any network call. This is deliberately simple: nothing in the current codebase calls these functions yet. When Phase 4 does call one from a Server Component, the thrown error propagates to the existing `app/error.tsx` boundary (built and reviewed in the previous phase) with no new fallback mechanism needed — reusing what already exists rather than building a parallel "Shopify not configured" UI state that would just be redundant with it.

## Testing

No live store exists, so testing is scoped to what's actually verifiable:

- **Codegen succeeding is itself a correctness check.** If `graphql-codegen` runs clean against the real Storefront API schema, every query/mutation document is confirmed valid GraphQL against Shopify's actual current schema — not a hypothetical one.
- **Unit tests for `products.ts`/`collections.ts`** using fixture responses shaped exactly like the real generated types (hand-written fixtures matching the generated `Product`/`Collection` shapes, not live-captured data), verifying the fetch functions' response-parsing and transformation logic.
- **A unit test confirming the "not configured" error** is thrown with unset env vars, and does not attempt a network call in that case (verifiable via a mocked/spied client that asserts it was never invoked).
- No E2E/Playwright tests this pass — there is no UI consuming this data yet for Playwright to exercise against. Playwright coverage arrives with Phase 4.

## New Architectural Decisions to Record

To be added to `DECISIONS.md` during implementation:

- **D-015**: `@shopify/storefront-api-client` + `@shopify/api-codegen-preset` as the Shopify Storefront API integration approach (resolves the "TBD" implicit in `ARCHITECTURE.md`'s Hydrogen-avoidance note by naming the specific lightweight alternative used).
- **D-016**: Narrowed Phase 2 scope — client and product/collection reads only this pass, cart and checkout explicitly deferred to a follow-up phase pending a real Shopify store, with the reasoning above (avoiding unverified commerce-critical code, per the lesson from the previous phase's final review).

## Explicitly Open / Out of Scope for This Spec

- Cart, checkout handoff — next phase, blocked on the project owner creating a real Shopify store.
- Wiring real data into Header's navigation or any other existing UI — needs a live store to verify against.
- Phase 4 (Catalog) and Phase 5 (PDP) themselves — later phases, not touched here.
- Confirming the pinned Storefront API version is still current at implementation time — a normal verification step for whoever picks up the plan, not a design decision to pre-resolve here.

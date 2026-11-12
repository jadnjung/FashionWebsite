# FashionWebsite

## Setup

Run `pnpm install` to install dependencies.

The Shopify Storefront API client types (`lib/shopify/storefront.generated.d.ts`, `lib/shopify/storefront.types.d.ts`) are committed to the repository so fresh checkouts can typecheck and build without a network call — see [DECISIONS.md D-017](./DECISIONS.md). Regenerate them with `pnpm graphql-codegen` whenever a `#graphql`-tagged query document under `lib/shopify/queries/` changes, or the pinned Storefront API version (`.graphqlrc.ts`, `lib/shopify/client.ts`) bumps, then commit the regenerated files alongside your change.

Local development needs `ESQUE_ACCESS_PASSWORD` and `ESQUE_EARLY_ACCESS_PASSWORD` in `.env.local` (see `.env.local.example`) to get through the access gate. The Playwright suite does not use those — it supplies its own obviously-fake fixtures via `webServer.env` in `playwright.config.ts`. That only holds, though, when Playwright starts the dev server itself: `webServer.env` is applied solely to a server Playwright spawns, and `reuseExistingServer: !process.env.CI` means it will reuse one you already have running locally instead, in which case the suite inherits whatever is in your own `.env.local`. Stop any dev server you have running before `pnpm test:e2e` if you want the deterministic fixtures.

## Development

- `pnpm dev` — local dev server on http://localhost:3000. With no Shopify credentials it shows the honest "no store" states; set `PREVIEW_DEMO_MODE=1` in `.env.local` to preview with fixture products instead ([DECISIONS.md D-057](./DECISIONS.md)).
- `pnpm test:unit` — Vitest unit tests.
- `pnpm test:e2e` — main Playwright suite, run with **no** store, proving every Shopify-dependent surface degrades gracefully.
- `pnpm test:e2e:demo` — Demo Mode Playwright suite (populated catalog, including the 3D Collection Closet) ([DECISIONS.md D-090](./DECISIONS.md)).
- Both e2e suites start `pnpm dev` on :3000, or reuse a server already running there — so stop your own dev server, or make sure its Demo Mode setting matches the suite, before running one locally. Next 16 allows only one dev server per project directory.

Where the project stands and what's next: [ROADMAP.md](./ROADMAP.md) (start with "Current Status").

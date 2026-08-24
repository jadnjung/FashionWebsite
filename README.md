# FashionWebsite

## Setup

Run `pnpm install` to install dependencies.

The Shopify Storefront API client types (`lib/shopify/storefront.generated.d.ts`, `lib/shopify/storefront.types.d.ts`) are committed to the repository so fresh checkouts can typecheck and build without a network call — see [DECISIONS.md D-017](./DECISIONS.md). Regenerate them with `pnpm graphql-codegen` whenever a `#graphql`-tagged query document under `lib/shopify/queries/` changes, or the pinned Storefront API version (`.graphqlrc.ts`, `lib/shopify/client.ts`) bumps, then commit the regenerated files alongside your change.

Local development needs `ESQUE_ACCESS_PASSWORD` and `ESQUE_EARLY_ACCESS_PASSWORD` in `.env.local` (see `.env.local.example`) to get through the access gate. The Playwright suite does not use those — it supplies its own obviously-fake fixtures via `webServer.env` in `playwright.config.ts`. That only holds, though, when Playwright starts the dev server itself: `webServer.env` is applied solely to a server Playwright spawns, and `reuseExistingServer: !process.env.CI` means it will reuse one you already have running locally instead, in which case the suite inherits whatever is in your own `.env.local`. Stop any dev server you have running before `pnpm test:e2e` if you want the deterministic fixtures.
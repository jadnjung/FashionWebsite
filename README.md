# FashionWebsite

## Setup

Run `pnpm install` to install dependencies.

The Shopify Storefront API client types (`lib/shopify/storefront.generated.d.ts`, `lib/shopify/storefront.types.d.ts`) are committed to the repository so fresh checkouts can typecheck and build without a network call — see [DECISIONS.md D-017](./DECISIONS.md). Regenerate them with `pnpm graphql-codegen` whenever a `#graphql`-tagged query document under `lib/shopify/queries/` changes, or the pinned Storefront API version (`.graphqlrc.ts`, `lib/shopify/client.ts`) bumps, then commit the regenerated files alongside your change.

Local development needs `ESQUE_ACCESS_PASSWORD` and `ESQUE_EARLY_ACCESS_PASSWORD` in `.env.local` (see `.env.local.example`) to get through the access gate. The Playwright suite does not use those — it supplies its own obviously-fake fixtures via `webServer.env` in `playwright.config.ts`, so `pnpm test:e2e` is self-contained and does not depend on your local `.env.local`.
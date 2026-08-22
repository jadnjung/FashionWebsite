# FashionWebsite

## Setup

Run `pnpm install` to install dependencies.

The Shopify Storefront API client types (`lib/shopify/storefront.generated.d.ts`, `lib/shopify/storefront.types.d.ts`) are committed to the repository so fresh checkouts can typecheck and build without a network call — see [DECISIONS.md D-017](./DECISIONS.md). Regenerate them with `pnpm graphql-codegen` whenever a `#graphql`-tagged query document under `lib/shopify/queries/` changes, or the pinned Storefront API version (`.graphqlrc.ts`, `lib/shopify/client.ts`) bumps, then commit the regenerated files alongside your change.
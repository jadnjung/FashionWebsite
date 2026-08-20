import { ApiType, shopifyApiProject } from '@shopify/api-codegen-preset';

const API_VERSION = '2026-07'; // keep in sync with lib/shopify/client.ts's DEFAULT_API_VERSION

// Assigned to a variable before exporting (vs. an anonymous object literal)
// solely to satisfy import/no-anonymous-default-export; graphql-codegen
// resolves the same config value either way.
const config = {
  schema: `https://shopify.dev/storefront-graphql-direct-proxy/${API_VERSION}`,
  documents: ['./lib/shopify/queries/**/*.ts'],
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Storefront,
      apiVersion: API_VERSION,
      documents: ['./lib/shopify/queries/**/*.ts'],
      outputDir: './lib/shopify',
    }),
  },
};

export default config;

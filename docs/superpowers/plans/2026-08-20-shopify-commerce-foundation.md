# Shopify Commerce Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Shopify Storefront API client, typed GraphQL queries, and product/collection data-fetching functions (ROADMAP.md Phase 2, narrowed) — no cart, no checkout, no UI wiring this pass.

**Architecture:** `lib/shopify/client.ts` wraps `@shopify/storefront-api-client`, throwing a clear error only when actually called without credentials (never at import time). `lib/shopify/queries/` holds `#graphql`-tagged query documents that `@shopify/api-codegen-preset` turns into real TypeScript types generated against Shopify's live, public schema proxy (no store credentials needed for this). `lib/shopify/products.ts`/`collections.ts` are typed fetch functions built on top, tested against hand-written fixtures shaped like the real generated types — there is no live store to test against yet.

**Tech Stack:** `@shopify/storefront-api-client` (client), `@shopify/api-codegen-preset` + `@graphql-codegen/cli` + `graphql` (typed queries), `vitest` + `vite-tsconfig-paths` (new — this repo has no unit-test runner yet, only Playwright E2E).

**Spec:** `docs/superpowers/specs/2026-08-20-shopify-commerce-foundation-design.md`

## Global Constraints

- TypeScript strict mode stays on; no `@ts-ignore`/`@ts-nocheck`/`any`.
- pnpm only; do not introduce a second package manager.
- No cart, checkout, or UI wiring this pass — see the spec's Explicit Non-Goals. `lib/navigation-data.ts` stays untouched.
- Storefront API version: `2026-07` — confirm still supported (~12-month lifecycle) before implementation; bump if not, as routine maintenance, not a new decision.
- Every exported fetch function throws a plain `Error` with a clear message when `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_API_TOKEN` are unset — never silently returns empty data.
- `lib/shopify/types.generated.ts` is generated, gitignored, never hand-edited — same treatment as `next-env.d.ts`.
- Record DECISIONS.md D-015 and D-016 as specified in the spec.
- Do not modify `CLAUDE.md` under any circumstance.

---

### Task 1: Vitest unit-test infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/navigation-data.test.ts`
- Modify: `package.json` (add `test:unit` script and new devDependencies)

**Interfaces:**
- Consumes: `NAVIGATION` from `lib/navigation-data.ts` (already exists: `NavCategory[]`, first entry `{ label: 'NEW', href: '/new' }`).
- Produces: `pnpm test:unit` — runs Vitest once (`vitest run`), resolving the `@/*` path alias the same way Next.js does. Every later task's unit tests depend on this working.

This repo has no unit-test runner yet (only `@playwright/test` for E2E). Adding one is a real infrastructure decision, not filler — the fetch functions in later tasks can't be tested any other way without a live Shopify store.

- [ ] **Step 1: Install Vitest and the tsconfig-paths plugin**

```bash
pnpm add -D vitest vite-tsconfig-paths
```

Only these two — no `@vitejs/plugin-react`/`jsdom`/`@testing-library/react`. Everything tested in this plan is plain TypeScript data-fetching logic, not React components; installing a React/DOM testing stack for that would be an unjustified dependency per this project's own constraints.

- [ ] **Step 2: Write the Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/e2e/**'],
    unstubEnvs: true, // auto-restores vi.stubEnv() calls after each test
  },
});
```

- [ ] **Step 3: Add the `test:unit` script**

In `package.json`, add to `"scripts"` (alphabetical position doesn't matter, but keep the existing scripts intact):

```json
"test:unit": "vitest run",
```

- [ ] **Step 4: Run it now, before writing any test — confirm it reports zero tests, not an error**

Run: `pnpm test:unit`
Expected: exits cleanly, reports "No test files found" or similar — proves the config itself is valid before any test exists to mask a config error.

- [ ] **Step 5: Write a real smoke test proving the `@/*` alias resolves**

Create `lib/navigation-data.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { NAVIGATION } from '@/lib/navigation-data';

describe('navigation-data', () => {
  test('NAVIGATION starts with the NEW category', () => {
    expect(NAVIGATION[0]).toEqual({ label: 'NEW', href: '/new' });
  });
});
```

This isn't a throwaway assertion — it's a real check against `lib/navigation-data.ts`'s actual exported data, and it only passes if Vitest can resolve the `@/*` alias `tsconfig.json` defines, which every later task's tests also rely on.

- [ ] **Step 6: Run it, confirm it passes**

Run: `pnpm test:unit`
Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts lib/navigation-data.test.ts package.json pnpm-lock.yaml
git commit -m "Add Vitest for unit testing (no runner existed; E2E-only before this)"
```

---

### Task 2: Shopify Storefront API client

**Files:**
- Create: `lib/shopify/client.ts`
- Create: `lib/shopify/client.test.ts`
- Modify: `package.json` (add `@shopify/storefront-api-client` dependency)

**Interfaces:**
- Consumes: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_API_TOKEN`, `SHOPIFY_STOREFRONT_API_VERSION` from `process.env` (already scaffolded as empty placeholders in `.env.local.example`).
- Produces: `getStorefrontClient(): StorefrontApiClient` — exported from `lib/shopify/client.ts`. Tasks 3 and 4 call this at the start of every fetch function; never instantiate a client themselves.

- [ ] **Step 1: Install the client package**

```bash
pnpm add @shopify/storefront-api-client
```

This is a runtime dependency, not a dev dependency — it ships in the production bundle wherever a Server Component calls a fetch function that uses it.

- [ ] **Step 2: Write the failing test**

Create `lib/shopify/client.test.ts`:

```typescript
import { describe, expect, test, vi } from 'vitest';
import { getStorefrontClient } from '@/lib/shopify/client';

describe('getStorefrontClient', () => {
  test('throws a clear error when SHOPIFY_STORE_DOMAIN is unset', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', undefined);
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'test-token');
    expect(() => getStorefrontClient()).toThrow(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  });

  test('throws a clear error when SHOPIFY_STOREFRONT_API_TOKEN is unset', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'test-shop.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', undefined);
    expect(() => getStorefrontClient()).toThrow(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  });

  test('returns a configured client when both are set', () => {
    vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'test-shop.myshopify.com');
    vi.stubEnv('SHOPIFY_STOREFRONT_API_TOKEN', 'test-token');
    const client = getStorefrontClient();
    expect(client).toHaveProperty('request');
    expect(typeof client.request).toBe('function');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/shopify/client.ts` doesn't exist yet, so the import fails.

- [ ] **Step 3: Implement the client**

Create `lib/shopify/client.ts`:

```typescript
import { createStorefrontApiClient, type StorefrontApiClient } from '@shopify/storefront-api-client';

// Falls back to this if SHOPIFY_STOREFRONT_API_VERSION isn't set. Keep in
// sync with .graphqlrc.ts's hardcoded apiVersion (Task 3) — codegen runs
// as a standalone CLI tool outside Next.js's env loading, so it can't
// read this fallback directly; both must be bumped together when the
// pinned Storefront API version changes.
const DEFAULT_API_VERSION = '2026-07';

/**
 * Returns a configured Shopify Storefront API client, or throws a clear
 * error if SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_API_TOKEN aren't
 * set. Called lazily by every fetch function in products.ts/collections.ts
 * — never instantiated at module load time, so importing this file (or
 * anything that transitively imports it) never fails just because
 * Shopify isn't configured yet. The thrown error is expected to
 * propagate to app/error.tsx once a real caller exists in a later phase
 * — no separate "not configured" UI is built here.
 */
export function getStorefrontClient(): StorefrontApiClient {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const publicAccessToken = process.env.SHOPIFY_STOREFRONT_API_TOKEN;

  if (!storeDomain || !publicAccessToken) {
    throw new Error(
      'Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN.',
    );
  }

  return createStorefrontApiClient({
    storeDomain,
    apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION,
    publicAccessToken,
  });
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: 3 passed (plus Task 1's 1 passed — 4 total).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/shopify/client.ts lib/shopify/client.test.ts package.json pnpm-lock.yaml
git commit -m "Add Shopify Storefront API client (lazy, throws clearly when unconfigured)"
```

---

### Task 3: GraphQL codegen + Collections data fetching

**Files:**
- Create: `.graphqlrc.ts`
- Create: `lib/shopify/queries/collections.ts`
- Create: `lib/shopify/collections.ts`
- Create: `lib/shopify/collections.test.ts`
- Modify: `.gitignore` (add generated types file)
- Modify: `package.json` (add codegen packages + `graphql-codegen` script)

**Interfaces:**
- Consumes: `getStorefrontClient()` from Task 2.
- Produces: `getCollection(handle, first?, after?): Promise<CollectionDetail | null>` and `getCollections(first?, after?): Promise<{ collections: CollectionSummary[]; hasNextPage: boolean; endCursor: string | null }>`, both exported from `lib/shopify/collections.ts`. `CollectionSummary { id, handle, title, dropStatus: string | null }`. `CollectionDetail extends CollectionSummary { description, dropDate: string | null, archivedAt: string | null, products: { id, handle, title }[], hasNextPage, endCursor }`. Task 4 does not consume these directly (products and collections are independent), but Phase 4/5 will.

This task sets up the codegen tooling (needed by Task 4 too) and proves it end-to-end with the first real query documents.

- [ ] **Step 1: Install codegen packages**

```bash
pnpm add -D @shopify/api-codegen-preset @graphql-codegen/cli graphql
```

`graphql` is a peer dependency both codegen packages need directly.

- [ ] **Step 2: Write the codegen config**

Create `.graphqlrc.ts` at the repo root (this is the real, working filename graphql-codegen resolves — not `codegen.ts`):

```typescript
import { ApiType, shopifyApiProject } from '@shopify/api-codegen-preset';

const API_VERSION = '2026-07'; // keep in sync with lib/shopify/client.ts's DEFAULT_API_VERSION

export default {
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
```

`outputDir: './lib/shopify'` — the preset names its output file `types.generated.ts` inside that directory, matching the spec's file structure.

- [ ] **Step 3: Add the `.gitignore` entry**

In `.gitignore`, under the existing `# TypeScript` section (next to `next-env.d.ts`):

```
lib/shopify/types.generated.ts
```

- [ ] **Step 4: Add the codegen script**

In `package.json`, add to `"scripts"`:

```json
"graphql-codegen": "graphql-codegen",
```

- [ ] **Step 5: Write the Collections query documents**

Create `lib/shopify/queries/collections.ts`:

```typescript
// #graphql-tagged query documents for Collection data. graphql-codegen
// (.graphqlrc.ts) scans this file and generates matching TypeScript
// types into types.generated.ts — never hand-edit those types.

export const GET_COLLECTION_QUERY = `#graphql
  query GetCollection($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      dropStatus: metafield(namespace: "custom", key: "drop_status") {
        value
      }
      dropDate: metafield(namespace: "custom", key: "drop_date") {
        value
      }
      archivedAt: metafield(namespace: "custom", key: "archived_at") {
        value
      }
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            handle
            title
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const GET_COLLECTIONS_QUERY = `#graphql
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          title
          dropStatus: metafield(namespace: "custom", key: "drop_status") {
            value
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
```

The `custom` metafield namespace is a reasonable default (Shopify's admin UI uses it for merchant-defined metafields without an app-specific namespace) but is provisional — confirm it against the real store's actual metafield definitions once one exists; this is exactly the kind of detail that can't be verified without a live store.

- [ ] **Step 6: Run codegen for real, against the live public schema**

Run: `pnpm graphql-codegen`
Expected: succeeds, creates `lib/shopify/types.generated.ts` containing (at minimum) `GetCollectionQuery`, `GetCollectionQueryVariables`, `GetCollectionsQuery`, `GetCollectionsQueryVariables` types. This is the concrete proof the query documents are valid GraphQL against Shopify's real, current schema — not a hypothetical one. If it fails, the error will name the specific invalid field/type; fix the query in Step 5 and rerun before continuing.

- [ ] **Step 7: Write the failing test**

Create `lib/shopify/collections.test.ts`:

```typescript
import { describe, expect, test, vi } from 'vitest';
import { getCollection, getCollections } from '@/lib/shopify/collections';
import * as clientModule from '@/lib/shopify/client';

function mockClient(response: unknown) {
  vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
    request: vi.fn().mockResolvedValue(response),
  } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);
}

describe('getCollection', () => {
  test('returns null when no collection matches the handle', async () => {
    mockClient({ data: { collection: null } });
    const result = await getCollection('does-not-exist');
    expect(result).toBeNull();
  });

  test('maps a real-shaped response into a CollectionDetail, defaulting absent metafields to null', async () => {
    mockClient({
      data: {
        collection: {
          id: 'gid://shopify/Collection/1',
          handle: 'collection-001',
          title: 'Collection 001',
          description: 'The first drop.',
          dropStatus: { value: 'active' },
          dropDate: null,
          archivedAt: null,
          products: {
            edges: [
              {
                cursor: 'c1',
                node: { id: 'gid://shopify/Product/1', handle: 'item-one', title: 'Item One' },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'c1' },
          },
        },
      },
    });

    const result = await getCollection('collection-001');

    expect(result).toEqual({
      id: 'gid://shopify/Collection/1',
      handle: 'collection-001',
      title: 'Collection 001',
      description: 'The first drop.',
      dropStatus: 'active',
      dropDate: null,
      archivedAt: null,
      products: [{ id: 'gid://shopify/Product/1', handle: 'item-one', title: 'Item One' }],
      hasNextPage: false,
      endCursor: 'c1',
    });
  });
});

describe('getCollections', () => {
  test('maps a page of collections with pagination info', async () => {
    mockClient({
      data: {
        collections: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: 'gid://shopify/Collection/1',
                handle: 'collection-001',
                title: 'Collection 001',
                dropStatus: { value: 'active' },
              },
            },
          ],
          pageInfo: { hasNextPage: true, endCursor: 'c1' },
        },
      },
    });

    const result = await getCollections();

    expect(result).toEqual({
      collections: [
        { id: 'gid://shopify/Collection/1', handle: 'collection-001', title: 'Collection 001', dropStatus: 'active' },
      ],
      hasNextPage: true,
      endCursor: 'c1',
    });
  });
});
```

- [ ] **Step 8: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/shopify/collections.ts` doesn't exist yet.

- [ ] **Step 9: Implement the fetch functions**

Create `lib/shopify/collections.ts`:

```typescript
import { getStorefrontClient } from '@/lib/shopify/client';
import { GET_COLLECTION_QUERY, GET_COLLECTIONS_QUERY } from '@/lib/shopify/queries/collections';
import type {
  GetCollectionQuery,
  GetCollectionQueryVariables,
  GetCollectionsQuery,
  GetCollectionsQueryVariables,
} from '@/lib/shopify/types.generated';

export interface CollectionSummary {
  id: string;
  handle: string;
  title: string;
  dropStatus: string | null;
}

export interface CollectionDetail extends CollectionSummary {
  description: string;
  dropDate: string | null;
  archivedAt: string | null;
  products: { id: string; handle: string; title: string }[];
  hasNextPage: boolean;
  endCursor: string | null;
}

/**
 * Fetches a single collection by handle, including its drop-status
 * metafields (ARCHITECTURE.md §5) and a first page of its products.
 * Returns null if no collection matches — a genuinely absent collection
 * is not an error; the caller decides how to handle it (e.g. Next.js's
 * notFound()).
 */
export async function getCollection(
  handle: string,
  first = 20,
  after?: string,
): Promise<CollectionDetail | null> {
  const client = getStorefrontClient();
  const { data } = await client.request<GetCollectionQuery, GetCollectionQueryVariables>(
    GET_COLLECTION_QUERY,
    { variables: { handle, first, after: after ?? null } },
  );

  const collection = data?.collection;
  if (!collection) return null;

  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description ?? '',
    dropStatus: collection.dropStatus?.value ?? null,
    dropDate: collection.dropDate?.value ?? null,
    archivedAt: collection.archivedAt?.value ?? null,
    products: collection.products.edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
    })),
    hasNextPage: collection.products.pageInfo.hasNextPage,
    endCursor: collection.products.pageInfo.endCursor ?? null,
  };
}

/**
 * Fetches a page of collections. Cursor-paginated per the Storefront
 * API's standard pattern — pass the previous call's endCursor as `after`
 * to fetch the next page.
 */
export async function getCollections(
  first = 20,
  after?: string,
): Promise<{ collections: CollectionSummary[]; hasNextPage: boolean; endCursor: string | null }> {
  const client = getStorefrontClient();
  const { data } = await client.request<GetCollectionsQuery, GetCollectionsQueryVariables>(
    GET_COLLECTIONS_QUERY,
    { variables: { first, after: after ?? null } },
  );

  const edges = data?.collections?.edges ?? [];

  return {
    collections: edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      dropStatus: node.dropStatus?.value ?? null,
    })),
    hasNextPage: data?.collections?.pageInfo?.hasNextPage ?? false,
    endCursor: data?.collections?.pageInfo?.endCursor ?? null,
  };
}
```

- [ ] **Step 10: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all tests pass (Task 1's 1 + Task 2's 3 + this task's 3 = 7 total).

- [ ] **Step 11: Typecheck**

Run: `pnpm typecheck`
Expected: no errors. If `collection.description`/similar fields report as possibly `null`/`undefined` against the generated types in a way this code doesn't already guard, adjust the mapping to match — the generated types are the source of truth, not this plan's prediction of their exact shape.

- [ ] **Step 12: Commit**

```bash
git add .graphqlrc.ts .gitignore lib/shopify/queries/collections.ts lib/shopify/collections.ts lib/shopify/collections.test.ts package.json pnpm-lock.yaml
git commit -m "Add GraphQL codegen + typed Collections data fetching"
```

Do not commit `lib/shopify/types.generated.ts` — it's gitignored (Step 3).

---

### Task 4: Products data fetching

**Files:**
- Create: `lib/shopify/queries/products.ts`
- Create: `lib/shopify/products.ts`
- Create: `lib/shopify/products.test.ts`

**Interfaces:**
- Consumes: `getStorefrontClient()` from Task 2. Codegen tooling from Task 3 (already installed and configured — this task only adds new query documents to the existing `.graphqlrc.ts` glob, no new setup).
- Produces: `getProduct(handle): Promise<ProductDetail | null>` and `getProductsByCollection(handle, first?, after?): Promise<{ products: ProductSummary[]; hasNextPage: boolean; endCursor: string | null }>`, exported from `lib/shopify/products.ts`.

- [ ] **Step 1: Write the Products query documents**

Create `lib/shopify/queries/products.ts`:

```typescript
// #graphql-tagged query documents for Product data. Picked up by the
// same graphql-codegen config as queries/collections.ts (.graphqlrc.ts).

export const GET_PRODUCT_QUERY = `#graphql
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      productType
      tags
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_COLLECTION_QUERY = `#graphql
  query GetProductsByCollection($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            handle
            title
            productType
            tags
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
```

- [ ] **Step 2: Regenerate codegen to add the new types**

Run: `pnpm graphql-codegen`
Expected: succeeds, `lib/shopify/types.generated.ts` now also contains `GetProductQuery`, `GetProductQueryVariables`, `GetProductsByCollectionQuery`, `GetProductsByCollectionQueryVariables` alongside the Collections types from Task 3 (codegen regenerates the whole file from all matched documents — this is expected, not a conflict).

- [ ] **Step 3: Write the failing test**

Create `lib/shopify/products.test.ts`:

```typescript
import { describe, expect, test, vi } from 'vitest';
import { getProduct, getProductsByCollection } from '@/lib/shopify/products';
import * as clientModule from '@/lib/shopify/client';

function mockClient(response: unknown) {
  vi.spyOn(clientModule, 'getStorefrontClient').mockReturnValue({
    request: vi.fn().mockResolvedValue(response),
  } as unknown as ReturnType<typeof clientModule.getStorefrontClient>);
}

describe('getProduct', () => {
  test('returns null when no product matches the handle', async () => {
    mockClient({ data: { product: null } });
    const result = await getProduct('does-not-exist');
    expect(result).toBeNull();
  });

  test('maps a real-shaped response into a ProductDetail', async () => {
    mockClient({
      data: {
        product: {
          id: 'gid://shopify/Product/1',
          handle: 'item-one',
          title: 'Item One',
          description: 'A first piece.',
          productType: 'Tops',
          tags: ['new'],
          priceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'USD' } },
          images: {
            edges: [{ node: { url: 'https://cdn.example/item-one.jpg', altText: null, width: 800, height: 1000 } }],
          },
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/1',
                  title: 'M',
                  availableForSale: true,
                  price: { amount: '120.00', currencyCode: 'USD' },
                  selectedOptions: [{ name: 'Size', value: 'M' }],
                },
              },
            ],
          },
        },
      },
    });

    const result = await getProduct('item-one');

    expect(result).toEqual({
      id: 'gid://shopify/Product/1',
      handle: 'item-one',
      title: 'Item One',
      description: 'A first piece.',
      productType: 'Tops',
      tags: ['new'],
      minPrice: { amount: '120.00', currencyCode: 'USD' },
      images: [{ url: 'https://cdn.example/item-one.jpg', altText: null, width: 800, height: 1000 }],
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          title: 'M',
          availableForSale: true,
          price: { amount: '120.00', currencyCode: 'USD' },
          selectedOptions: [{ name: 'Size', value: 'M' }],
        },
      ],
    });
  });
});

describe('getProductsByCollection', () => {
  test('maps a page of products, defaulting to no image when none exists', async () => {
    mockClient({
      data: {
        collection: {
          products: {
            edges: [
              {
                cursor: 'c1',
                node: {
                  id: 'gid://shopify/Product/1',
                  handle: 'item-one',
                  title: 'Item One',
                  productType: 'Tops',
                  tags: ['new'],
                  priceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'USD' } },
                  images: { edges: [] },
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'c1' },
          },
        },
      },
    });

    const result = await getProductsByCollection('collection-001');

    expect(result).toEqual({
      products: [
        {
          id: 'gid://shopify/Product/1',
          handle: 'item-one',
          title: 'Item One',
          productType: 'Tops',
          tags: ['new'],
          minPrice: { amount: '120.00', currencyCode: 'USD' },
          image: null,
        },
      ],
      hasNextPage: false,
      endCursor: 'c1',
    });
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `pnpm test:unit`
Expected: FAIL — `lib/shopify/products.ts` doesn't exist yet.

- [ ] **Step 5: Implement the fetch functions**

Create `lib/shopify/products.ts`:

```typescript
import { getStorefrontClient } from '@/lib/shopify/client';
import { GET_PRODUCT_QUERY, GET_PRODUCTS_BY_COLLECTION_QUERY } from '@/lib/shopify/queries/products';
import type {
  GetProductQuery,
  GetProductQueryVariables,
  GetProductsByCollectionQuery,
  GetProductsByCollectionQueryVariables,
} from '@/lib/shopify/types.generated';

export interface ProductImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}

export interface ProductDetail {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  minPrice: { amount: string; currencyCode: string };
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductSummary {
  id: string;
  handle: string;
  title: string;
  productType: string;
  tags: string[];
  minPrice: { amount: string; currencyCode: string };
  image: ProductImage | null;
}

/**
 * Fetches a single product by handle, for a product detail page. Returns
 * null if no product matches — a genuinely absent product is not an
 * error; the caller decides how to handle it (e.g. Next.js's notFound()).
 */
export async function getProduct(handle: string): Promise<ProductDetail | null> {
  const client = getStorefrontClient();
  const { data } = await client.request<GetProductQuery, GetProductQueryVariables>(
    GET_PRODUCT_QUERY,
    { variables: { handle } },
  );

  const product = data?.product;
  if (!product) return null;

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description ?? '',
    productType: product.productType,
    tags: product.tags,
    minPrice: product.priceRange.minVariantPrice,
    images: product.images.edges.map(({ node }) => node),
    variants: product.variants.edges.map(({ node }) => node),
  };
}

/**
 * Fetches a page of products belonging to a collection, for catalog/grid
 * views. Cursor-paginated per the Storefront API's standard pattern.
 */
export async function getProductsByCollection(
  handle: string,
  first = 24,
  after?: string,
): Promise<{ products: ProductSummary[]; hasNextPage: boolean; endCursor: string | null }> {
  const client = getStorefrontClient();
  const { data } = await client.request<
    GetProductsByCollectionQuery,
    GetProductsByCollectionQueryVariables
  >(GET_PRODUCTS_BY_COLLECTION_QUERY, { variables: { handle, first, after: after ?? null } });

  const edges = data?.collection?.products?.edges ?? [];

  return {
    products: edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      productType: node.productType,
      tags: node.tags,
      minPrice: node.priceRange.minVariantPrice,
      image: node.images.edges[0]?.node ?? null,
    })),
    hasNextPage: data?.collection?.products?.pageInfo?.hasNextPage ?? false,
    endCursor: data?.collection?.products?.pageInfo?.endCursor ?? null,
  };
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `pnpm test:unit`
Expected: all tests pass (7 from before + this task's 3 = 10 total).

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors. As in Task 3, adjust the mapping to match whatever the real generated types report for nullability — they're the source of truth.

- [ ] **Step 8: Commit**

```bash
git add lib/shopify/queries/products.ts lib/shopify/products.ts lib/shopify/products.test.ts
git commit -m "Add typed Products data fetching"
```

---

### Task 5: Record decisions and update ROADMAP

**Files:**
- Modify: `DECISIONS.md` (append D-015, D-016)
- Modify: `ROADMAP.md` (Phase 2 checkboxes)

**Interfaces:**
- Consumes: nothing new — this task documents Tasks 1-4's completed work.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Confirm the next available decision numbers**

Run: `grep -n "^## D-0" DECISIONS.md | tail -3`
Expected: confirms D-014 is the last existing entry (per the previous phase's final report) — if a later number already exists, use the next free ones instead of D-015/D-016 and note the renumbering here.

- [ ] **Step 2: Append D-015 and D-016**

At the end of `DECISIONS.md`, following the existing entries' format (`## D-0XX — Title`, `**Decision:**`, `**Reason:**`):

```markdown
## D-015 — `@shopify/storefront-api-client` + `@shopify/api-codegen-preset` for Storefront API integration

**Decision:** Use `@shopify/storefront-api-client` as the Storefront API client and `@shopify/api-codegen-preset` (with `@graphql-codegen/cli`) to generate TypeScript types from `#graphql`-tagged query documents.

**Reason:** `ARCHITECTURE.md` §2 already ruled out the full Hydrogen framework ("to avoid over-coupling to Shopify's opinionated stack") but left the specific lightweight alternative unnamed. `@shopify/storefront-api-client` is Shopify's own official, framework-agnostic client built for exactly this case — confirmed via Shopify's current documentation, not assumed. Types are generated against Shopify's real Storefront API schema via a public proxy endpoint (`shopify.dev/storefront-graphql-direct-proxy`) that requires no store credentials, so full type safety is achievable before a real store exists — verified directly rather than assumed possible.

## D-016 — Phase 2 narrowed to client + product/collection reads; cart and checkout deferred

**Decision:** This pass of ROADMAP.md Phase 2 implements only the Shopify Storefront API client and typed product/collection read queries. Cart (Storefront API cart object) and Shopify Checkout handoff are deferred to a follow-up phase.

**Reason:** No Shopify store exists yet, so nothing built here can be tested against live data. Read-only product/collection queries can be fully type-verified against Shopify's real, live schema even without a store. Cart mutations and the checkout handoff (which fundamentally means redirecting to a real Shopify-issued checkout URL) cannot be meaningfully verified at all without hitting a live store. The previous phase's final whole-branch review found its two worst defects specifically in code paths that had never been exercised end-to-end (an untested CI pipeline, an unmeasured viewport) — deferring the hardest-to-verify commerce code avoids repeating that pattern on checkout, where the cost of an undiscovered defect is highest.
```

- [ ] **Step 3: Update ROADMAP.md's Phase 2 checkboxes**

In `ROADMAP.md`, change:

```markdown
## Phase 2 — Commerce Foundation

- [ ] Shopify Storefront API client + typed GraphQL queries
- [ ] Product/collection data fetching
- [ ] Cart (Storefront API cart object, persisted cart ID)
- [ ] Shopify Checkout handoff
```

to:

```markdown
## Phase 2 — Commerce Foundation

- [x] Shopify Storefront API client + typed GraphQL queries
- [x] Product/collection data fetching
- [ ] Cart (Storefront API cart object, persisted cart ID) — deferred pending a real Shopify store; see DECISIONS.md D-016
- [ ] Shopify Checkout handoff — deferred pending a real Shopify store; see DECISIONS.md D-016
```

- [ ] **Step 4: Commit**

```bash
git add DECISIONS.md ROADMAP.md
git commit -m "Record D-015/D-016; mark Phase 2's client/data-fetching items complete"
```

---

### Task 6: Final validation pass

**Files:** None created or modified — this task only runs checks and fixes any findings in the files Tasks 1-5 already touched.

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: nothing — this is the plan's closing verification task.

- [ ] **Step 1: Format check**

Run: `pnpm format:check`
Expected: passes. If not, run `pnpm format -- lib/shopify vitest.config.ts .graphqlrc.ts` (scoped to this plan's files, not a repo-wide write — repo-wide `prettier --write .` reformatted protected governance docs earlier in this project's history; `.prettierignore` now guards against that, but stay scoped anyway) and re-check.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: clean.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 4: Full unit suite**

Run: `pnpm test:unit`
Expected: 10 passed, 0 failed (1 from Task 1, 3 from Task 2, 3 from Task 3, 3 from Task 4).

- [ ] **Step 5: Confirm codegen is reproducible from a clean state**

Run: `rm lib/shopify/types.generated.ts && pnpm graphql-codegen`
Expected: regenerates cleanly with no errors, confirming the generated file isn't accidentally load-bearing in git (it's gitignored — this proves a fresh clone/checkout can reproduce it).

- [ ] **Step 6: Full E2E suite — confirm nothing regressed**

Run: `pnpm test:e2e`
Expected: same pass count as before this plan started (this plan adds no UI, so no new E2E coverage is expected — only confirming the existing suite is unaffected).

- [ ] **Step 7: Production build**

Run: `pnpm build`
Expected: succeeds. This also confirms `lib/shopify/*` compiles cleanly into the production bundle even though nothing calls it yet (dead code today, live code once Phase 4 imports it).

- [ ] **Step 8: Manual confirmation that unconfigured behavior is safe**

Run: `pnpm build && pnpm start &` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` — confirm `200`, then stop the server. This confirms that shipping `lib/shopify/*` with empty Shopify env vars (the actual current state of `.env.local`/production, since no store exists) doesn't break the app that's already running — nothing calls these functions yet, so this should trivially pass, but it's the concrete proof rather than an assumption.

- [ ] **Step 9: Commit if Step 1 produced any changes**

```bash
git add -A
git commit -m "Final validation pass for Shopify commerce foundation"
```

If Step 1 made no changes, skip this step — nothing to commit.

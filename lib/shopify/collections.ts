import { getStorefrontClient } from '@/lib/shopify/client';
import { GET_COLLECTION_QUERY, GET_COLLECTIONS_QUERY } from '@/lib/shopify/queries/collections';
// No explicit <ReturnType, Variables> generics on client.request() below: this
// client infers both from the query-string literal via the StorefrontQueries
// map that storefront.generated.d.ts augments onto '@shopify/storefront-api-client'
// (verified against its actual .d.ts — request<TData, Operation extends keyof
// Operations>() takes an optional return-type override and an Operation key
// inferred from the call site, not a (ReturnType, Variables) pair; passing both
// explicitly, as originally planned, fails typecheck because Variables doesn't
// satisfy the Operation-key constraint).

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
  const { data } = await client.request(GET_COLLECTION_QUERY, {
    variables: { handle, first, after: after ?? null },
  });

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
  const { data } = await client.request(GET_COLLECTIONS_QUERY, {
    variables: { first, after: after ?? null },
  });

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

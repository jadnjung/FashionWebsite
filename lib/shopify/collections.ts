import { getStorefrontClient, toRequestError } from '@/lib/shopify/client';
import {
  GET_COLLECTION_PREDICTIVE_SEARCH_QUERY,
  GET_COLLECTION_QUERY,
  GET_COLLECTIONS_QUERY,
} from '@/lib/shopify/queries/collections';
// Demo Mode (PREVIEW_DEMO_MODE) — see preview-demo-fixtures.ts's file
// header and DECISIONS.md D-057 for what this is, why it exists, and how
// it's scoped (opt-in, off by default everywhere). This import and the
// two short-circuits below are the only places this file branches on it.
import {
  getPreviewCollections,
  getPreviewCollectionDetail,
} from '@/lib/shopify/preview-demo-fixtures';
import { getPaginationCursor, previewPage } from '@/lib/shopify/pagination';
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
  // Needed by lib/collections/drop-phase.ts/lib/home/upcoming-drop.ts to
  // classify a summary-shaped collection (from getCollections()) as
  // upcoming, without a second round-trip through getCollection() just to
  // read one more metafield — same low-risk "add another metafield alias
  // field" extension D-062 used for archivedAt below.
  dropDate: string | null;
  archivedAt: string | null;
}

export interface CollectionDetail extends CollectionSummary {
  description: string;
  products: { id: string; handle: string; title: string }[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface CollectionsPage {
  collections: CollectionSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
}

/**
 * Fetches a single collection by handle, including its drop-status
 * metafields (ARCHITECTURE.md §5) and a first page of its products.
 * Returns null if no collection matches — a genuinely absent collection
 * is not an error; the caller decides how to handle it (e.g. Next.js's
 * notFound()). Throws if the Storefront API response includes `errors`
 * (e.g. a bad field, a throttled request) — that is a real failure, not
 * a not-found case, and is never swallowed or misreported as one.
 */
export async function getCollection(
  handle: string,
  first = 20,
  after?: string,
): Promise<CollectionDetail | null> {
  // Demo Mode short-circuit — see the import above and DECISIONS.md D-057.
  // Never reaches getStorefrontClient() below, so it never requires (or
  // risks touching) real Shopify credentials.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const collection = getPreviewCollectionDetail(handle);
    if (!collection) return null;
    const page = previewPage(collection.products, first, after);
    return {
      ...collection,
      products: page.items,
      hasNextPage: page.hasNextPage,
      endCursor: page.endCursor,
    };
  }
  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_COLLECTION_QUERY, {
    variables: { handle, first, after: after ?? null },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const collection = data?.collection;
  if (!collection) return null;

  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
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
 * to fetch the next page. Throws if the Storefront API response includes
 * `errors` (e.g. a bad field, a throttled request) rather than returning
 * an empty page — a real failure must never look like "no collections".
 */
export async function getCollections(
  first = 20,
  after?: string,
  signal?: AbortSignal,
): Promise<CollectionsPage> {
  signal?.throwIfAborted();
  // Demo Mode short-circuit — see the import above and DECISIONS.md D-057.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const page = previewPage(getPreviewCollections(), first, after);
    return {
      collections: page.items,
      hasNextPage: page.hasNextPage,
      endCursor: page.endCursor,
    };
  }
  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_COLLECTIONS_QUERY, {
    variables: { first, after: after ?? null },
    ...(signal ? { signal } : {}),
  });

  signal?.throwIfAborted();

  if (errors) {
    throw toRequestError(errors);
  }

  const connection = data?.collections;
  const pageInfo = connection?.pageInfo;
  if (
    !Array.isArray(connection?.edges) ||
    typeof pageInfo?.hasNextPage !== 'boolean' ||
    (pageInfo.endCursor != null &&
      (typeof pageInfo.endCursor !== 'string' || !getPaginationCursor(pageInfo.endCursor)))
  ) {
    throw new Error('Shopify collection connection is malformed.');
  }
  if (pageInfo.hasNextPage && (!pageInfo.endCursor || pageInfo.endCursor === after)) {
    throw new Error('Shopify collection pagination did not advance.');
  }
  const edges = connection.edges;
  if (
    edges.some(
      (edge) =>
        !edge?.node ||
        typeof edge.node.id !== 'string' ||
        !edge.node.id ||
        typeof edge.node.handle !== 'string' ||
        !edge.node.handle ||
        typeof edge.node.title !== 'string',
    )
  ) {
    throw new Error('Shopify collection entries are malformed.');
  }

  return {
    collections: edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      dropStatus: node.dropStatus?.value ?? null,
      dropDate: node.dropDate?.value ?? null,
      archivedAt: node.archivedAt?.value ?? null,
    })),
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor ?? null,
  };
}

export interface SearchCollectionsOptions {
  limit?: number;
}

/**
 * Predictive collection search for the full-screen search overlay's
 * COLLECTIONS result group — a sibling of products.ts's searchProducts,
 * built against a deliberately separate query
 * (GET_COLLECTION_PREDICTIVE_SEARCH_QUERY, types: [COLLECTION]) rather than
 * extending GET_PREDICTIVE_SEARCH_QUERY to request both result types at
 * once — see that query's own comment for why. app/api/search/route.ts
 * calls this alongside searchProducts in one Promise.all, so the two
 * Storefront round-trips happen concurrently, not sequentially. Returns
 * [] for a blank/whitespace-only query without ever calling
 * getStorefrontClient() — same contract as searchProducts. Throws via
 * toRequestError on a real Storefront API error, never swallowed here —
 * the caller decides how to surface that to its own client.
 */
export async function searchCollections(
  query: string,
  options: SearchCollectionsOptions = {},
): Promise<CollectionSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const limit = options.limit ?? 6;

  // Demo Mode short-circuit — DECISIONS.md D-057, extended for this
  // feature per D-058's original COLLECTIONS deferral. Mirrors
  // searchProducts' own inline Demo Mode filtering style exactly: filters
  // PREVIEW_COLLECTIONS directly (title substring match, case-insensitive)
  // rather than adding a new, separate fixture export.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const q = trimmed.toLowerCase();
    return getPreviewCollections()
      .filter((c) => c.title.toLowerCase().includes(q))
      .slice(0, limit);
  }

  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_COLLECTION_PREDICTIVE_SEARCH_QUERY, {
    variables: { query: trimmed, limit },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const collections = data?.predictiveSearch?.collections ?? [];
  return collections.map((node) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    dropStatus: node.dropStatus?.value ?? null,
    dropDate: node.dropDate?.value ?? null,
    archivedAt: node.archivedAt?.value ?? null,
  }));
}

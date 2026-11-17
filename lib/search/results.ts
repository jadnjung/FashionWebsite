import { createHash } from 'node:crypto';
import { getStorefrontClient, toRequestError } from '@/lib/shopify/client';
import { GET_FULL_SEARCH_QUERY } from '@/lib/shopify/queries/search';
import { getPaginationCursor, previewPage } from '@/lib/shopify/pagination';
import {
  getPreviewFullSearchProducts,
  getPreviewCollections,
} from '@/lib/shopify/preview-demo-fixtures';
import {
  MIN_SEARCH_QUERY_LENGTH,
  MAX_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from '@/lib/search-query';
import type { CollectionSummary } from '@/lib/shopify/collections';
import type { ProductListItem } from '@/lib/shopify/products';
import type { SearchCursors } from '@/lib/search/links';

type SearchGroup = 'products' | 'collections';
export interface SearchState extends SearchCursors {
  query: string;
  valid: boolean;
  repeatedQuery: boolean;
}
export interface SearchPage<T> {
  items: T[];
  hasNextPage: boolean;
  endCursor: string | null;
}
export interface FullSearchResults {
  products: SearchPage<ProductListItem>;
  collections: SearchPage<CollectionSummary>;
}

const SEARCH_PAGE_SIZE = 20;
const MAX_SCOPED_CURSOR_LENGTH = 8192;

function scope(query: string, group: SearchGroup) {
  return createHash('sha256')
    .update(JSON.stringify([query, group, 'relevance-prefix-last-v1']))
    .digest('hex')
    .slice(0, 20);
}

function encodeCursor(query: string, group: SearchGroup, cursor: string | null) {
  return cursor
    ? Buffer.from(JSON.stringify([scope(query, group), cursor])).toString('base64url')
    : null;
}

function decodeCursor(query: string, group: SearchGroup, value: unknown): string | undefined {
  if (typeof value !== 'string' || !value || value.length > MAX_SCOPED_CURSOR_LENGTH)
    return undefined;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString());
    if (Array.isArray(parsed) && parsed.length === 2 && parsed[0] === scope(query, group)) {
      return getPaginationCursor(parsed[1]);
    }
  } catch {
    // Malformed, stale and other-group cursors restart only their own group.
  }
  return undefined;
}

export function parseSearchState(
  params: Record<string, string | string[] | undefined>,
): SearchState {
  const repeatedQuery = Array.isArray(params.q);
  const query = typeof params.q === 'string' ? normalizeSearchQuery(params.q) : '';
  const valid =
    !repeatedQuery &&
    query.length >= MIN_SEARCH_QUERY_LENGTH &&
    query.length <= MAX_SEARCH_QUERY_LENGTH;
  const productAfter = valid ? decodeCursor(query, 'products', params.productAfter) : undefined;
  const collectionAfter = valid
    ? decodeCursor(query, 'collections', params.collectionAfter)
    : undefined;
  return {
    query,
    valid,
    repeatedQuery,
    productAfter: encodeCursor(query, 'products', productAfter ?? null) ?? undefined,
    collectionAfter: encodeCursor(query, 'collections', collectionAfter ?? null) ?? undefined,
  };
}

/** Title-only matching, with literal words and a partial final word. */
export function buildCollectionSearchQuery(query: string): string {
  const words = query.split(/\s+/);
  return words
    .map((word, index) => {
      const literal = word.replace(/[\\:"'()*<>=-]/g, '\\$&');
      return `title:${literal}${index === words.length - 1 ? '*' : ''}`;
    })
    .join(' AND ');
}

function validateContinuation(
  connection:
    | { edges: readonly unknown[]; pageInfo: { hasNextPage: boolean; endCursor?: string | null } }
    | undefined,
  after: string | undefined,
): void {
  if (
    !connection ||
    !Array.isArray(connection.edges) ||
    typeof connection.pageInfo?.hasNextPage !== 'boolean'
  ) {
    throw new Error('Shopify Search connection is malformed.');
  }
  const { hasNextPage, endCursor } = connection.pageInfo;
  if (
    (endCursor != null && !getPaginationCursor(endCursor)) ||
    (hasNextPage && (!connection.edges.length || !endCursor || endCursor === after))
  ) {
    throw new Error('Shopify Search pagination did not advance.');
  }
}

function hasIdentity(node: { id: string; handle: string; title: string } | null | undefined) {
  return Boolean(
    node &&
    [node.id, node.handle, node.title].every((value) => typeof value === 'string' && value.trim()),
  );
}

/** One bounded transport and all-or-nothing response preserve the existing failure policy. */
export async function getFullSearchResults(
  state: SearchState,
  signal?: AbortSignal,
): Promise<FullSearchResults | null> {
  const validated = parseSearchState({
    q: state.query,
    productAfter: state.productAfter,
    collectionAfter: state.collectionAfter,
  });
  if (!state.valid || !validated.valid) return null;
  const query = validated.query;
  const productAfter = decodeCursor(query, 'products', validated.productAfter);
  const collectionAfter = decodeCursor(query, 'collections', validated.collectionAfter);
  signal?.throwIfAborted();

  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const term = query.toLowerCase();
    const products = previewPage(
      getPreviewFullSearchProducts(query),
      SEARCH_PAGE_SIZE,
      productAfter,
    );
    const collections = previewPage(
      getPreviewCollections().filter((collection) => collection.title.toLowerCase().includes(term)),
      SEARCH_PAGE_SIZE,
      collectionAfter,
    );
    return {
      products: { ...products, endCursor: encodeCursor(query, 'products', products.endCursor) },
      collections: {
        ...collections,
        endCursor: encodeCursor(query, 'collections', collections.endCursor),
      },
    };
  }

  const { data, errors } = await getStorefrontClient().request(GET_FULL_SEARCH_QUERY, {
    variables: {
      query,
      collectionQuery: buildCollectionSearchQuery(query),
      first: SEARCH_PAGE_SIZE,
      productAfter: productAfter ?? null,
      collectionAfter: collectionAfter ?? null,
    },
    ...(signal ? { signal } : {}),
  });
  signal?.throwIfAborted();
  if (errors) throw toRequestError(errors);
  validateContinuation(data?.products, productAfter);
  validateContinuation(data?.collections, collectionAfter);
  if (!data) throw new Error('Shopify Search response is missing.');

  const products = data.products.edges.map(({ node }) => {
    if (node?.__typename !== 'Product')
      throw new Error('Shopify Search returned an unexpected resource.');
    const price = node.priceRange?.minVariantPrice;
    if (
      !hasIdentity(node) ||
      typeof node.productType !== 'string' ||
      typeof node.availableForSale !== 'boolean' ||
      !Array.isArray(node.tags) ||
      !node.tags.every((tag) => typeof tag === 'string') ||
      typeof price?.amount !== 'string' ||
      !price.amount.trim() ||
      !Number.isFinite(Number(price.amount)) ||
      Number(price.amount) < 0 ||
      typeof price.currencyCode !== 'string' ||
      !/^[A-Z]{3}$/.test(price.currencyCode) ||
      !Array.isArray(node.images?.edges) ||
      node.images.edges.some(
        (edge) =>
          !edge?.node ||
          typeof edge.node.url !== 'string' ||
          !edge.node.url.trim() ||
          (edge.node.altText != null && typeof edge.node.altText !== 'string') ||
          [edge.node.width, edge.node.height].some(
            (value) =>
              value != null && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0),
          ),
      )
    ) {
      throw new Error('Shopify Search product is malformed.');
    }
    return {
      id: node.id,
      handle: node.handle,
      title: node.title,
      productType: node.productType,
      tags: node.tags,
      availableForSale: node.availableForSale,
      minPrice: node.priceRange.minVariantPrice,
      images: node.images.edges.map(({ node: image }) => ({
        url: image.url,
        altText: image.altText ?? null,
        width: image.width ?? null,
        height: image.height ?? null,
      })),
    };
  });
  const collections = data.collections.edges.map(({ node }) => {
    if (
      !hasIdentity(node) ||
      [node?.dropStatus, node?.dropDate, node?.archivedAt].some(
        (field) => field != null && typeof field.value !== 'string',
      )
    ) {
      throw new Error('Shopify Search collection is malformed.');
    }
    return {
      id: node.id,
      handle: node.handle,
      title: node.title,
      dropStatus: node.dropStatus?.value ?? null,
      dropDate: node.dropDate?.value ?? null,
      archivedAt: node.archivedAt?.value ?? null,
    };
  });
  return {
    products: {
      items: products,
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: encodeCursor(query, 'products', data.products.pageInfo.endCursor ?? null),
    },
    collections: {
      items: collections,
      hasNextPage: data.collections.pageInfo.hasNextPage,
      endCursor: encodeCursor(query, 'collections', data.collections.pageInfo.endCursor ?? null),
    },
  };
}

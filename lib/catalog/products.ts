import { createHash } from 'node:crypto';
import {
  buildProductSearchQuery,
  getSortVariables,
  type CatalogFilters,
} from '@/lib/catalog/filters';
import { getStorefrontClient, toRequestError } from '@/lib/shopify/client';
import {
  toProductDetail,
  type ProductDetail,
  type ProductDetailNode,
  type ProductListItem,
} from '@/lib/shopify/products';
import {
  PREVIEW_PRODUCTS,
  getPreviewProductDetail,
  getPreviewProductCollections,
} from '@/lib/shopify/preview-demo-fixtures';
import {
  GET_CATALOG_PRODUCTS_QUERY,
  GET_CATALOG_FACETS_QUERY,
  GET_PRODUCT_COLLECTIONS_QUERY,
} from '@/lib/shopify/queries/catalog';
import { GET_PRODUCT_VARIANTS_QUERY } from '@/lib/shopify/queries/products';
import { previewPage } from '@/lib/shopify/pagination';
import type { ProductSortKeys } from '@/lib/shopify/storefront.types';

const CANDIDATE_BATCH_SIZE = 24;
const MAX_CANDIDATE_BATCHES = 4;
const CATALOG_DEADLINE_MS = 10_000;

export interface CatalogFacets {
  sizes: string[];
  colors: string[];
  collections: { handle: string; title: string }[];
}

interface CatalogNode extends ProductDetailNode {
  availableForSale: boolean;
  collections: {
    nodes: { handle: string; title: string }[];
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
}

interface CatalogCandidate {
  cursor: string;
  item: ProductListItem;
  node?: CatalogNode;
}

/** OR within an option, AND across options, availability and variant price. */
export function matchesCatalogVariant(product: ProductDetail, filters: CatalogFilters): boolean {
  return product.variants.some((variant) => {
    const size = variant.selectedOptions.find((option) =>
      /^size$/i.test(option.name.trim()),
    )?.value;
    const color = variant.selectedOptions.find((option) =>
      /^colou?r$/i.test(option.name.trim()),
    )?.value;
    const amount = Number(variant.price.amount);
    return (
      (!filters.sizes?.length || Boolean(size && filters.sizes.includes(size))) &&
      (!filters.colors?.length || Boolean(color && filters.colors.includes(color))) &&
      (!filters.available || variant.availableForSale) &&
      (filters.minPrice === undefined || amount >= filters.minPrice) &&
      (filters.maxPrice === undefined || amount <= filters.maxPrice)
    );
  });
}

function cursorScope(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
}

function encodeCursor(scope: string, cursor: string) {
  return Buffer.from(JSON.stringify([scope, cursor])).toString('base64url');
}

function decodeCursor(value: string | undefined, scope: string): string | undefined {
  if (!value || value.length > 4096) return undefined;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString());
    if (Array.isArray(parsed) && parsed[0] === scope && typeof parsed[1] === 'string')
      return parsed[1];
  } catch {
    // Invalid or stale URL cursors restart at the first page.
  }
  return undefined;
}

export async function getCatalogPage(
  productTypes: string[] | null,
  filters: CatalogFilters,
  cursor?: string,
  facetCursor?: string,
) {
  const controller = new AbortController();
  const deadline = setTimeout(
    () => controller.abort(new Error('Shopify catalog request timed out.')),
    CATALOG_DEADLINE_MS,
  );
  try {
    const [results, facetPage] = await Promise.all([
      getMatchingPage(productTypes, filters, cursor, controller.signal),
      getFacetPage(productTypes, filters, facetCursor, controller.signal),
    ]);
    return { ...results, ...facetPage };
  } finally {
    controller.abort();
    clearTimeout(deadline);
  }
}

async function getMatchingPage(
  productTypes: string[] | null,
  filters: CatalogFilters,
  cursor: string | undefined,
  signal: AbortSignal,
) {
  const scope = cursorScope([productTypes, filters]);
  let after = decodeCursor(cursor, scope);
  const isContinuation = Boolean(after);
  const products: ProductListItem[] = [];
  let hasNextPage = false;
  let endCursor: string | null = null;
  const visited = new Set<string>(after ? [after] : []);
  const ids = new Set<string>();

  for (let batch = 0; batch < MAX_CANDIDATE_BATCHES; batch += 1) {
    signal.throwIfAborted();
    const candidates: { products: CatalogCandidate[]; hasNextPage: boolean } =
      process.env.PREVIEW_DEMO_MODE === '1'
        ? demoCandidates(productTypes, filters, after)
        : await shopifyCandidates(productTypes, filters, signal, after);
    hasNextPage = candidates.hasNextPage;
    for (let index = 0; index < candidates.products.length; index += 1) {
      const candidate = candidates.products[index];
      endCursor = candidate.cursor;
      hasNextPage = index + 1 < candidates.products.length || candidates.hasNextPage;
      signal.throwIfAborted();
      const matches = candidate.node
        ? await matchesShopifyProduct(candidate.node, filters, signal)
        : matchesDemoProduct(candidate.item, filters);
      if (matches && !ids.has(candidate.item.id)) {
        ids.add(candidate.item.id);
        products.push(candidate.item);
      }
      if (products.length === CANDIDATE_BATCH_SIZE) break;
    }
    if (hasNextPage && (!endCursor || visited.has(endCursor)))
      throw new Error('Shopify catalog pagination did not advance.');
    if (endCursor) visited.add(endCursor);
    if (!hasNextPage || products.length === CANDIDATE_BATCH_SIZE) break;
    after = endCursor ?? undefined;
  }
  return {
    products,
    hasNextPage,
    isContinuation,
    endCursor: hasNextPage && endCursor ? encodeCursor(scope, endCursor) : null,
  };
}

function demoCandidates(productTypes: string[] | null, filters: CatalogFilters, after?: string) {
  const candidates = PREVIEW_PRODUCTS.filter(
    (product) => !productTypes?.length || productTypes.includes(product.productType),
  );
  const { sortKey, reverse } = getSortVariables(filters.sort);
  const sorted =
    sortKey === 'PRICE'
      ? [...candidates].sort(
          (a, b) => (Number(a.minPrice.amount) - Number(b.minPrice.amount)) * (reverse ? -1 : 1),
        )
      : reverse
        ? [...candidates].reverse()
        : candidates;
  const offset = after ? Number(after.slice('preview:'.length)) : 0;
  const page = previewPage(sorted, CANDIDATE_BATCH_SIZE, after);
  return {
    hasNextPage: page.hasNextPage,
    products: page.items.map((item, index) => ({ item, cursor: `preview:${offset + index + 1}` })),
  };
}

async function shopifyCandidates(
  productTypes: string[] | null,
  filters: CatalogFilters,
  signal: AbortSignal,
  after?: string,
) {
  const { sortKey, reverse } = getSortVariables(filters.sort);
  const { data, errors } = await getStorefrontClient().request(GET_CATALOG_PRODUCTS_QUERY, {
    signal,
    variables: {
      first: CANDIDATE_BATCH_SIZE,
      after: after ?? null,
      query: buildProductSearchQuery({ productTypes }) ?? null,
      sortKey: sortKey as ProductSortKeys | undefined,
      reverse,
    },
  });
  if (errors) throw toRequestError(errors);
  if (!data?.products) throw new Error('Shopify catalog response is incomplete.');
  if (data.products.pageInfo.hasNextPage && !data.products.edges.length)
    throw new Error('Shopify catalog pagination did not advance.');
  return {
    hasNextPage: data.products.pageInfo.hasNextPage,
    products: data.products.edges.map(({ node, cursor }) => ({
      node,
      cursor,
      item: {
        id: node.id,
        handle: node.handle,
        title: node.title,
        productType: node.productType,
        tags: node.tags,
        minPrice: node.priceRange.minVariantPrice,
        availableForSale: node.availableForSale,
        images: node.images.edges.map(({ node: image }) => ({
          url: image.url,
          altText: image.altText ?? null,
          width: image.width ?? null,
          height: image.height ?? null,
        })),
      },
    })),
  };
}

function matchesDemoProduct(item: ProductListItem, filters: CatalogFilters) {
  return (
    (!filters.collections?.length ||
      getPreviewProductCollections(item.handle).some((collection) =>
        filters.collections?.includes(collection.handle),
      )) &&
    matchesCatalogVariant(getPreviewProductDetail(item.handle)!, filters)
  );
}

async function matchesShopifyProduct(
  product: CatalogNode,
  filters: CatalogFilters,
  signal: AbortSignal,
) {
  if (
    filters.collections?.length &&
    !(await matchesCollections(product, filters.collections, signal))
  )
    return false;
  if (
    !filters.sizes?.length &&
    !filters.colors?.length &&
    filters.minPrice === undefined &&
    filters.maxPrice === undefined
  )
    return !filters.available || product.availableForSale;
  let variants = product.variants;
  const visited = new Set<string>();
  while (true) {
    if (matchesCatalogVariant(toProductDetail({ ...product, variants }), filters)) return true;
    if (!variants.pageInfo?.hasNextPage) return false;
    signal.throwIfAborted();
    const after = variants.pageInfo.endCursor;
    if (!after || visited.has(after))
      throw new Error('Shopify variant pagination did not advance.');
    visited.add(after);
    const { data, errors } = await getStorefrontClient().request(GET_PRODUCT_VARIANTS_QUERY, {
      signal,
      variables: { handle: product.handle, after },
    });
    if (errors) throw toRequestError(errors);
    if (!data?.product?.variants.pageInfo)
      throw new Error('Shopify variant continuation is incomplete.');
    variants = data.product.variants;
  }
}

async function matchesCollections(product: CatalogNode, handles: string[], signal: AbortSignal) {
  let connection = product.collections;
  const visited = new Set<string>();
  while (true) {
    if (connection.nodes.some((collection) => handles.includes(collection.handle))) return true;
    if (!connection.pageInfo.hasNextPage) return false;
    signal.throwIfAborted();
    const after = connection.pageInfo.endCursor;
    if (!after || visited.has(after))
      throw new Error('Shopify collection pagination did not advance.');
    visited.add(after);
    const { data, errors } = await getStorefrontClient().request(GET_PRODUCT_COLLECTIONS_QUERY, {
      signal,
      variables: { handle: product.handle, after },
    });
    if (errors) throw toRequestError(errors);
    if (!data?.product) throw new Error('Shopify collection continuation is incomplete.');
    connection = data.product.collections;
  }
}

async function getFacetPage(
  productTypes: string[] | null,
  filters: CatalogFilters,
  cursor: string | undefined,
  signal: AbortSignal,
) {
  const scope = cursorScope(['facets', productTypes]);
  const after = decodeCursor(cursor, scope);
  const facets: CatalogFacets = {
    sizes: [...(filters.sizes ?? [])],
    colors: [...(filters.colors ?? [])],
    collections: (filters.collections ?? []).map((handle) => ({ handle, title: handle })),
  };
  let hasNextPage: boolean;
  let endCursor: string | null;
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const page = previewPage(
      PREVIEW_PRODUCTS.filter(
        (product) => !productTypes?.length || productTypes.includes(product.productType),
      ),
      CANDIDATE_BATCH_SIZE,
      after,
    );
    for (const item of page.items)
      addFacets(
        facets,
        getPreviewProductDetail(item.handle)!.options,
        getPreviewProductCollections(item.handle),
      );
    hasNextPage = page.hasNextPage;
    endCursor = page.endCursor;
  } else {
    const { data, errors } = await getStorefrontClient().request(GET_CATALOG_FACETS_QUERY, {
      signal,
      variables: {
        first: CANDIDATE_BATCH_SIZE,
        after: after ?? null,
        query: buildProductSearchQuery({ productTypes }) ?? null,
      },
    });
    if (errors) throw toRequestError(errors);
    if (!data?.products) throw new Error('Shopify facet response is incomplete.');
    for (const { node } of data.products.edges)
      addFacets(
        facets,
        node.options.map((option) => ({
          name: option.name,
          values: option.optionValues.map((value) => value.name),
        })),
        await collectFacetCollections(node, signal),
      );
    hasNextPage = data.products.pageInfo.hasNextPage;
    endCursor = data.products.pageInfo.endCursor ?? null;
    if (hasNextPage && (!data.products.edges.length || !endCursor || endCursor === after))
      throw new Error('Shopify facet pagination did not advance.');
  }
  return {
    facets: {
      sizes: [...new Set(facets.sizes)],
      colors: [...new Set(facets.colors)],
      collections: [
        ...new Map(
          facets.collections.map((collection) => [collection.handle, collection]),
        ).values(),
      ],
    },
    facetEndCursor: hasNextPage && endCursor ? encodeCursor(scope, endCursor) : null,
    isFacetContinuation: Boolean(after),
  };
}

function addFacets(
  facets: CatalogFacets,
  options: { name: string; values: string[] }[],
  collections: CatalogFacets['collections'],
) {
  for (const option of options) {
    if (/^size$/i.test(option.name.trim())) facets.sizes.push(...option.values);
    if (/^colou?r$/i.test(option.name.trim())) facets.colors.push(...option.values);
  }
  facets.collections.push(...collections);
}

async function collectFacetCollections(
  product: {
    handle: string;
    collections: {
      nodes: CatalogFacets['collections'];
      pageInfo: { hasNextPage: boolean; endCursor?: string | null };
    };
  },
  signal: AbortSignal,
) {
  let connection = product.collections;
  const collections = [...connection.nodes];
  const visited = new Set<string>();
  while (connection.pageInfo.hasNextPage) {
    signal.throwIfAborted();
    const after = connection.pageInfo.endCursor;
    if (!after || visited.has(after))
      throw new Error('Shopify facet membership pagination did not advance.');
    visited.add(after);
    const { data, errors } = await getStorefrontClient().request(GET_PRODUCT_COLLECTIONS_QUERY, {
      signal,
      variables: { handle: product.handle, after },
    });
    if (errors) throw toRequestError(errors);
    if (!data?.product) throw new Error('Shopify facet membership continuation is incomplete.');
    connection = data.product.collections;
    collections.push(...connection.nodes);
  }
  return collections;
}

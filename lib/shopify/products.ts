import { getStorefrontClient, toRequestError } from '@/lib/shopify/client';
import {
  GET_PRODUCT_QUERY,
  GET_PRODUCTS_BY_COLLECTION_QUERY,
  GET_PRODUCTS_QUERY,
} from '@/lib/shopify/queries/products';
import type { ProductSortKeys } from '@/lib/shopify/storefront.types';
// No explicit <ReturnType, Variables> generics on client.request() below: this
// client infers both from the query-string literal via the StorefrontQueries
// map that storefront.generated.d.ts augments onto '@shopify/storefront-api-client'
// (verified against its actual .d.ts — request<TData, Operation extends keyof
// Operations>() takes an optional return-type override and an Operation key
// inferred from the call site, not a (ReturnType, Variables) pair; passing both
// explicitly, as originally planned, fails typecheck because Variables doesn't
// satisfy the Operation-key constraint).

export interface ProductImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
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
  options: ProductOption[];
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
 * Throws if the Storefront API response includes `errors` (e.g. a bad
 * field, a throttled request) — that is a real failure, not a not-found
 * case, and is never swallowed or misreported as one.
 */
export async function getProduct(handle: string): Promise<ProductDetail | null> {
  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_PRODUCT_QUERY, {
    variables: { handle },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const product = data?.product;
  if (!product) return null;

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    productType: product.productType,
    tags: product.tags,
    minPrice: product.priceRange.minVariantPrice,
    images: product.images.edges.map(({ node }) => ({
      url: node.url,
      altText: node.altText ?? null,
      width: node.width ?? null,
      height: node.height ?? null,
    })),
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    variants: product.variants.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      availableForSale: node.availableForSale,
      quantityAvailable: node.quantityAvailable ?? null,
      price: node.price,
      selectedOptions: node.selectedOptions,
    })),
  };
}

/**
 * Fetches a page of products belonging to a collection, for catalog/grid
 * views. `first`/`after` paginate the collection's *products*, not the
 * collections themselves — cursor-paginated per the Storefront API's
 * standard pattern. Returns null if no collection matches `handle` (vs.
 * an empty `products` array for a real, empty collection) — mirrors
 * getCollection's null-on-missing contract so a bogus handle can't be
 * mistaken for a collection that simply has no products yet. Throws if
 * the Storefront API response includes `errors` (e.g. a bad field, a
 * throttled request) — that is a real failure, not a not-found case, and
 * is never swallowed or misreported as one.
 */
export async function getProductsByCollection(
  handle: string,
  first = 24,
  after?: string,
): Promise<{ products: ProductSummary[]; hasNextPage: boolean; endCursor: string | null } | null> {
  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_PRODUCTS_BY_COLLECTION_QUERY, {
    variables: { handle, first, after: after ?? null },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const collection = data?.collection;
  if (!collection) return null;

  return {
    products: collection.products.edges.map(({ node }) => {
      const image = node.images.edges[0]?.node;
      return {
        id: node.id,
        handle: node.handle,
        title: node.title,
        productType: node.productType,
        tags: node.tags,
        minPrice: node.priceRange.minVariantPrice,
        image: image
          ? {
              url: image.url,
              altText: image.altText ?? null,
              width: image.width ?? null,
              height: image.height ?? null,
            }
          : null,
      };
    }),
    hasNextPage: collection.products.pageInfo.hasNextPage,
    endCursor: collection.products.pageInfo.endCursor ?? null,
  };
}

export interface ProductListItem {
  id: string;
  handle: string;
  title: string;
  productType: string;
  tags: string[];
  minPrice: { amount: string; currencyCode: string };
  availableForSale: boolean;
  images: ProductImage[];
}

export interface GetProductsOptions {
  query?: string;
  // Plain string literals, not the generated ProductSortKeys enum: that
  // enum is only ever `import type`-able here (storefront.types.d.ts has
  // no corresponding runtime .js for its enum members to be referenced as
  // values from), and only these two members are ever produced by
  // lib/catalog/filters.ts's getSortVariables. Cast at the one point below
  // where this crosses into the generated GraphQL variable type.
  sortKey?: 'CREATED_AT' | 'PRICE';
  reverse?: boolean;
  first?: number;
  after?: string;
}

/**
 * Fetches a page of products from Shopify's root `products` connection,
 * filtered/sorted by the given search-query string and sort variables.
 * Used by category listing pages, which filter by product type rather
 * than a specific Collection (DECISIONS.md D-023, ARCHITECTURE.md §5) —
 * lib/catalog/taxonomy.ts and lib/catalog/filters.ts build the `query`/
 * `sortKey`/`reverse` options this function just passes through.
 *
 * Deliberately separate from getProductsByCollection: different query
 * shape (root products vs. a collection's products), different result
 * shape (ProductListItem carries availableForSale, for the Availability
 * filter and the SOLD OUT badge, and up to two images, for the product
 * card's hover crossfade — neither of which ProductSummary needs for its
 * own, unrelated PDP/collection-page use). Throws if the Storefront API
 * response includes `errors` — same contract as every other fetch
 * function in this file.
 */
export async function getProducts(
  options: GetProductsOptions = {},
): Promise<{ products: ProductListItem[]; hasNextPage: boolean; endCursor: string | null }> {
  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_PRODUCTS_QUERY, {
    variables: {
      first: options.first ?? 24,
      after: options.after ?? null,
      query: options.query ?? null,
      sortKey: (options.sortKey as ProductSortKeys | undefined) ?? null,
      reverse: options.reverse ?? null,
    },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const connection = data?.products;

  return {
    products: (connection?.edges ?? []).map(({ node }) => ({
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
    })),
    hasNextPage: connection?.pageInfo?.hasNextPage ?? false,
    endCursor: connection?.pageInfo?.endCursor ?? null,
  };
}

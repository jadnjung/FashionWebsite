import { getStorefrontClient, toRequestError } from '@/lib/shopify/client';
import {
  GET_COLLECTION_PRODUCT_LIST_ITEMS_QUERY,
  GET_PREDICTIVE_SEARCH_QUERY,
  GET_PRODUCT_QUERY,
  GET_PRODUCTS_BY_COLLECTION_QUERY,
  GET_PRODUCTS_QUERY,
} from '@/lib/shopify/queries/products';
import type { ProductSortKeys } from '@/lib/shopify/storefront.types';
// Demo Mode (PREVIEW_DEMO_MODE) — see preview-demo-fixtures.ts's file
// header and DECISIONS.md D-057 for what this is, why it exists, and how
// it's scoped (opt-in, off by default everywhere). This import and the
// short-circuits below are the only places this file branches on it.
import {
  PREVIEW_PRODUCTS,
  getPreviewProductDetail,
  getPreviewProductListItemsByCollection,
  getPreviewProductsByCollection,
} from '@/lib/shopify/preview-demo-fixtures';
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
  description: string;
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
  // Demo Mode short-circuit — see the import above and DECISIONS.md D-057.
  // Never reaches getStorefrontClient() below, so it never requires (or
  // risks touching) real Shopify credentials.
  if (process.env.PREVIEW_DEMO_MODE === '1') return getPreviewProductDetail(handle);
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
  // Demo Mode short-circuit — see the import above and DECISIONS.md D-057.
  // Never reaches getStorefrontClient() below, so it never requires (or
  // risks touching) real Shopify credentials.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const products = getPreviewProductsByCollection(handle);
    if (!products) return null;
    return { products, hasNextPage: false, endCursor: null };
  }
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
        description: node.description,
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

/**
 * Fetches a page of a collection's products shaped for direct ProductGrid/
 * ProductCard consumption (availableForSale + up to 2 images), unlike
 * getProductsByCollection's ProductSummary shape above (single image, no
 * availableForSale — correct for Archive's inert ArchivedProductTile, but
 * structurally insufficient for a real, interactive product card's SOLD
 * OUT badge and hover crossfade). Built for
 * app/(storefront)/collections/[handle]'s unlocked CollectionView, whose
 * products are live and purchasable, unlike Archive's historical record.
 * Same null-on-missing-collection / throw-on-real-error contract as
 * getProductsByCollection.
 */
export async function getProductListItemsByCollection(
  handle: string,
  first = 24,
  after?: string,
): Promise<{ products: ProductListItem[]; hasNextPage: boolean; endCursor: string | null } | null> {
  // Demo Mode short-circuit — see the import above and DECISIONS.md D-057.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const products = getPreviewProductListItemsByCollection(handle);
    if (!products) return null;
    return { products, hasNextPage: false, endCursor: null };
  }
  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_COLLECTION_PRODUCT_LIST_ITEMS_QUERY, {
    variables: { handle, first, after: after ?? null },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const collection = data?.collection;
  if (!collection) return null;

  return {
    products: collection.products.edges.map(({ node }) => ({
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
    hasNextPage: collection.products.pageInfo.hasNextPage,
    endCursor: collection.products.pageInfo.endCursor ?? null,
  };
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
  // Demo Mode short-circuit — see the import above and DECISIONS.md D-057.
  // Filters by the same product_type:"X" query string category pages and
  // the Interactive Model already build (DECISIONS.md D-023/D-034), so
  // top/bottom hotspot regions resolve to different fixture products
  // instead of colliding on the same one. Also respects `first` —
  // omitting this caused a real, reproducible layout bug in
  // SelectedPieces.tsx: it expects at most 3 products (one large + two
  // small, DESIGN_SYSTEM.md §33), and the real getSelectedPieces() already
  // requests exactly that (SELECTED_PIECES_COUNT = 3); ignoring `first`
  // here fed it all 6 fixture products instead, stacking 5 of them in its
  // narrow right-hand column and leaving a huge gap under the single left
  // column item. Caught by reproducing it live, not just reading the diff
  // — see this file's own products.test.ts, "getProducts — Demo Mode",
  // for regression coverage.
  //
  // Also respects `sortKey`/`reverse` — the same real bug class as `first`
  // above (reproduced live: PRICE: LOW TO HIGH/HIGH TO LOW on /tops and
  // /bottoms silently did nothing). lib/catalog/filters.ts's
  // getSortVariables only ever produces sortKey: 'PRICE' (price-asc:
  // reverse false, price-desc: reverse true) or sortKey: 'CREATED_AT'
  // (newest: reverse true) or no sortKey at all (featured: reverse
  // false) — PRICE is sorted for real against each fixture's minPrice;
  // CREATED_AT/featured have no real creation-date equivalent in static
  // fixture data, so `reverse` there only flips the fixed array order,
  // an honest approximation rather than fabricating dates.
  //
  // Also parses each clause of `options.query` independently and applies
  // it as its own predicate (AND semantics, matching buildProductSearchQuery's
  // own ' AND '-joined clauses) — the same real bug class again: this
  // short-circuit used to treat the *entire* query string as a single
  // `includes('"<productType>"')` check, so Availability
  // (`available_for_sale:true`) and Price (`variants.price:>=N`/`<=N`) had
  // zero effect in Demo Mode even though their UI (FilterBar.tsx) was fully
  // wired. Price is compared against each fixture's minPrice, the same
  // approximation the sort branch above already uses. Deliberately does
  // NOT treat "a query string is present" as "a product-type filter was
  // requested" — /new has no product-type taxonomy at all
  // (getCategoryProductTypes('new') is null), so `/new?available=1` builds
  // a query with only `available_for_sale:true` and no `product_type:`
  // clause; applying a product-type predicate whenever `options.query` is
  // merely non-empty would wrongly exclude every fixture on that route.
  // A query that matches zero fixtures now returns an empty page rather
  // than falling back to the full, unfiltered catalog — the previous
  // fallback made `/tops/hoodies` (a real, nav-linked route with zero
  // Hoodies fixtures) render all 6 fixtures instead of the site's own
  // "NOTHING HERE YET." empty state.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const query = options.query;
    const wantedTypes = query
      ? Array.from(query.matchAll(/product_type:"([^"]+)"/g), (m) => m[1])
      : undefined;
    const wantsAvailable = query?.includes('available_for_sale:true') ?? false;
    const minPriceMatch = query?.match(/variants\.price:>=([\d.]+)/);
    const maxPriceMatch = query?.match(/variants\.price:<=([\d.]+)/);
    const minPrice = minPriceMatch ? Number(minPriceMatch[1]) : undefined;
    const maxPrice = maxPriceMatch ? Number(maxPriceMatch[1]) : undefined;

    const base = PREVIEW_PRODUCTS.filter((p) => {
      if (wantedTypes?.length && !wantedTypes.includes(p.productType)) return false;
      if (wantsAvailable && !p.availableForSale) return false;
      const price = Number(p.minPrice.amount);
      if (minPrice !== undefined && price < minPrice) return false;
      if (maxPrice !== undefined && price > maxPrice) return false;
      return true;
    });
    const sorted =
      options.sortKey === 'PRICE'
        ? [...base].sort((a, b) => {
            const diff = Number(a.minPrice.amount) - Number(b.minPrice.amount);
            return options.reverse ? -diff : diff;
          })
        : options.reverse
          ? [...base].reverse()
          : base;
    const page = sorted.slice(0, options.first ?? 24);
    return {
      products: page,
      hasNextPage: false,
      endCursor: null,
    };
  }
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

export interface SearchProductsOptions {
  limit?: number;
}

/**
 * Predictive product search for the full-screen search overlay — a
 * distinct query path from getProducts (see DECISIONS.md D-058 and the
 * design spec). Returns [] for a blank/whitespace-only query without ever
 * calling getStorefrontClient() — an empty search is not a "Shopify not
 * configured" error. Throws via toRequestError on a real Storefront API
 * error, exactly like every other fetch function in this file — never
 * swallowed here; the caller (app/api/search/route.ts) decides how to
 * surface that to its own client, since this function has no page-level
 * error boundary to rely on the way a Server Component caller would.
 */
export async function searchProducts(
  query: string,
  options: SearchProductsOptions = {},
): Promise<ProductListItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const limit = options.limit ?? 6;

  // Demo Mode short-circuit — DECISIONS.md D-057, extended by D-058. Same
  // never-calls-getStorefrontClient() contract as getProduct/getProducts.
  if (process.env.PREVIEW_DEMO_MODE === '1') {
    const q = trimmed.toLowerCase();
    return PREVIEW_PRODUCTS.filter(
      (p) => p.title.toLowerCase().includes(q) || p.productType.toLowerCase().includes(q),
    ).slice(0, limit);
  }

  const client = getStorefrontClient();
  const { data, errors } = await client.request(GET_PREDICTIVE_SEARCH_QUERY, {
    variables: { query: trimmed, limit },
  });

  if (errors) {
    throw toRequestError(errors);
  }

  const products = data?.predictiveSearch?.products ?? [];
  return products.map((node) => ({
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
  }));
}

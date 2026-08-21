import { getStorefrontClient } from '@/lib/shopify/client';
import {
  GET_PRODUCT_QUERY,
  GET_PRODUCTS_BY_COLLECTION_QUERY,
} from '@/lib/shopify/queries/products';
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
  const { data, errors } = await client.request(GET_PRODUCT_QUERY, {
    variables: { handle },
  });

  if (errors) {
    throw new Error(`Shopify Storefront API request failed: ${errors.message ?? 'Unknown error'}`);
  }

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
    images: product.images.edges.map(({ node }) => ({
      url: node.url,
      altText: node.altText ?? null,
      width: node.width ?? null,
      height: node.height ?? null,
    })),
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
  const { data, errors } = await client.request(GET_PRODUCTS_BY_COLLECTION_QUERY, {
    variables: { handle, first, after: after ?? null },
  });

  if (errors) {
    throw new Error(`Shopify Storefront API request failed: ${errors.message ?? 'Unknown error'}`);
  }

  const edges = data?.collection?.products?.edges ?? [];

  return {
    products: edges.map(({ node }) => {
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
    hasNextPage: data?.collection?.products?.pageInfo?.hasNextPage ?? false,
    endCursor: data?.collection?.products?.pageInfo?.endCursor ?? null,
  };
}

// #graphql-tagged query documents for Product data. graphql-codegen
// (.graphqlrc.ts) scans this file and generates matching TypeScript
// types into storefront.generated.d.ts (query/variable types) and
// storefront.types.d.ts (full schema types) — never hand-edit those.

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
      options {
        id
        name
        optionValues {
          id
          name
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            availableForSale
            quantityAvailable
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

// Root products connection, filtered by product type (not a Collection —
// see DECISIONS.md D-023, ARCHITECTURE.md §5) — used by category listing
// pages (lib/catalog/taxonomy.ts + lib/catalog/filters.ts build the
// $query/$sortKey/$reverse variables). Distinct from
// GET_PRODUCTS_BY_COLLECTION_QUERY above: a different connection entirely,
// and this one also fetches availableForSale + a 2nd image, for the
// Availability filter/SOLD OUT badge and the product card's hover
// crossfade, which the collection-scoped query above has no consumer that
// needs yet.
export const GET_PRODUCTS_QUERY = `#graphql
  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        cursor
        node {
          id
          handle
          title
          productType
          tags
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 2) {
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
`;

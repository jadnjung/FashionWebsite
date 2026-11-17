// Full Search uses independent connections. Shopify's search union includes
// products, pages and articles, while collection title search uses collections.
// Shopify caps search at 1,000 matches. The UI uses page counts and explains
// that ceiling so broad search never promises exhaustive catalog enumeration.
export const GET_FULL_SEARCH_QUERY = `#graphql
  query GetFullSearch($query: String!, $collectionQuery: String!, $first: Int!, $productAfter: String, $collectionAfter: String) {
    products: search(query: $query, first: $first, after: $productAfter, types: [PRODUCT], prefix: LAST, sortKey: RELEVANCE, unavailableProducts: LAST) {
      edges {
        cursor
        node {
          __typename
          ... on Product {
            id
            handle
            title
            productType
            tags
            availableForSale
            priceRange { minVariantPrice { amount currencyCode } }
            images(first: 2) { edges { node { url altText width height } } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
    collections(query: $collectionQuery, first: $first, after: $collectionAfter, sortKey: RELEVANCE) {
      edges {
        cursor
        node {
          id
          handle
          title
          dropStatus: metafield(namespace: "custom", key: "drop_status") { value }
          dropDate: metafield(namespace: "custom", key: "drop_date") { value }
          archivedAt: metafield(namespace: "custom", key: "archived_at") { value }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

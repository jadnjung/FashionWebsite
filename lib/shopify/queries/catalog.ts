// Category pages need variant tuples for intersection filtering. Keep this
// separate so homepage/search consumers retain their lighter product query.
export const GET_CATALOG_PRODUCTS_QUERY = `#graphql
  query GetCatalogProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        cursor
        node {
          id handle title description productType tags availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 2) { edges { node { url altText width height } } }
          options { id name optionValues { id name } }
          collections(first: 250) { nodes { handle title } pageInfo { hasNextPage endCursor } }
          variants(first: 100) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id title availableForSale quantityAvailable
                price { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const GET_PRODUCT_COLLECTIONS_QUERY = `#graphql
  query GetProductCollections($handle: String!, $after: String!) {
    product(handle: $handle) {
      collections(first: 250, after: $after) {
        nodes { handle title }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

// Option discovery has its own bounded category cursor, independent of matching
// products, so a full first results page cannot hide later option values.
export const GET_CATALOG_FACETS_QUERY = `#graphql
  query GetCatalogFacets($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          handle
          options { name optionValues { name } }
          collections(first: 250) { nodes { handle title } pageInfo { hasNextPage endCursor } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

// #graphql-tagged query documents for Collection data. graphql-codegen
// (.graphqlrc.ts) scans this file and generates matching TypeScript
// types into storefront.generated.d.ts (query/variable types) and
// storefront.types.d.ts (full schema types) — never hand-edit those.

export const GET_COLLECTION_QUERY = `#graphql
  query GetCollection($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      dropStatus: metafield(namespace: "custom", key: "drop_status") {
        value
      }
      dropDate: metafield(namespace: "custom", key: "drop_date") {
        value
      }
      archivedAt: metafield(namespace: "custom", key: "archived_at") {
        value
      }
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            handle
            title
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

export const GET_COLLECTIONS_QUERY = `#graphql
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          title
          dropStatus: metafield(namespace: "custom", key: "drop_status") {
            value
          }
          dropDate: metafield(namespace: "custom", key: "drop_date") {
            value
          }
          archivedAt: metafield(namespace: "custom", key: "archived_at") {
            value
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

// predictiveSearch, scoped to types: [COLLECTION] — the COLLECTIONS result
// group DECISIONS.md D-058 deliberately deferred (no /collections/[handle]
// route existed yet to link to). A separate query document from
// products.ts's GET_PREDICTIVE_SEARCH_QUERY (types: [PRODUCT]) rather than
// one combined query requesting both result types in one round-trip: that
// would couple an already-shipped, already-tested query to a new,
// unrelated consumer for no benefit. app/api/search/route.ts calls
// searchProducts/searchCollections together in one Promise.all, so keeping
// the two Storefront queries themselves separate costs no extra latency.
// Metafield sub-selection mirrors GET_COLLECTIONS_QUERY's shape immediately
// above (same "custom" namespace, same three keys) so searchCollections
// (lib/shopify/collections.ts) maps into the exact same CollectionSummary
// shape getCollections already produces — lib/collections/drop-phase.ts's
// getCollectionHref can then resolve a search result's link with zero
// reshaping at the call site.
export const GET_COLLECTION_PREDICTIVE_SEARCH_QUERY = `#graphql
  query CollectionPredictiveSearch($query: String!, $limit: Int) {
    predictiveSearch(query: $query, limit: $limit, types: [COLLECTION]) {
      collections {
        id
        handle
        title
        dropStatus: metafield(namespace: "custom", key: "drop_status") {
          value
        }
        dropDate: metafield(namespace: "custom", key: "drop_date") {
          value
        }
        archivedAt: metafield(namespace: "custom", key: "archived_at") {
          value
        }
      }
    }
  }
`;
